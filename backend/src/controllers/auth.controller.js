const userModel = require("../models/user.model")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const { redisClient } = require('../db/redis')

/**
 * @name registerUserController
 * @description register a new user, expects username, email and password in the request body
 * @access Public
 */
async function registerUserController(req, res) {
    try {
        const { username, email, password, role } = req.body

        if (!username || !email || !password || !role) {
            return res.status(400).json({
                message: "Please provide username, email, password and role"
            })
        }

        const isUserAlreadyExists = await userModel.findOne({
            $or: [{ username }, { email }]
        })

        if (isUserAlreadyExists) {
            return res.status(400).json({
                message: "Account already exists with this email address or username"
            })
        }

        const hash = await bcrypt.hash(password, 10)

        const user = await userModel.create({
            username,
            email,
            role,
            password: hash
        })

        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: "1d" }
        )

        const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER)
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000
        }

        res.cookie("token", token, cookieOptions)

        return res.status(201).json({
            message: "User registered successfully",
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                email: user.email
            }
        })
    } catch (err) {
        console.error("Register Error:", err)
        return res.status(500).json({ message: err.message || "Internal server error" })
    }
}

/**
 * @name loginUserController
 * @description login a user, expects email and password in the request body
 * @access Public
 */
async function loginUserController(req, res) {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            return res.status(400).json({ message: "Please provide email and password" })
        }

        const user = await userModel.findOne({ email })

        if (!user) {
            return res.status(400).json({ message: "Invalid email or password" })
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(400).json({ message: "Invalid email or password" })
        }

        const token = jwt.sign(
            { id: user._id, username: user.username, role: user.role },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: "1d" }
        )

        const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER)
        const cookieOptions = {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000
        }

        res.cookie("token", token, cookieOptions)
        return res.status(200).json({
            message: "User logged in successfully.",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        })
    } catch (err) {
        console.error("Login Error:", err)
        return res.status(500).json({ message: err.message || "Internal server error" })
    }
}

/**
 * @name logoutUserController
 * @description clear token from user cookie and add the token in blacklist
 * @access public
 */
async function logoutUserController(req, res) {
    try {
        const authHeader = req.headers.authorization
        const token = req.cookies?.token || (authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null)

        if (token) {
            await redisClient.set(`blacklist${token}`, '1', { EX: 86400 })
        }

        const isProduction = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER)
        res.clearCookie("token", {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? "none" : "lax"
        })

        res.status(200).json({
            message: "User logged out successfully"
        })
    } catch (err) {
        console.error("Logout Error:", err)
        res.status(500).json({ message: "Internal server error" })
    }
}

/**
 * @name getMeController
 * @description get the current logged in user details.
 * @access private
 */
async function getMeController(req, res) {
    try {
        const cacheKey = `user:${req.user.id}`;
        const cache = await redisClient.get(cacheKey);

        // 1. Return cached response if hit
        if (cache) {
            console.log("Cache hit for:", cacheKey);
            return res.status(200).json(JSON.parse(cache));
        }

        // 2. Fetch from DB if cache miss
        const user = await userModel.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const responseData = {
            message: "User details fetched successfully",
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        };
        
        await redisClient.set(cacheKey, JSON.stringify(responseData), { EX: 300 });

        return res.status(200).json(responseData);
    } catch (err) {
        console.error("GetMe Error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

module.exports = { registerUserController, loginUserController, logoutUserController, getMeController }