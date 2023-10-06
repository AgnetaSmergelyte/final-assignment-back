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

        socket.on('logged', async user => {
            const newUser = {...user, socketId: socket.id};
            if (!onlineUsers.find(x => x.socketId === socket.id)) {
                for (let i = 0; i < onlineUsers.length; i++) {
                    if (onlineUsers[i].username === newUser.username) {
                        onlineUsers[i].socketId = socket.id;
                        return;
                    }
                }
                onlineUsers.push(newUser);
            } else return;
            //find all conversations and join rooms
            try {
                const conversations = await conversationDb.find({participants: newUser.username});
                const users = await userDb.find();
                const chatWith = [];
                conversations.map(x => {
                    const room = (x._id).toString();
                    socket.join(room);
                    socket.emit('newMessage', x._id)
                    const username = x.participants.filter(name => name !== newUser.username);
                    const otherUser = users.find(u => u.username === username[0]);
                    if (otherUser) {
                        chatWith.push({
                            _id: x._id,
                            username: username[0],
                            image: otherUser.image,
                            messages: x.messages
                        })
                    }
                });
                socket.emit('getConversations', chatWith);
            } catch (err){}
        });

        socket.on('newPost', async postInfo => {
            const currentUser = onlineUsers.find(x => x.socketId === socket.id);
            if (!currentUser) return;
            const author = currentUser.username;
            if (!postInfo || postInfo.image === '' || postInfo.text === '') return;
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
        });

        // socket.on('getSinglePost', async postId => {
        //     try {
        //         const post = await postDb.findOne({_id: postId});
        //         const author = await userDb.findOne({username: post.author});
        //         socket.emit('singlePost', {post, author});
        //     } catch (err) {
        //         socket.emit('singlePost', {post: null, author: null});
        //     }
        // });

        socket.on('like', async postId => {
            const currentUser = onlineUsers.find(x => x.socketId === socket.id);
            if (!currentUser) return;
            try {
                const likedPost = await postDb.findOne({_id: postId});
                let likes = [...likedPost.likes];
                if (likes.includes(currentUser.username)) {
                    likes = likes.filter(x => x !== currentUser.username);
                } else {
                    likes.push(currentUser.username)
                }
                const updatedPost = await postDb.findOneAndUpdate(
                    {_id: postId},
                    {$set: {likes}},
                    {new: true}
                )
                io.emit('post', updatedPost);
            } catch (err) {}
        });

        socket.on('comment', async val => {
            const postId = val.postId;
            const comment = val.comment;
            const currentUser = onlineUsers.find(x => x.socketId === socket.id);
            if (!postId || comment === '' || !currentUser) return;
            try {
                const commentedPost = await postDb.findOne({_id: postId});
                let comments = [...commentedPost.comments];
                const newComment = {
                    author: currentUser.username,
                    text: comment,
                    timestamp: Date.now()
                }
                comments.push(newComment)
                const updatedPost = await postDb.findOneAndUpdate(
                    {_id: postId},
                    {$set: {comments}},
                    {new: true}
                )
                io.emit('post', updatedPost);
            } catch (err) {}
        });

        socket.on('message', async val => {
           const sender = onlineUsers.find(x => x.socketId === socket.id);
           const message = val.message;
           const recipient = val.recipient;
           if (!sender || !recipient || message.length === 0 || message.length > 1000) return;
           const newMessage = {
               author: sender.username,
               text: message,
               timestamp: Date.now()
           }
           let messages = [];
           try {
               let conversationID;
               const conversations = await conversationDb.find({participants: sender.username});
               conversations.map(x => {
                   if (x.participants.includes(recipient)) {
                       conversationID = x._id;
                       messages = [...x.messages, newMessage];
                   }
               })
               if (conversationID) {
                   const updatedConversation = await conversationDb.findOneAndUpdate(
                       {_id: conversationID},
                       {$set: {messages}},
                       {new: true}
                   )
                   const room = conversationID.toString();
                   console.log(room)
                   io.to(room).emit('newMessage', {id: room, message: newMessage});
               } else {
                   messages.push(newMessage);
                   const conversation = new conversationDb({
                       participants: [sender.username, recipient],
                       messages
                   })
                   conversation.save();
               }
           } catch (err) {
               console.log('error')
           }
        });

        socket.on('logout', () => {
            onlineUsers = onlineUsers.filter(x => x.socketId !== socket.id);
        });

        socket.on('disconnect', () => {
            onlineUsers = onlineUsers.filter(x => x.socketId !== socket.id);
            console.log('A user disconnected');
        });
    });
}