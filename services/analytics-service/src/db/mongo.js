// services/analytics-service/src/db/mongo.js

const mongoose = require('mongoose');

async function connectMongo() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Analytics-Service: MongoDB connected');
    } catch (err) {
        console.error('Analytics-Service: MongoDB connection error', err);
        process.exit(1);
    }
}

module.exports = connectMongo;
