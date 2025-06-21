// services/analytics-service/src/models/Event.js

const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    type: { type: String, required: true },      // "create" or "redirect"
    shortId: { type: String, required: true },
    longUrl: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    cacheHit: { type: Boolean, default: null }    // only for "redirect" events
});

module.exports = mongoose.model('Event', eventSchema);
