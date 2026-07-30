import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: [true, "User id is required"]
    },
    serviceName: {
        type: String,
        required: [true, 'service name is required'],
    },
    category: {
        type: String,
        required: [true, 'category is required'],
    },
    price: {
        type: Number,
        requred: [true, 'price is required']
    },
    currency: {
        type: String,
        required: [true, 'currency is required']
    },
    billingCycle: {
        type: String,
        required: [true, 'billing cycle is required']
    },
    renewalDate: {
        type: Date,
        required: [true, 'renewal date is required']
    },
    paymentMethod: {
        type: String,
        required: [true, 'payment method is required']
    },
    notes: {
        type: String,
        required: [false, 'notes is not required'],
        default: 'no notes',
    },
    status: {
        type: String,
        required: [false, 'status is not required'],
        default: 'active'
    },
    isFreeTrial: {
        type: Boolean,
        required: [false, 'isFreeTrial is not required'],
        default: false,
    },
    freeTrialEndDate: {
        type: Date,
        required: [false, 'free trial end date is not required']
    },
    trackUsage: {
        type: Boolean,
        default: false
    },
    usageApiKey: {
        type: String,
        default: ''
    },
    usageStats: {
        queriesUsed: { type: Number, default: 0 },
        tokensConsumed: { type: Number, default: 0 },
        isUnderUtilized: { type: Boolean, default: false },
        lastFetchedAt: { type: Date }
    },
    workSpaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'workspace',
        required: false
    },
    lastReminderRenewalDate: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
})

const subscriptionModel = mongoose.model("subscription", subscriptionSchema)

export default subscriptionModel;