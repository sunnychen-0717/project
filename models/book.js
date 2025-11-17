const mongoose = require('mongoose');
const BookSchema = new mongoose.Schema({
title: { type: String, required: true, minlength: 1, maxlength: 200 },
author: { type: String, required: true, minlength: 1, maxlength: 100 },
year: { type: Number, min: 0, max: 3000 },
tags: [{ type: String }],
owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
BookSchema.index({ title: 1, author: 1 });
BookSchema.index({ tags: 1 });
module.exports = mongoose.model('Book', BookSchema);
