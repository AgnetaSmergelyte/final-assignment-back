const express = require("express");
const app = express();
const cors = require("cors");
const router = require("./router/mainRouter");
const mongoose = require("mongoose");
const {createServer} = require('node:http');
require("dotenv").config();
const server = createServer(app);
require("./modules/sockets")(server)
server.listen(3001, () => {
    console.log('server running at http://localhost:3001')
});
mongoose.connect(process.env.DB_KEY)
    .then(() => {
        console.log('connection success')
    }).catch(e => {
    console.log('ERROR', e)
});
app.use(cors());
app.use(express.json());
app.use("/", router);
const port = 8080;
app.listen(port);