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
            return resSend(res, true, null, 'Wrong username or password');
        } else {
            const isValid = await bcrypt.compare(password, userExists.password);
            if (!isValid) return resSend(res, true, null, 'Wrong username or password');
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
}