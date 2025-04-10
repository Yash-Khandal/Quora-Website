const express = require("express");
const app = express();
const path = require("path");
const { MongoClient, ObjectId } = require("mongodb");
const { v4: uuidv4 } = require("uuid");
const methodOverride = require("method-override");
const dns = require('dns');
const favicon = require('serve-favicon');
const session = require('express-session');
const flash = require('connect-flash');

require("dotenv").config();

// MongoDB Connection URI with fallback
const uri = process.env.MONGODB_URI || "mongodb+srv://new_user:3e5NBh8w8AXGkKv6@test-pro-db.og6zhht.mongodb.net/?retryWrites=true&w=majority&appName=test-pro-db";

// Configure MongoDB client with appropriate options
const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    retryWrites: true,
    retryReads: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function connectToDatabase() {
    try {
        if (!client.isConnected) {
            console.log("Connecting to MongoDB Atlas...");
            await client.connect();
            console.log("Successfully connected to MongoDB Atlas");
        }
        return client.db("quora_db");
    } catch (error) {
        console.error("MongoDB connection error:", error);
        // Instead of throwing, return a specific error that we can handle
        return { error: "Database connection failed" };
    }
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride("_method"));

// Session configuration - MUST be before any route handling
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    },
    name: 'connect.sid' // Session cookie name
}));

// Flash messages middleware
app.use(flash());

// Make flash messages available to all templates
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.error = req.flash('error');
    res.locals.success = req.flash('success');
    next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

// Serve favicon
app.use(favicon(path.join(__dirname, 'public', 'favicon.png')));

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: 'Something went wrong!',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Database connection and server start
let db;
connectToDatabase()
    .then(database => {
        if (database.error) {
            console.error("Failed to connect to database:", database.error);
            process.exit(1);
        }
        db = database;
        app.locals.db = database;
        
        const PORT = process.env.PORT || 8081;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    })
    .catch(err => {
        console.error("Failed to start server:", err);
        process.exit(1);
    });

// Handle process termination
process.on('SIGINT', async () => {
    try {
        await client.close();
        console.log('MongoDB connection closed');
        process.exit(0);
    } catch (err) {
        console.error('Error closing MongoDB connection:', err);
        process.exit(1);
    }
});

app.get("/", (req, res) => res.redirect("/posts"));

// Import routes
const authRoutes = require('./routes/auth');

// Use authentication routes
app.use('/auth', authRoutes);

// Middleware to check if user is authenticated
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        next();
    } else {
        req.flash('error', 'Please log in to access this feature');
        res.redirect('/auth/login');
    }
};

// Middleware to check if user owns the post
const isPostOwner = async (req, res, next) => {
    try {
        const { id } = req.params;
        const post = await db.collection("posts").findOne({ id });
        
        if (!post) {
            req.flash('error', 'Post not found');
            return res.redirect('/posts');
        }
        
        if (post.userId !== req.session.user.id) {
            req.flash('error', 'You are not authorized to edit this post');
            return res.redirect('/posts');
        }
        
        next();
    } catch (error) {
        console.error("Error checking post ownership:", error);
        req.flash('error', 'Error checking post ownership');
        res.redirect('/posts');
    }
};

app.get("/posts/new", isAuthenticated, (req, res) => res.render("new.ejs", { title: "Create New Post" }));

app.get("/posts", async (req, res) => {
    try {
        const posts = await db.collection("posts").find().toArray();
        res.render("index.ejs", { posts, title: "All Posts" });
    } catch (error) {
        console.error("Error fetching posts:", error);
        res.status(500).send("Error fetching posts");
    }
});

app.post("/posts", isAuthenticated, async (req, res) => {
    try {
        const { content } = req.body;
        const newPost = { 
            id: uuidv4(), 
            userId: req.session.user.id,
            username: req.session.user.username, 
            content, 
            createdAt: new Date(), 
            likes: 0 
        };
        await db.collection("posts").insertOne(newPost);
        req.flash('success', 'Post created successfully');
        res.redirect("/posts");
    } catch (error) {
        console.error("Error creating post:", error);
        req.flash('error', 'Error creating post');
        res.redirect('/posts');
    }
});

app.patch("/posts/:id", isAuthenticated, isPostOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const newContent = req.body.content;
        await db.collection("posts").updateOne({ id }, { $set: { content: newContent } });
        req.flash('success', 'Post updated successfully');
        res.redirect(`/posts/${id}`);
    } catch (error) {
        console.error("Error updating post:", error);
        req.flash('error', 'Error updating post');
        res.redirect('/posts');
    }
});

app.get("/posts/:id/edit", isAuthenticated, isPostOwner, async (req, res) => {
    try {
        const { id } = req.params;
        const post = await db.collection("posts").findOne({ id });
        if (post) {
            res.render("edit.ejs", { post, title: "Edit Post" });
        } else {
            req.flash('error', 'Post not found');
            res.redirect('/posts');
        }
    } catch (error) {
        console.error("Error fetching post for edit:", error);
        req.flash('error', 'Error fetching post');
        res.redirect('/posts');
    }
});

app.get("/posts/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const post = await db.collection("posts").findOne({ id });
        
        // Get comments for this post
        const comments = await db.collection("comments").find({ postId: id }).toArray();
        
        if (post) {
            res.render("show.ejs", { 
                post, 
                comments, 
                title: "Post Details" 
            });
        } else {
            res.status(404).send("Post not found");
        }
    } catch (error) {
        console.error("Error fetching post:", error);
        res.status(500).send("Error fetching post");
    }
});

app.delete("/posts/:id", isAuthenticated, isPostOwner, async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection("posts").deleteOne({ id });
        req.flash('success', 'Post deleted successfully');
        res.redirect("/posts");
    } catch (error) {
        console.error("Error deleting post:", error);
        req.flash('error', 'Error deleting post');
        res.redirect('/posts');
    }
});

app.post("/posts/:id/like", async (req, res) => {
    try {
        const { id } = req.params;
        const post = await db.collection("posts").findOne({ id });
        if (post) {
            await db.collection("posts").updateOne({ id }, { $set: { likes: post.likes + 1 } });
        }
        res.redirect(`/posts/${id}`);
    } catch (error) {
        console.error("Error liking post:", error);
        res.status(500).send("Error liking post");
    }
});

// Add comment to a post
app.post("/posts/:id/comments", async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const username = req.body.username || "Anonymous";
        
        // Create new comment
        const newComment = { 
            id: uuidv4(), 
            postId: id, 
            username, 
            content, 
            createdAt: new Date(), 
            likes: 0 
        };
        
        // Insert comment into database
        await db.collection("comments").insertOne(newComment);
        
        // Redirect back to post
        res.redirect(`/posts/${id}`);
    } catch (error) {
        console.error("Error creating comment:", error);
        res.status(500).send("Error creating comment");
    }
});

// Like a comment
app.post("/comments/:id/like", async (req, res) => {
    try {
        const { id } = req.params;
        const comment = await db.collection("comments").findOne({ id });
        
        if (comment) {
            // Update comment likes
            await db.collection("comments").updateOne({ id }, { $set: { likes: comment.likes + 1 } });
            
            // Redirect back to post
            res.redirect(`/posts/${comment.postId}`);
        } else {
            res.status(404).send("Comment not found");
        }
    } catch (error) {
        console.error("Error liking comment:", error);
        res.status(500).send("Error liking comment");
    }
});

// Delete a comment
app.delete("/comments/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const comment = await db.collection("comments").findOne({ id });
        
        if (comment) {
            // Delete comment
            await db.collection("comments").deleteOne({ id });
            
            // Redirect back to post
            res.redirect(`/posts/${comment.postId}`);
        } else {
            res.status(404).send("Comment not found");
        }
    } catch (error) {
        console.error("Error deleting comment:", error);
        res.status(500).send("Error deleting comment");
    }
});

module.exports = app;