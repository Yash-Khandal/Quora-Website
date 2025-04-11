const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const User = require('../models/user');

// Register form
router.get('/register', (req, res) => {
    res.render('auth/register', { title: 'Register' });
});

// Register process
router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Create new user
        const user = new User(req.app.locals.db);
        await user.create(username, email, password);
        
        req.flash('success', 'Registration successful! Please log in.');
        res.redirect('/auth/login');
    } catch (error) {
        req.flash('error', error.message || 'Error during registration');
        res.redirect('/auth/register');
    }
});

// Login form
router.get('/login', (req, res) => {
    res.render('auth/login', { title: 'Login' });
});

// Login process
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Find user
        const user = new User(req.app.locals.db);
        const foundUser = await user.findByEmail(email);
        
        if (!foundUser) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        // Check password
        const isMatch = await bcrypt.compare(password, foundUser.password);
        if (!isMatch) {
            req.flash('error', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        // Set user session
        req.session.regenerate((err) => {
            if (err) {
                console.error('Session regeneration error:', err);
                req.flash('error', 'Error during login');
                return res.redirect('/auth/login');
            }

            req.session.user = {
                id: foundUser.id,
                username: foundUser.username,
                email: foundUser.email
            };

            req.session.save((err) => {
                if (err) {
                    console.error('Session save error:', err);
                    req.flash('error', 'Error during login');
                    return res.redirect('/auth/login');
                }

                req.flash('success', 'Successfully logged in!');
                res.redirect('/posts');
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        req.flash('error', 'Error during login');
        res.redirect('/auth/login');
    }
});

// Logout
router.get('/logout', (req, res) => {
    // Destroy session first
    req.session.destroy((err) => {
        if (err) {
            return res.redirect('/posts');
        }
        // Clear the cookie
        res.clearCookie('connect.sid');
        // Redirect to posts page
        res.redirect('/posts');
    });
});

module.exports = router; 