// services/analytics-service/src/models/Event.js

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    type: { type: String, required: true }, 
    shortId: { type: String, required: true },
    longUrl: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    cacheHit: { type: Boolean, default: null }  
});

module.exports = mongoose.model('Event', eventSchema);
