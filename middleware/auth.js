// Authentication middleware
const auth = (req, res, next) => {
    // Check if user is logged in
    if (!req.session || !req.session.user) {
        // Store the requested URL to redirect back after login
        req.session.returnTo = req.originalUrl;
        return res.redirect('/auth/login');
    }
    
    // User is authenticated, proceed to the next middleware/route handler
    next();
};

// Optional authentication middleware (for routes that can be accessed by both logged-in and non-logged-in users)
const optionalAuth = (req, res, next) => {
    // If user is logged in, add user to res.locals for use in templates
    if (req.session && req.session.user) {
        res.locals.user = req.session.user;
    }
    
    // Proceed to the next middleware/route handler
    next();
};

module.exports = { auth, optionalAuth }; 