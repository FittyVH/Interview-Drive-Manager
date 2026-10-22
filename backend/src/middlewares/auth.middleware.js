const jwt = require("jsonwebtoken")
const { redisClient } = require('../db/redis')

async function authUser(req, res, next) {
    const authHeader = req.headers.authorization
    const token = req.cookies?.token || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null)

    if (!token) {
        return res.status(401).json({
            message: "Token not provided."
        })
    }

    const isTokenBlacklisted = await redisClient.get(`blacklist${token}`)

    if (isTokenBlacklisted) {
        return res.status(401).json({
            message: "token is invalid"
        })
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded

        next()

    } catch (err) {

        return res.status(401).json({
            message: "Invalid token."
        })
    }

}

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        // Ensure user is authenticated first
        if (!req.user || !req.user.role) {
            return res.status(401).json({
                message: "Unauthorized: User information not found."
            });
        }
        // Check if the user's role matches any allowed role
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Forbidden: You do not have permission to perform this action."
            });
        }
        next();
    };
}

module.exports = { authUser, authorizeRoles }