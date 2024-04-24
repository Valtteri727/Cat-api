const express = require("express");
const path = require("path");
const fetch = require("node-fetch");
const exphbs = require("express-handlebars");
const mongoose = require("mongoose");
require("dotenv").config();
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 3000;

// Set up middleware to parse JSON requests
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

// Set up Handlebars view engine
app.engine(
  "hbs",
  exphbs.engine({
    extname: ".hbs",
  })
);
app.set("view engine", "hbs");

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "public")));

// Serve the index.hbs file located in the 'views' directory
app.get("/", (req, res) => {
  res.render("index", { layout: false });
});

// Serve likedcats.hbs when /likedcats path is accessed
app.get("/likedcats", (req, res) => {
  res.render("likedcats", { layout: false }); // Assuming likedcats.hbs is in your views directory
});

// Sample endpoint to fetch cat images
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

    // Extract relevant information from the API response
    const catInfo = fetchedCatData.map((cat) => {
      return {
        imageUrl: cat.url,
        breed: cat.breeds.name,
        description: cat.breeds.description,
        origin: cat.breeds.origin
      };
    });

    try {
      await likedCats.create(catInfo);
      console.log("Cat info saved successfully");
    } catch (error) {
      console.error("Error saving cat info to database:", error);
    }

    // Send the cat information back to the client
    res.json(catInfo);
  } catch (error) {
    console.error("Error fetching cat images:", error);
    res.status(500).json({ error: "Failed to fetch cat images" });
  }
});

app.post("/api/dislike-cat", async (req, res) => {
  try {
    const { imageUrl, breed, description, origin } = req.body;

    // Check if this cat info exists in likedCats collection
    let existingCat = await likedCats.findOne({ imageUrl, breed, description, origin });

    if (existingCat) {
      return res.status(200).json({ message: "Cat disliked" });
    } else {
      // Cat not found in likedCats, create a new entry with liked = false
      existingCat = await likedCats.create({
        imageUrl,
        breed,
        description,
        origin,
        liked: false,
      });

      //console.log("Cat disliked (new entry created):", existingCat);
      return res
        .status(200)
        .json({ message: "Cat disliked (new entry created)" });
    }
  } catch (error) {
    //console.error("Error disliking the cat:", error);
    res.status(500).json({ error: "Failed to dislike the cat" });
  }
});

app.post("/api/like-cat", async (req, res) => {
  try {
    const { imageUrl, breed, description, origin } = req.body;

    // Check if this cat info already exists in likedCats collection
    const existingCat = await likedCats.findOne({ imageUrl, breed, description, origin });

    if (existingCat) {
      if (existingCat.liked) {
        //console.log("Cat already liked:", existingCat);
        return res.status(200).json({ message: "Cat already liked" });
      } else {
        // If the cat is found but not already liked (liked is false), do not change the liked value
        //console.log("Cat is not liked (liked value is false):", existingCat);
        return res
          .status(200)
          .json({ message: "Cat is not changed (already disliked)" });
      }
    } else {
      // If the cat info does not exist, save a new liked cat entry
      const newLikedCat = await likedCats.create({
        imageUrl,
        breed,
        description,
        origin,
        liked: true,
      });
      //console.log("New cat liked and saved:", newLikedCat);

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

// Add a new route to fetch liked cats data
app.get("/api/liked-cats", async (req, res) => {
  try {
    // Fetch all liked cats from the database
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

app.post("/submit-form", async (req, res) => {
  const { email } = req.body;
  console.log(email);
  try {
    // Retrieve cat data from MongoDB
    const catsData = await likedCats.find({ liked: { $eq: true } }); // Example: Retrieve all cat data

    // Prepare email text using retrieved data
    let emailText = "Here are the cats you were interested in:\n";
    catsData.forEach((cat) => {
      emailText += `Breed: ${cat.breed}\nDesciption: ${cat.description}\nOrigin: ${cat.origin}\nImage URL: ${cat.imageUrl}\n\n`;
    });

    // Create reusable transporter object using SMTP transport with SMTP2GO
    let transporter = nodemailer.createTransport({
      host: "smtp.smtp2go.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.user,
        pass: process.env.password,
      },
    });

    // Define email message
    let mailOptions = {
      from: "joni22005@student.hamk.fi",
      to: email,
      subject: "Adoption request",
      text: emailText, // Use formatted email text with cat details
    };

    // Send email
    let info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    res.send("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).send("Failed to send email.");
  }
});
