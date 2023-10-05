const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const conversationSchema = new Schema({
    participants: {
        type: Array,
        required: true
    },
    messages: {
        type: Array,
        required: true
    },
});

const conversation = mongoose.model("ft-conversations", conversationSchema);
module.exports = conversation;