const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const exphbs = require("express-handlebars");
const mongoose = require("mongoose");
require("dotenv").config();
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware JSON pyyntöjen parsimiseen
app.use(express.json());

const dbURI =
  "mongodb+srv://" +
  process.env.DBUSERNAME +
  ":" +
  process.env.DBPASSWORD +
  "@" +
  process.env.CLUSTER +
  ".mongodb.net/";
console.log(dbURI);

mongoose
  .connect(dbURI)
  .then(() => {
    console.log("Connected to DB");
    app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
  })
  .catch((err) => {
    console.log(err);
  });

const likedCats = require("./models/liked-cats");

// Handlebars view engine
app.engine(
  "hbs",
  exphbs.engine({
    extname: ".hbs",
  })
);
app.set("view engine", "hbs");

app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.render("index", { layout: false });
});

app.get("/likedcats", (req, res) => {
  res.render("likedcats", { layout: false });
});

// Endpoint kissojen tietojen hakemiseen
app.get("/api/cats", async (req, res) => {
  const api_key =
    "live_d9e8xU3Yj9skslxxiyCSgbqtcwxGgDOAsEDF3cF23JepG2xV3HdJLsRSmoJ8znv6";
  const url = "https://api.thecatapi.com/v1/images/search?limit=2&has_breeds=1";

  try {
    const response = await fetch(url, {
      headers: {
        "x-api-key": api_key,
      },
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const fetchedCatData = await response.json();

    // Haetaan halutut tiedot cat API:sta
    const catInfo = fetchedCatData.map((cat) => {
      return {
        imageUrl: cat.url,
        breed: cat.breeds.name,
        description: cat.breeds.description,
        origin: cat.breeds.origin,
      };
    });

    try {
      await likedCats.create(catInfo);
      console.log("Cat info saved successfully");
    } catch (error) {
      console.error("Error saving cat info to database:", error);
    }

    res.json(catInfo);
  } catch (error) {
    console.error("Error fetching cat images:", error);
    res.status(500).json({ error: "Failed to fetch cat images" });
  }
});

app.post("/api/dislike-cat", async (req, res) => {
  try {
    const { imageUrl, breed, description, origin } = req.body;

    // Tarkistetaan, onko kissa jo olemassa tietokannassa
    let existingCat = await likedCats.findOne({
      imageUrl,
      breed,
      description,
      origin,
    });

    if (existingCat) {
      return res.status(200).json({ message: "Cat disliked" });
    } else {
      // Jos kissaa ei ole vielä olemassa, luodaan se ja asetetaan liked: false
      existingCat = await likedCats.create({
        imageUrl,
        breed,
        description,
        origin,
        liked: false,
      });

      return res
        .status(200)
        .json({ message: "Cat disliked (new entry created)" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to dislike the cat" });
  }
});

app.post("/api/like-cat", async (req, res) => {
  try {
    const { imageUrl, breed, description, origin } = req.body;

    // Tarkistetaan, onko kissa jo olemassa tietokannassa
    const existingCat = await likedCats.findOne({
      imageUrl,
      breed,
      description,
      origin,
    });

    if (existingCat) {
      if (existingCat.liked) {
        return res.status(200).json({ message: "Cat already liked" });
      } else {
        // Jos kissa löytyy tietokannasta, ja liked: false, arvoa ei muuteta
        return res
          .status(200)
          .json({ message: "Cat is not changed (already disliked)" });
      }
    } else {
      // Jos kissaa ei ole vielä olemassa, luodaan se ja asetetaan liked: true
      const newLikedCat = await likedCats.create({
        imageUrl,
        breed,
        description,
        origin,
        liked: true,
      });

      res.status(201).json({
        message: "Cat liked and saved to the database",
        likedCat: newLikedCat,
      });
    }
  } catch (error) {
    console.error("Error liking the cat:", error);
    res.status(500).json({ error: "Failed to like the cat" });
  }
});

// Lisätään uusi reitti kissojen tietojen hakemiselle
app.get("/api/liked-cats", async (req, res) => {
  try {
    // Haetaan kaikki kissojen tiedot tietokannasta, joista ollaan tykätty
    const likedCatsData = await likedCats.find({ liked: true });

    res.status(200).json(likedCatsData);
  } catch (error) {
    console.error("Error fetching liked cats:", error);
    res.status(500).json({ error: "Failed to fetch liked cats" });
  }
});

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get("/show-form", (req, res) => {
  res.render("form");
});

// Sähköpostin reitti. Lähettää sähköpostissa sen kissan tiedot, josta on kiinnostunut
app.post("/submit-form", async (req, res) => {
  const { email, breed, description, origin, imageUrl } = req.body;
  console.log(email);
  try {
    let emailText = "Here is the cat you were interested in:\n";
    emailText += `Breed: ${breed}\nDescription: ${description}\nOrigin: ${origin}\nImage URL: ${imageUrl}\n\n`;

    let transporter = nodemailer.createTransport({
      host: "smtp.smtp2go.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.user,
        pass: process.env.password,
      },
    });

    // Sähköpostiviestin määritys
    let mailOptions = {
      from: "joni22005@student.hamk.fi",
      to: email,
      subject: "Adoption request",
      text: emailText, // Kissan tiedot
    };

    // Lähetetään sähköposti
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);

    res.status(200).send("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Failed to send email.");
  }
});
