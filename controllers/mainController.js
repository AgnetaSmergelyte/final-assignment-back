const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userDb = require("../schemas/userSchema");

const resSend = (res, error, data, message) => {
    res.send({error, data, message});
}

module.exports = {
    signup: async (req, res) => {
        const {username, password, image} = req.body;
        const hash = await bcrypt.hash(password, 10);
        const user = new userDb({
            username,
            password: hash,
            image
        })
        try {
            await user.save();
            resSend(res, false, null, 'Registered');
        } catch (err) {
            resSend(res, true, null, 'Registration failed');
        }
    },
    login: async (req, res) => {
        const {username, password} = req.body;
        const userExists = await userDb.findOne({username});
        if (!userExists) {
            return resSend(res, true, null, 'Incorrect username or password');
        } else {
            const isValid = await bcrypt.compare(password, userExists.password);
            if (!isValid) return resSend(res, true, null, 'Incorrect username or password');
        }
        const user = {
            username,
            id: userExists._id
        }
        const token = jwt.sign(user, process.env.JWT_SECRET);
        const myUser = {
            username,
            id: userExists._id,
            image: userExists.image,
        }
        resSend(res, false, {user: myUser, token}, 'Logged in successfully');
    },
    getUser: async (req, res) => {
        const user = req.user;
        const userLegit = await userDb.findOne({_id: user.id});
        if (!userLegit) return resSend(res, true, null, 'Bad token');
        const myUser = {
            username: userLegit.username,
            id: userLegit._id,
            image: userLegit.image,
            money: userLegit.money,
            inventory: userLegit.inventory
        }
        resSend(res, false, myUser, '');
    },
    editProfileImage: async (req, res) => {
        const {image} = req.body;
        const user = req.user;
        try {
            const userExists = await userDb.findOneAndUpdate(
                {_id: user.id},
                {$set: {image}},
                {new: true}
            )
            resSend(res, false, userExists.image, '');
        } catch (err) {
            resSend(res, true, null, null);
        }
    },
    changePassword: async (req, res) => {
        const {oldPassword, newPassword} = req.body;
        const user = req.user;
        //checking if user is in DB and sent correct password
        const userExists = await userDb.findOne({_id: user.id});
        if (!userExists) return resSend(res, true, null, 'Bad token');
        const isValid = await bcrypt.compare(oldPassword, userExists.password);
        if (!isValid) return resSend(res, true, null, 'Incorrect password');
        //checking if new password is valid
        if (newPassword.length < 4 || newPassword.length > 20 ||
            !newPassword.match(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)
        ) return resSend(res, true, null, 'Incorrect password');
        //encrypting new password and saving to DB
        const hash = await bcrypt.hash(newPassword, 10);
        try {
            await userDb.findOneAndUpdate(
                {_id: user.id},
                {$set: {password: hash}},
            )
            resSend(res, false, null, 'Password changed');
        } catch (err) {
            resSend(res, true, null, null);
        }
    },
}