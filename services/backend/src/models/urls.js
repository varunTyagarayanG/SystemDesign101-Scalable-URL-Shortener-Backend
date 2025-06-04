const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    shortId: { type: String, required: true, unique: true },
    longUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
    // You can add userId, expiration, etc. here later
});

module.exports = mongoose.model('Url', urlSchema);
