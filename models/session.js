const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  sessionCode: { type: String, required: true, unique: true },
  deviceTokens: { type: [String], default: [] }
});

module.exports = mongoose.model('Session', SessionSchema);
