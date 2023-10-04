const express = require("express");
const router = express.Router();

const {
    signup,
    login,
    getUser,
    getAllUsers,
    getAllPostsAndUsers,
    editProfileImage,
    changePassword
} = require("../controllers/mainController");
const {
    validateSignUp,
    validateLogIn,
    validateUser
} = require("../middleware/validators");

router.post("/signup", validateSignUp, signup);
router.post("/login", validateLogIn, login);
router.get("/getUser", validateUser, getUser);
router.get("/getAllUsers", validateUser, getAllUsers);
router.get("/getAllPostsAndUsers", getAllPostsAndUsers);
router.post("/newImage", validateUser, editProfileImage);
router.post("/newPassword", validateUser, changePassword);

module.exports = router;