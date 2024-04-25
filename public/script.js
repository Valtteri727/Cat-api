const api_key =
  "live_d9e8xU3Yj9skslxxiyCSgbqtcwxGgDOAsEDF3cF23JepG2xV3HdJLsRSmoJ8znv6";

const loadingScreen = document.getElementById('loadingScreen');
const currentCatImage = document.querySelector(".first-cat");
const nextCatImage = document.querySelector(".second-cat");

// Function to show the loading screen
function showLoadingScreen() {
    loadingScreen.style.display = 'flex';
}

// Function to hide the loading screen
function hideLoadingScreen() {
    loadingScreen.style.display = 'none';
}

// Attach event listener to the like button for the current image
const heartButton = document.querySelector(".heart-button");
heartButton.addEventListener("click", likeCurrentCat);

// Attach event listener to the dislike button for the current image
const brokenHeartButton = document.querySelector(".broken-heart-button");
brokenHeartButton.addEventListener("click", dislikeCurrentCat);

// Function to fetch new cat images and swipe
function refreshCatImageAndSwipe(url, direction) {
    

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
                    currentCatImage.setAttribute('data-breed', data[0].breeds[0].name); // origin = data[0].breeds[0].origin;
                    currentCatImage.setAttribute('data-description', data[0].breeds[0].description)
                    currentCatImage.setAttribute('data-origin', data[0].breeds[0].origin)
                    currentCatImage.style.transition = "none";
                    currentCatImage.style.transform = "translateX(0)";
                }, 1000);
            };

            // Preload the next image
            nextCatImage.src = direction === "left" ? imageUrl1 : imageUrl2;
        } else {
            throw new Error("Insufficient data received from API");
        }
    })
    .then(() => {
        // Hide loading screen after fetching cat images
        hideLoadingScreen();
    })
    .catch((error) => {
        console.error("Error fetching images:", error);
        hideLoadingScreen(); // Hide loading screen in case of error
    });
}

// Function to like the current cat image
function likeCurrentCat() {
    const imageUrl = currentCatImage.src;
    const breed = currentCatImage.getAttribute('data-breed'); // Get the breed from the data attribute
    const description = currentCatImage.getAttribute('data-description');
    const origin = currentCatImage.getAttribute('data-origin');
    likeCat(imageUrl, breed, description, origin);
}

// Function to dislike the current cat image
function dislikeCurrentCat() {
    const imageUrl = currentCatImage.src;
    const breed = currentCatImage.getAttribute('data-breed'); // Get the breed from the data attribute
    const description = currentCatImage.getAttribute('data-description');
    const origin = currentCatImage.getAttribute('data-origin');
    dislikeCat(imageUrl, breed, description, origin);
}

// Function to dislike a cat image
function dislikeCat(imageUrl, breed, description, origin ) {
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

// Initially load cat images when the page loads
window.onload = function() {
    // Initially show the loading screen
    showLoadingScreen();

    // Fetch cat images and swipe
    refreshCatImageAndSwipe('https://api.thecatapi.com/v1/images/search?limit=2&has_breeds=1', 'left');
};
