const mongoose = require("mongoose");

const likedCatsSchema = new mongoose.Schema({
  imageUrl: {
    type: String,
    required: true,
  },
  breed: {
    type: String,
    required: true,
  },
  description: {
    type: String
  },
  origin: {
    type: String
  },
  liked: { 
    type: Boolean, 
    default: null },
});

module.exports = mongoose.model("likedCats", likedCatsSchema);
