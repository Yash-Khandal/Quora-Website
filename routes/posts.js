const express = require('express');
const router = express.Router();
const { auth, optionalAuth } = require('../middleware/auth');

// Get all posts
router.get('/', optionalAuth, async (req, res) => {
    try {
        const posts = await req.app.locals.postModel.getAll();
        
        // Get user information for each post
        const postsWithUsers = await Promise.all(posts.map(async (post) => {
            const user = await req.app.locals.userModel.findById(post.userId);
            return {
                ...post,
                username: user ? user.username : 'Unknown User'
            };
        }));
        
        res.render('index', { 
            posts: postsWithUsers,
            title: 'All Posts'
        });
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).send('Error fetching posts');
    }
});

// Create a new post form
router.get('/new', auth, (req, res) => {
    res.render('new', { 
        title: 'Create a New Post',
        user: req.session.user
    });
});

// Create a new post
router.post('/', auth, async (req, res) => {
    try {
        const { content } = req.body;
        const userId = req.session.user.id;
        
        // Validate input
        if (!content) {
            return res.redirect('/posts/new?error=Post content is required');
        }
        
        // Create post
        await req.app.locals.postModel.create(userId, content);
        
        // Redirect to posts page
        res.redirect('/posts');
    } catch (error) {
        console.error('Error creating post:', error);
        res.redirect('/posts/new?error=' + encodeURIComponent(error.message));
    }
});

// Get a single post
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Get post
        const post = await req.app.locals.postModel.getById(id);
        
        // Check if post exists
        if (!post) {
            return res.status(404).send('Post not found');
        }
        
        // Get user information
        const user = await req.app.locals.userModel.findById(post.userId);
        
        // Get comments for this post
        const comments = await req.app.locals.commentModel.getByPostId(id);
        
        // Get user information for each comment
        const commentsWithUsers = await Promise.all(comments.map(async (comment) => {
            const commentUser = await req.app.locals.userModel.findById(comment.userId);
            return {
                ...comment,
                username: commentUser ? commentUser.username : 'Unknown User'
            };
        }));
        
        res.render('show', { 
            post: {
                ...post,
                username: user ? user.username : 'Unknown User'
            },
            comments: commentsWithUsers,
            title: 'Post Details'
        });
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).send('Error fetching post');
    }
});

// Edit post form
router.get('/:id/edit', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.id;
        
        // Get post
        const post = await req.app.locals.postModel.getById(id);
        
        // Check if post exists
        if (!post) {
            return res.status(404).send('Post not found');
        }
        
        // Check if user is the author of the post
        if (post.userId !== userId) {
            return res.status(403).send('You are not authorized to edit this post');
        }
        
        // Get user information
        const user = await req.app.locals.userModel.findById(post.userId);
        
        res.render('edit', { 
            post: {
                ...post,
                username: user ? user.username : 'Unknown User'
            },
            title: 'Edit Post'
        });
    } catch (error) {
        console.error('Error fetching post for edit:', error);
        res.status(500).send('Error fetching post');
    }
});

// Update post
router.patch('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.session.user.id;
        
        // Get post
        const post = await req.app.locals.postModel.getById(id);
        
        // Check if post exists
        if (!post) {
            return res.status(404).send('Post not found');
        }
        
        // Check if user is the author of the post
        if (post.userId !== userId) {
            return res.status(403).send('You are not authorized to edit this post');
        }
        
        // Update post
        await req.app.locals.postModel.update(id, content);
        
        // Redirect to post page
        res.redirect(`/posts/${id}`);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).send('Error updating post');
    }
});

// Delete post
router.delete('/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.id;
        
        // Get post
        const post = await req.app.locals.postModel.getById(id);
        
        // Check if post exists
        if (!post) {
            return res.status(404).send('Post not found');
        }
        
        // Check if user is the author of the post
        if (post.userId !== userId) {
            return res.status(403).send('You are not authorized to delete this post');
        }
        
        // Delete post
        await req.app.locals.postModel.delete(id);
        
        // Redirect to posts page
        res.redirect('/posts');
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).send('Error deleting post');
    }
});

// Like post
router.post('/:id/like', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Like post
        await req.app.locals.postModel.like(id);
        
        // Redirect to post page
        res.redirect(`/posts/${id}`);
    } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).send('Error liking post');
    }
});

module.exports = router; 