import mongoose from "mongoose";

const exchangeRatesSchema = new mongoose.Schema({
    baseCurrency: {
        type: String,
        default: 'USD',
        required: true,
    },
    rates: {
        type: Map,
        of: Number,
        required: true,
    },
    lastUpdated: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true
});

const exchangeRatesModel = mongoose.model("exchangeRates", exchangeRatesSchema);

export default exchangeRatesModel;
