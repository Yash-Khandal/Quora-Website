const express = require("express");
const app = express();
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const methodOverride = require("method-override");

app.use(express.urlencoded({ extended: true }));
app.use(methodOverride("_method"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Sample posts array (in-memory, will reset on each deploy unless you use a database)
let posts = [
    { id: uuidv4(), username: "yavi", content: "He is so hardworking person", createdAt: new Date(), likes: 0 },
    { id: uuidv4(), username: "viya", content: "I didn't go for a walk these days", createdAt: new Date(), likes: 0 },
    { id: uuidv4(), username: "unknown", content: "Let's go we'll do it fast", createdAt: new Date(), likes: 0 },
];

// Routes
app.get("/", (req, res) => {
    res.redirect("/posts");
});

app.get("/posts/new", (req, res) => {
    res.render("new.ejs");
});

app.get("/posts", (req, res) => {
    res.render("index.ejs", { posts });
});

app.post("/posts", (req, res) => {
    let { username, content } = req.body;
    let id = uuidv4();
    const newPost = { id, username, content, createdAt: new Date(), likes: 0 };
    posts.push(newPost);
    res.redirect("/posts");
});

app.patch("/posts/:id", (req, res) => {
    let { id } = req.params;
    let newContent = req.body.content;
    let post = posts.find((p) => p.id === id);
    if (post) {
        post.content = newContent;
        res.redirect(`/posts/${id}`);
    } else {
        res.status(404).send("Post not found");
    }
});

app.get("/posts/:id/edit", (req, res) => {
    let { id } = req.params;
    let post = posts.find((p) => p.id === id);
    if (post) {
        res.render("edit.ejs", { post });
    } else {
        res.status(404).send("Post not found");
    }
});

app.get("/posts/:id", (req, res) => {
    let { id } = req.params;
    let post = posts.find((p) => p.id === id);
    if (post) {
        res.render("show.ejs", { post });
    } else {
        res.status(404).send("Post not found");
    }
});

app.delete("/posts/:id", (req, res) => {
    let { id } = req.params;
    posts = posts.filter((p) => p.id !== id);
    res.redirect("/posts");
});

app.post("/posts/:id/like", (req, res) => {
    let { id } = req.params;
    let post = posts.find((p) => p.id === id);
    if (post) {
        post.likes++;
    }
    res.redirect(`/posts/${id}`);
});

// For Vercel, export the app
module.exports = app;