const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema({
  id:     { type: Number, required: true, unique: true, index: true },
  text:   { type: String, required: true, index: true },
  videos: { type: [String], required: true },
}, { versionKey: false });

// Текстовый индекс для поиска
wordSchema.index({ text: 'text' });

module.exports = mongoose.models.Word || mongoose.model('Word', wordSchema);
