const { MongoClient, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");
const { v4: uuidv4 } = require("uuid");

// User model functions
class User {
    constructor(db) {
        this.db = db;
        this.collection = db.collection("users");
    }

    // Create a new user
    async create(username, email, password) {
        try {
            // Check if user already exists
            const existingUser = await this.collection.findOne({ 
                $or: [{ username }, { email }] 
            });
            
            if (existingUser) {
                throw new Error("Username or email already exists");
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            // Create user object
            const user = {
                id: uuidv4(),
                username,
                email,
                password: hashedPassword,
                createdAt: new Date(),
                posts: [],
                comments: []
            };

            // Insert user into database
            await this.collection.insertOne(user);
            
            // Return user without password
            const { password: _, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            throw error;
        }
    }

    // Find user by ID
    async findById(id) {
        try {
            const user = await this.collection.findOne({ id });
            if (!user) return null;
            
            // Return user without password
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        } catch (error) {
            throw error;
        }
    }

    // Find user by email
    async findByEmail(email) {
        try {
            const user = await this.collection.findOne({ email });
            if (!user) return null;
            
            return user; // Include password for authentication
        } catch (error) {
            throw error;
        }
    }

    // Compare password
    async comparePassword(password) {
        try {
            return await bcrypt.compare(password, this.password);
        } catch (error) {
            throw error;
        }
    }

    // Update user
    async update(id, updates) {
        try {
            // Don't allow updating password through this method
            if (updates.password) delete updates.password;
            
            await this.collection.updateOne(
                { id },
                { $set: updates }
            );
            
            return await this.findById(id);
        } catch (error) {
            throw error;
        }
    }

    // Delete user
    async delete(id) {
        try {
            await this.collection.deleteOne({ id });
            return true;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = User; 