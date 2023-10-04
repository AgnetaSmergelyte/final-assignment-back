const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const postSchema = new Schema({
    author: {
        type: String,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true,
    },
    comments: {
        type: Array,
        required: true,
        default: []
    },
    likes: {
        type: Array,
        required: true,
        default: []
    },
    timestamp: {
        type: Number,
        required: true
    }
});

const user = mongoose.model("ft-posts", postSchema);
module.exports = user;