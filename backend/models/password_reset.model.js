import mongoose from "mongoose";

const passwordResetSchema = new mongoose.Schema(
    {
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, "User id is required"]
    },
    tokenHash: {
        type: String,
        required: [true, "Token hash is required"]
    },
    expiredAt: {
        type: Date,
        required: [true, "Expiry date is required"]
    }
},
{
    timestamps: true
}
)

const passwordResetModel = mongoose.model("password_reset", passwordResetSchema)

export default passwordResetModel;
