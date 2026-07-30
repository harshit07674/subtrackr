import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "username is required"],
        unique: [true, "username must be unique"]
    },
    email: {
        type: String,
        required: [true, "email is required"],
        unique: [true, "email must be unique"]
    },
    password: {
        type: String,
        required: [true, "password is required"]
    },
    verified: {
        type: Boolean,
        default: false
    },
    primaryCurrency: {
        type: String,
        enum: ['USD', 'EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'INR'],
        default: 'INR'
    },
    defaultNotificationDays: {
        type: Number,
        default: 3,
        min: 1,
        max: 30
    },
    pushSubscriptions: [{
        endpoint: { type: String, required: true },
        keys: {
            p256dh: { type: String, required: true },
            auth: { type: String, required: true }
        },
        subscribedAt: { type: Date, default: Date.now }
    }]
})

const userModel = mongoose.model("users", userSchema)

export default userModel;