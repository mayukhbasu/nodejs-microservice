const express = require("express");
const bodyParser = require("body-parser")
const {randomBytes} = require("crypto");
const axios = require('axios');
const cors = require("cors");

const app = express();
app.use(bodyParser.json());
app.use(cors());
const commentsByPostID = {}; 
app.get("/posts/:id/comments", (req, res) => {
    res.send(commentsByPostID[req.params.id] || []);
});

app.post("/posts/:id/comments", async(req, res) => {
    const commentID = randomBytes(4).toString('hex');
    const {content} = req.body;
    console.log(content);
    const comments = commentsByPostID[req.params.id] || [];
    comments.push({id: commentID, content, status: 'pending'});
    commentsByPostID[req.params.id] = comments;
    await axios.post('http://localhost:4005/events', {
        type: 'CommentCreated',
        data: {
            id: commentID,
            content,
            postId: req.params.id,
            status: 'pending'
        }
    });
    
    res.status(201).send(comments);
});
app.post("/events", async(req, res) => {
    console.log(req.body.type);
    const {type, data} = req.body;
    if(type === 'CommentModerated') {
        const {id,postId, status, content} = data;
        const comments = commentsByPostID[postId];
        const comment = comments.find(comment => comment.id === id);
        comment.status = status;
        await axios.post('http://localhost:4005/events', {
            type: 'CommentUpdated',
            data: {
                id, status, postId, content
            }
        })
    }
    res.send({});
})

app.listen(4001, () => {
    console.log("Listening on port 4001")
})