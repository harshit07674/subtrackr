import mongoose from "mongoose";

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, "User id is required"]
    },
    refreshTokenHash: {
        type: String,
        required: [true, "Refresh token is required"]
    },
    expiredAt: {
        type: Date,
        required: [true, "expired date is required"]
    },
    ip: {
        type: String,
        required: [true, 'ip is required']
    },
    userAgent: {
        type: String,
        required: [true, 'userAgent is required']
    },
    revoked: {
        type: Boolean,
        default: false,

    },


}, {
    timestamps: true
})

const sessionModel = mongoose.model("session", sessionSchema)

export default sessionModel;