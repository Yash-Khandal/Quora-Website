const { MongoClient, ObjectId } = require("mongodb");
const { v4: uuidv4 } = require("uuid");

// Post model functions
class Post {
    constructor(db) {
        this.db = db;
        this.collection = db.collection("posts");
    }

    // Create a new post
    async create(userId, content) {
        try {
            // Create post object
            const post = {
                id: uuidv4(),
                userId,
                content,
                createdAt: new Date(),
                likes: 0,
                commentIds: []
            };

            // Insert post into database
            await this.collection.insertOne(post);
            
            // Update user to include this post
            await this.db.collection("users").updateOne(
                { id: userId },
                { $push: { posts: post.id } }
            );
            
            return post;
        } catch (error) {
            throw error;
        }
    }

    // Get all posts
    async getAll() {
        try {
            const posts = await this.collection.find().toArray();
            return posts;
        } catch (error) {
            throw error;
        }
    }

    // Get post by ID
    async getById(id) {
        try {
            const post = await this.collection.findOne({ id });
            return post;
        } catch (error) {
            throw error;
        }
    }

    // Get posts by user ID
    async getByUserId(userId) {
        try {
            const posts = await this.collection.find({ userId }).toArray();
            return posts;
        } catch (error) {
            throw error;
        }
    }

    // Update post
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

    // Delete post
    async delete(id) {
        try {
            const post = await this.getById(id);
            if (!post) return false;
            
            // Remove post from database
            await this.collection.deleteOne({ id });
            
            // Remove post ID from user
            await this.db.collection("users").updateOne(
                { id: post.userId },
                { $pull: { posts: id } }
            );
            
            // Delete all comments associated with this post
            await this.db.collection("comments").deleteMany({ postId: id });
            
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Like a post
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

module.exports = Post; 