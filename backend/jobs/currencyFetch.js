import cron from 'node-cron';
import exchangeRatesModel from '../models/exchangeRates.model.js';

const FALLBACK_RATES = {
    USD: 1,
    EUR: 0.92,
    GBP: 0.78,
    AUD: 1.51,
    CAD: 1.36,
    JPY: 155.0,
    INR: 83.5,
};

/**
 * Fetches live exchange rates with base currency USD from Frankfurter API
 * and caches them in MongoDB.
 */
export async function fetchAndCacheExchangeRates() {
    console.log('[CurrencyFetch] Fetching live currency exchange rates...');

    try {
        const response = await fetch('https://api.frankfurter.app/latest?from=USD');
        if (!response.ok) {
            throw new Error(`API responded with status ${response.status}`);
        }

        const data = await response.json();
        if (!data || !data.rates) {
            throw new Error('Invalid response structure from Frankfurter API');
        }

        const ratesMap = new Map();
        ratesMap.set('USD', 1);

        const supportedCurrencies = ['EUR', 'GBP', 'AUD', 'CAD', 'JPY', 'INR'];
        for (const curr of supportedCurrencies) {
            if (data.rates[curr] !== undefined) {
                ratesMap.set(curr, Number(data.rates[curr]));
            } else if (FALLBACK_RATES[curr]) {
                ratesMap.set(curr, FALLBACK_RATES[curr]);
            }
        }

        await exchangeRatesModel.findOneAndUpdate(
            { baseCurrency: 'USD' },
            {
                baseCurrency: 'USD',
                rates: ratesMap,
                lastUpdated: new Date(),
            },
            { upsert: true, new: true }
        );

        console.log('[CurrencyFetch] ✅ Live exchange rates updated successfully.');
        return ratesMap;
    } catch (err) {
        console.error('[CurrencyFetch] ⚠️ Failed to fetch live exchange rates:', err.message);
        console.log('[CurrencyFetch] Using cached or fallback rates.');

        // Fallback: check if we have any existing DB record
        const existing = await exchangeRatesModel.findOne({ baseCurrency: 'USD' });
        if (!existing) {
            console.log('[CurrencyFetch] Initializing DB with fallback rates.');
            const fallbackMap = new Map(Object.entries(FALLBACK_RATES));
            await exchangeRatesModel.create({
                baseCurrency: 'USD',
                rates: fallbackMap,
                lastUpdated: new Date(),
            });
            return fallbackMap;
        }

        return existing.rates;
    }
}

/**
 * Gets stored exchange rates map (base USD).
 */
export async function getExchangeRatesMap() {
    let rateDoc = await exchangeRatesModel.findOne({ baseCurrency: 'USD' });
    if (!rateDoc) {
        console.log('[CurrencyFetch] No rates found in DB. Performing initial fetch...');
        await fetchAndCacheExchangeRates();
        rateDoc = await exchangeRatesModel.findOne({ baseCurrency: 'USD' });
    }

    if (!rateDoc || !rateDoc.rates) {
        return new Map(Object.entries(FALLBACK_RATES));
    }

    // Convert Map or object to Map
    if (rateDoc.rates instanceof Map) {
        return rateDoc.rates;
    }
    return new Map(Object.entries(rateDoc.rates));
}

/**
 * Converts an amount from one currency to another using the exchange rates map (base USD).
 */
export function convertCurrency(amount, fromCurrency, toCurrency, ratesMap) {
    if (!amount || amount <= 0) return 0;

    const from = (fromCurrency || 'USD').toUpperCase();
    const to = (toCurrency || 'USD').toUpperCase();

    if (from === to) return amount;

    const fromRate = (ratesMap.get ? ratesMap.get(from) : ratesMap[from]) || FALLBACK_RATES[from] || 1;
    const toRate = (ratesMap.get ? ratesMap.get(to) : ratesMap[to]) || FALLBACK_RATES[to] || 1;

    // amount in USD = amount / fromRate
    // amount in toCurrency = (amount / fromRate) * toRate
    return (amount / fromRate) * toRate;
}

/**
 * Starts the cron job for daily currency exchange rate updates.
 * Schedule: every day at midnight (00:00).
 */
export function startCurrencyCron() {
    // Schedule cron for 00:00 every day
    cron.schedule('0 0 * * *', fetchAndCacheExchangeRates, {
        timezone: 'Asia/Kolkata',
    });

    // Run immediately on boot to ensure fresh rates are cached
    fetchAndCacheExchangeRates();
}
