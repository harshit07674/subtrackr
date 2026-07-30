import mongoose from "mongoose";

const workspaceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, "User id is required"]
    },
    name: {
        type: String,
        required: [true, 'workspace name is required'],
    },
    category: {
        type: String,
        required: [true, 'category is required'],
    },
    totalNumberOfSubscriptions: {
        type: Number,
        default: 0,
    },
    colorTheme: {
        primary: { type: String, default: "blue" },
        secondary: { type: String, default: "green" },
    },
    iconName: {
        type: String,
        default: "workspace"
    }
}, {
    timestamps: true
})

const workspaceModel = mongoose.model("workspace", workspaceSchema)

export default workspaceModel;