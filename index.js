const express = require("express");
const app = express();
const port = 8081;
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const methodOverride = require("method-override"); // Import method-override
const { Server } = require("socket.io"); // Import Socket.IO Server

// Middleware
app.use(express.urlencoded({ extended: true })); // Parse form data
app.use(methodOverride("_method")); // Enable method override
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public"))); // Serve static files

// Sample posts array
let posts = [
    {
        id: uuidv4(), // Generate a unique ID for each post
        username: "yavi",
        content: "He is so hardworking person",
        createdAt: new Date(), // Add createdAt timestamp
        likes: 0, // Initialize likes
    },
    {
        id: uuidv4(), // Generate a unique ID for each post
        username: "viya",
        content: "I didn't go for a walk these days",
        createdAt: new Date(), // Add createdAt timestamp
        likes: 0, // Initialize likes
    },
    {
        id: uuidv4(), // Generate a unique ID for each post
        username: "unknown",
        content: "Let's go we'll do it fast",
        createdAt: new Date(), // Add createdAt timestamp
        likes: 0, // Initialize likes
    },
];

const server = app.listen(port, () => { // Create an HTTP server
    console.log(`listening to port ${port}`);
});

const io = new Server(server); // Initialize Socket.IO with the HTTP server

io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
        console.log("A user disconnected");
    });
});

app.get("/", (req, res) => {
    res.redirect("/posts");
});

// Route to render the form for creating a new post
app.get("/posts/new", (req, res) => {
    res.render("new.ejs");
});

// Route to display all posts
app.get("/posts", (req, res) => {
    res.render("index.ejs", { posts }); // Pass the posts array to the template
});

// Route to handle form submission
app.post("/posts", (req, res) => {
    let { username, content } = req.body;
    let id = uuidv4(); // Generate a unique ID for the new post
    const newPost = {
        id,
        username,
        content,
        createdAt: new Date(), // Add createdAt timestamp for new posts
        likes: 0, // Initialize likes for new posts
    };
    posts.push(newPost); // Add the new post to the array
    io.emit("newPost", newPost); // Emit the 'newPost' event to all connected clients
    res.redirect("/posts"); // Redirect to the posts page
});

// Route to handle PATCH requests (for updating posts)
app.patch("/posts/:id", (req, res) => {
    console.log("PATCH request received");
    console.log("Request Body:", req.body);
    console.log("Post ID:", req.params.id);

    let { id } = req.params;
    let newContent = req.body.content; // Get the updated content from the form
    let post = posts.find((p) => p.id === id); // Find the post with the matching ID

    if (post) {
        console.log("Post found:", post);
        post.content = newContent; // Update the post content
        res.redirect(`/posts/${id}`); // Redirect to the post details page
    } else {
        console.log("Post not found");
        res.status(404).send("Post not found"); // Handle case where post is not found
    }
});

// Route to render the edit form
app.get("/posts/:id/edit", (req, res) => {
    let { id } = req.params;
    let post = posts.find((p) => p.id === id); // Find the post with the matching ID
    if (post) {
        res.render("edit.ejs", { post }); // Pass the post object to the template
    } else {
        res.status(404).send("Post not found"); // Handle case where post is not found
    }
});

// Route to display a single post by ID
app.get("/posts/:id", (req, res) => {
    let { id } = req.params;
    let post = posts.find((p) => p.id === id); // Find the post with the matching ID
    if (post) {
        res.render("show.ejs", { post }); // Pass the post object to the template
    } else {
        res.status(404).send("Post not found"); // Handle case where post is not found
    }
});

// Route to handle DELETE requests
app.delete("/posts/:id", (req, res) =>{
    let { id } = req.params;
       posts = posts.filter((p) => p.id !== id);
    res.redirect("/posts");
});

// Route to handle liking a post
app.post("/posts/:id/like", (req, res) => {
    let { id } = req.params;
    let post = posts.find((p) => p.id === id); // Find the post with the matching ID
    if (post) {
        post.likes++; // Increment the likes count
    }
    res.redirect(`/posts/${id}`); // Redirect back to the post details page
});