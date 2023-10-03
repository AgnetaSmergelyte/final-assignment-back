const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true,
        default: "https://static.thenounproject.com/png/5034901-200.png"
    },
});

const user = mongoose.model("users", userSchema);
module.exports = user;