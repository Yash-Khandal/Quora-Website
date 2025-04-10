const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');

// Create a new comment
router.post('/posts/:postId/comments', auth, async (req, res) => {
    try {
        const { postId } = req.params;
        const { content } = req.body;
        const userId = req.session.user.id;
        
        // Validate input
        if (!content) {
            return res.redirect(`/posts/${postId}?error=Comment content is required`);
        }
        
        // Create comment
        await req.app.locals.commentModel.create(userId, postId, content);
        
        // Redirect back to post
        res.redirect(`/posts/${postId}`);
    } catch (error) {
        console.error('Comment creation error:', error);
        res.redirect(`/posts/${req.params.postId}?error=${encodeURIComponent(error.message)}`);
    }
});

// Update a comment
router.patch('/comments/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        const userId = req.session.user.id;
        
        // Get comment
        const comment = await req.app.locals.commentModel.getById(id);
        
        // Check if comment exists
        if (!comment) {
            return res.status(404).send('Comment not found');
        }
        
        // Check if user is the author of the comment
        if (comment.userId !== userId) {
            return res.status(403).send('You are not authorized to edit this comment');
        }
        
        // Update comment
        await req.app.locals.commentModel.update(id, content);
        
        // Redirect back to post
        res.redirect(`/posts/${comment.postId}`);
    } catch (error) {
        console.error('Comment update error:', error);
        res.status(500).send(`Error updating comment: ${error.message}`);
    }
});

// Delete a comment
router.delete('/comments/:id', auth, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.session.user.id;
        
        // Get comment
        const comment = await req.app.locals.commentModel.getById(id);
        
        // Check if comment exists
        if (!comment) {
            return res.status(404).send('Comment not found');
        }
        
        // Check if user is the author of the comment
        if (comment.userId !== userId) {
            return res.status(403).send('You are not authorized to delete this comment');
        }
        
        // Delete comment
        await req.app.locals.commentModel.delete(id);
        
        // Redirect back to post
        res.redirect(`/posts/${comment.postId}`);
    } catch (error) {
        console.error('Comment deletion error:', error);
        res.status(500).send(`Error deleting comment: ${error.message}`);
    }
});

// Like a comment
router.post('/comments/:id/like', auth, async (req, res) => {
    try {
        const { id } = req.params;
        
        // Like comment
        await req.app.locals.commentModel.like(id);
        
        // Get comment to redirect back to post
        const comment = await req.app.locals.commentModel.getById(id);
        
        // Redirect back to post
        res.redirect(`/posts/${comment.postId}`);
    } catch (error) {
        console.error('Comment like error:', error);
        res.status(500).send(`Error liking comment: ${error.message}`);
    }
});

module.exports = router; 