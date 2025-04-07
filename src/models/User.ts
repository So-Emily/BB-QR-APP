import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    name: { type: String, required: true }, // Supplier name
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true, default: 'supplier' },
    // _id is sufficient for unique identification
});

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
