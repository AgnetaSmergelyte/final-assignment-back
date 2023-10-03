const resSend = (res, error, data, message) => {
    res.send({error, data, message})
}

const jwt = require("jsonwebtoken");
const userDb = require("../schemas/userSchema");

module.exports = {
    validateSignUp: async (req, res, next) => {
        const {username, password} = req.body;
        if (username.length < 4 ||
            username.length > 20 ||
            password.length < 4 ||
            password.length > 20 ||
            !password.match(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)
        ) return resSend(res, true, null, 'Incorrect username or password');
        const userExists = await userDb.findOne( {username: username});
        if (userExists) return resSend(res, true, null, 'Username taken');
        next();
    },
    validateLogIn: (req, res, next) => {
        const {username, password} = req.body;
        if (username.length < 4 ||
            username.length > 20 ||
            password.length < 4 ||
            password.length > 20 ||
            !password.match(/(?=.*\d)(?=.*[a-z])(?=.*[A-Z])/)
        ) return resSend(res, true, null, 'Incorrect username or password');
        next();
    },
    validateUser: (req, res, next) => {
        const token = req.headers.authorization;
        jwt.verify(token, process.env.JWT_SECRET, (err, data) => {
            if (err) {
                resSend(res, true, null, 'Authorization failed');
                return;
            }
            req.user = data;
            next();
        })
    }
}