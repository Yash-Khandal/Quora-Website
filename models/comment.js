const { MongoClient, ObjectId } = require("mongodb");
const { v4: uuidv4 } = require("uuid");

// Comment model functions
class Comment {
    constructor(db) {
        this.db = db;
        this.collection = db.collection("comments");
    }

    // Create a new comment
    async create(userId, postId, content) {
        try {
            // Create comment object
            const comment = {
                id: uuidv4(),
                userId,
                postId,
                content,
                createdAt: new Date(),
                likes: 0
            };

            // Insert comment into database
            await this.collection.insertOne(comment);
            
            // Update post to include this comment
            await this.db.collection("posts").updateOne(
                { id: postId },
                { $push: { commentIds: comment.id } }
            );
            
            // Update user to include this comment
            await this.db.collection("users").updateOne(
                { id: userId },
                { $push: { comments: comment.id } }
            );
            
            return comment;
        } catch (error) {
            throw error;
        }
    }

    // Get all comments for a post
    async getByPostId(postId) {
        try {
            const comments = await this.collection.find({ postId }).toArray();
            return comments;
        } catch (error) {
            throw error;
        }
    }

    // Get comment by ID
    async getById(id) {
        try {
            const comment = await this.collection.findOne({ id });
            return comment;
        } catch (error) {
            throw error;
        }
    }

    // Update comment
    async update(id, content) {
        try {
            await this.collection.updateOne(
                { id },
                { $set: { content } }
            );
            
            return await this.getById(id);
        } catch (error) {
            throw error;
        }
    }

    // Delete comment
    async delete(id) {
        try {
            const comment = await this.getById(id);
            if (!comment) return false;
            
            // Remove comment from database
            await this.collection.deleteOne({ id });
            
            // Remove comment ID from post
            await this.db.collection("posts").updateOne(
                { id: comment.postId },
                { $pull: { commentIds: id } }
            );
            
            // Remove comment ID from user
            await this.db.collection("users").updateOne(
                { id: comment.userId },
                { $pull: { comments: id } }
            );
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Like a comment
    async like(id) {
        try {
            await this.collection.updateOne(
                { id },
                { $inc: { likes: 1 } }
            );
            
            return await this.getById(id);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Comment; 