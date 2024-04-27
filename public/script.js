const api_key =
  "live_d9e8xU3Yj9skslxxiyCSgbqtcwxGgDOAsEDF3cF23JepG2xV3HdJLsRSmoJ8znv6";

const loadingScreen = document.getElementById('loadingScreen');
const currentCatImage = document.querySelector(".first-cat");
const nextCatImage = document.querySelector(".second-cat");

// Luotiin latausikkuna sitä varten, että oikean kissan tiedot menisivät tietokantaan
// Aina sivulle mentäessä, ongelmana oli, ettei oikean kissan tiedot menneet tietokantaan siitä tykättäessä. Tämä korjaa sen
function showLoadingScreen() {
    loadingScreen.style.display = 'flex';
}

function hideLoadingScreen() {
    loadingScreen.style.display = 'none';
}

// Event listener sydän-painikekkeeseen (tykkäys-painike)
const heartButton = document.querySelector(".heart-button");
heartButton.addEventListener("click", likeCurrentCat);

// Event listener särkynyt sydän- painikkeeseen (ei tykkäys- painike)
const brokenHeartButton = document.querySelector(".broken-heart-button");
brokenHeartButton.addEventListener("click", dislikeCurrentCat);

// Funktio uuden kissan hakemiseen ja pyyhkäisemiseen
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
                    currentCatImage.setAttribute('data-breed', data[0].breeds[0].name);
                    currentCatImage.setAttribute('data-description', data[0].breeds[0].description)
                    currentCatImage.setAttribute('data-origin', data[0].breeds[0].origin)
                    currentCatImage.style.transition = "none";
                    currentCatImage.style.transform = "translateX(0)";
                }, 1000);
            };

            // Ladataan seuraava kuva valmiiksi
            nextCatImage.src = direction === "left" ? imageUrl1 : imageUrl2;
        } else {
            throw new Error("Insufficient data received from API");
        }
    })
    .then(() => {
        // Piilotetaan latausikkuna, kun kissojen kuvat ovat ladattu
        hideLoadingScreen();
    })
    .catch((error) => {
        console.error("Error fetching images:", error);
        hideLoadingScreen();
    });
}

// Funktio kissan tykkäämiselle (tämän hetkinen kissa)
function likeCurrentCat() {
    const imageUrl = currentCatImage.src;
    const breed = currentCatImage.getAttribute('data-breed');
    const description = currentCatImage.getAttribute('data-description');
    const origin = currentCatImage.getAttribute('data-origin');
    likeCat(imageUrl, breed, description, origin);
}

// Funtio kissan ei tykkäämiselle (tämän hetkinen kissa)
function dislikeCurrentCat() {
    const imageUrl = currentCatImage.src;
    const breed = currentCatImage.getAttribute('data-breed');
    const description = currentCatImage.getAttribute('data-description');
    const origin = currentCatImage.getAttribute('data-origin');
    dislikeCat(imageUrl, breed, description, origin);
}

// Funktio kissan ei tykkäämiselle
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

// Funktio kissan tykkäämiselle
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

window.onload = function() {
    showLoadingScreen();
    refreshCatImageAndSwipe('https://api.thecatapi.com/v1/images/search?limit=2&has_breeds=1', 'left');
};
