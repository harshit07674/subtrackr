import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, "User id is required"]
    },
    email: {
        type: String,
        required: [true, 'email is required']
    },
    otpHash: {
        type: String,
        required: [true, 'email is required']
    },
    expiredAt: {
        type: Date,
        required: [true, "expiry date is required"]
    }


}, {
    timestamps: true
})

const otpModel = mongoose.model("otp", otpSchema)

export default otpModel;