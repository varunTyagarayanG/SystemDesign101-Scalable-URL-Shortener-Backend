// services/backend/src/models/Url.js

const mongoose = require('mongoose');

const urlSchema = new mongoose.Schema({
    shortId: { type: String, required: true, unique: true },
    longUrl: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, default: null },
    deleted: { type: Boolean, default: false }
});

urlSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Url', urlSchema);
