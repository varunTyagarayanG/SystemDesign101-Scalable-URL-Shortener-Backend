// services/auth-service/src/index.js

const express = require('express');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('./models/User');

dotenv.config();
const app = express();
app.use(express.json());

// 1. Connect to MongoDB
async function connectMongo() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Auth-Service: MongoDB connected');
    } catch (err) {
        console.error('Auth-Service: MongoDB connection error', err);
        process.exit(1);
    }
}

// 2. Register endpoint (POST /register)
app.post('/register', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'email and password required' });
    }
    try {
        const existing = await User.findOne({ email });
        if (existing) {
            return res.status(409).json({ error: 'Email already registered' });
        }
        const passwordHash = await bcrypt.hash(password, 10);
        await User.create({ email, passwordHash });
        return res.status(201).json({ message: 'User created' });
    } catch (err) {
        console.error('Auth-Service /register error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 3. Login endpoint (POST /login)
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'email and password required' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const isValid = await user.verifyPassword(password);
        if (!isValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign(
            { userId: user._id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        return res.json({ token });
    } catch (err) {
        console.error('Auth-Service /login error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

// 4. Protected “whoami” endpoint (GET /whoami)
app.get('/whoami', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        return res.json({ userId: payload.userId, email: payload.email });
    } catch {
        return res.status(401).json({ error: 'Invalid token' });
    }
});

async function start() {
    await connectMongo();
    const port = process.env.AUTH_PORT || 4001;
    app.listen(port, () =>
        console.log(`Auth-Service listening on port ${port}`)
    );
}

start();
