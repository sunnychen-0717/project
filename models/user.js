const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
username: { type: String, required: true, minlength: 3, maxlength: 30, unique: true },
password: { type: String, required: true, minlength: 3, maxlength: 100 },
role: { type: String, enum: ['user','admin'], default: 'user' }
});
module.exports = mongoose.model('User', UserSchema);
