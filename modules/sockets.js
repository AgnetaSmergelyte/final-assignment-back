const {Server} = require('socket.io');
const userDb = require("../schemas/userSchema");
const conversationDb = require("../schemas/conversationSchema");
const postDb = require("../schemas/postSchema");

let onlineUsers = [];

module.exports = (server) => {
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:3000"
        }
    });
    io.on('connection', (socket) => {
        console.log('a user connected', socket.id);

        socket.on('logged', user => {
            const newUser = {...user, socketId: socket.id};
            if (!onlineUsers.find(x => x.socketId === socket.id)) {
                for (let i = 0; i < onlineUsers.length; i++) {
                    if (onlineUsers[i].username === newUser.username) {
                        onlineUsers[i].socketId = socket.id;
                        return;
                    }
                }
                onlineUsers.push(newUser);
            }
        });

        socket.on('newPost', async postInfo => {
            const currentUser = onlineUsers.find(x => x.socketId === socket.id);
            if (!currentUser) return;
            const author = currentUser.username;
            if (!postInfo || postInfo.image === '' || postInfo.text === '') return;
            const timestamp = Date.now()
            const post = new postDb({
                author,
                image: postInfo.image,
                text: postInfo.text,
                timestamp: Date.now()
            })
            try {
                const savedPost = await post.save();
                io.emit('post', savedPost);
            } catch (err) {}
        });

        socket.on('newUser', async username => {
            const newUser = await userDb.find({username}, {password: 0});
            if (newUser.length === 1) io.emit('newUserConnected', newUser[0]);
        })

        socket.on('logout', () => {
            onlineUsers = onlineUsers.filter(x => x.socketId !== socket.id);
        });

        socket.on('disconnect', () => {
            onlineUsers = onlineUsers.filter(x => x.socketId !== socket.id);
            console.log('A user disconnected');
        });
    });
}