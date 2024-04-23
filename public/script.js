const api_key =
  "live_d9e8xU3Yj9skslxxiyCSgbqtcwxGgDOAsEDF3cF23JepG2xV3HdJLsRSmoJ8znv6";

// Function to fetch new cat images and swipe
function refreshCatImageAndSwipe(url, direction) {
  let currentCatImage = document.querySelector(".first-cat");
  let nextCatImage = document.querySelector(".second-cat");

  fetch(url, {
    headers: {
      "x-api-key": api_key,
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      if (data.length >= 2) {
        let imageUrl1 = data[0].url;
        let imageUrl2 = data[1].url;

        nextCatImage.onload = function () {
          currentCatImage.style.transition = "transform 1s ease";
          if (direction === "left") {
            currentCatImage.style.transform = "translateX(-100%)";
          } else if (direction === "right") {
            currentCatImage.style.transform = "translateX(100%)";
          }
          setTimeout(() => {
            currentCatImage.src = nextCatImage.src;
            currentCatImage.style.transition = "none";
            currentCatImage.style.transform = "translateX(0)";
          }, 1000);
        };

        let breed = data[0].breeds[0].name;
        let description = data[0].breeds[0].description;
        let origin = data[0].breeds[0].origin;

        // Attach event listener to the like button for the current image
        const heartButton = document.querySelector(".heart-button");
        heartButton.addEventListener("click", () => {
          likeCat(imageUrl1, breed, description, origin); // Call a function to like the cat image when the button is clicked
          fetchLikedCats(imageUrl, breed, description, origin);
        });

        const BrokenHeartButton = document.querySelector(
          ".broken-heart-button"
        );
        BrokenHeartButton.addEventListener("click", () => {
          dislikeCat(imageUrl1, breed, description, origin); // Call a function to like the cat image when the button is clicked
        });

        // Preload the next image
        nextCatImage.src = direction === "left" ? imageUrl1 : imageUrl2;
      } else {
        throw new Error("Insufficient data received from API");
      }
    })
    .catch((error) => {
      console.error("Error fetching images:", error);
    });
}

// Function to like an image
// Function to dislike a cat image
function dislikeCat(imageUrl, breed, description, origin) {
  fetch("/api/dislike-cat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl, breed, description, origin }),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Cat image disliked successfully");
      } else {
        console.error("Failed to dislike the cat image");
      }
    })
    .catch((error) => console.error("Error:", error));
}

// Function to like an image
function likeCat(imageUrl, breed, description, origin) {
  fetch("/api/like-cat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl, breed, description, origin }),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Cat image liked successfully");
      } else {
        console.error("Failed to like the cat image");
      }
    })
    .catch((error) => console.error("Error:", error));
}

function fetchLikedCats(imageUrl, breed, description, origin) {
  fetch("/liked-cats", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ imageUrl, breed, description, origin }),
  })
    .then((response) => {
      if (response.ok) {
        console.log("Cat info fetched succesfully");
      } else {
        console.error("Failed to fetch information of the cats");
      }
    })
    .catch((error) => console.error("Error:", error));
}

// Initially load cat images when the page loads
window.onload = function () {
  refreshCatImageAndSwipe(
    "https://api.thecatapi.com/v1/images/search?limit=2&has_breeds=1",
    ""
  );
};
