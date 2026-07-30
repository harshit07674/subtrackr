import subscriptionModel from "../models/subscription.model.js";
import { addSubscriptionService, deleteSubscriptionService, findSubscriptionsById, updateSubscriptionService, searchSubscriptionsService, bulkImportSubscriptionsService } from "../services/subscription.service.js";


async function addSubscription(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Unauthorized',
                success: 'false',
                status: '401'
            })
        }

        const { serviceName, billingCycle, paymentMethod, renewalDate, price, category, currency, notes, status, isFreeTrial, freeTrialEndDate, workSpaceId } = req.body;

        const formatedServiceName = serviceName.trim().toLowerCase()
        const formatedbillingCycle = billingCycle.trim().toLowerCase()

        const subscrptionData = await subscriptionModel.findOne({
            userId: req.user._id,
            serviceName: formatedServiceName,
            billingCycle: formatedbillingCycle
        })

        if (subscrptionData) {
            return res.status(400).json({
                message: 'subscription already exists',
                status: '400',
                success: 'false'
            })
        }

        const addSubscription = await addSubscriptionService(
            req.user._id,
            formatedServiceName,
            formatedbillingCycle,
            price,
            currency,
            category,
            renewalDate,
            notes,
            paymentMethod,
            status,
            isFreeTrial,
            freeTrialEndDate,
            workSpaceId
        );

        return res.status(201).json({
            status: '201',
            success: 'true',
            message: 'subscription created successfully',
            subscription_data: {
                _id: addSubscription._id,
                serviceName: addSubscription.serviceName,
                category: addSubscription.category,
                billingCycle: addSubscription.billingCycle,
                price: addSubscription.price,
                currency: addSubscription.currency,
                renewalDate: addSubscription.renewalDate,
                paymentMethod: addSubscription.paymentMethod,
                notes: addSubscription.notes,
                status: addSubscription.status,
                isFreeTrial: addSubscription.isFreeTrial,
                freeTrialEndDate: addSubscription.freeTrialEndDate
            }
        })
    }
    catch (e) {
        return res.status(500).json({
            message: `internal server error: ${e}`
        })
    }
}


async function getSubscriptions(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Unauthorized',
                success: 'false',
                status: '401'
            })
        }

        const userSubscriptions = await findSubscriptionsById(req.user._id);

        return res.status(200).json({
            status: '200',
            success: 'true',
            message: 'subscriptions fetched successfully',
            subscriptions: userSubscriptions
        })


    }
    catch (e) {
        return res.status(500).json({
            message: `internal server error: ${e}`
        })
    }
}


async function updateSubscription(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Unauthorized',
                success: 'false',
                status: '401'
            })
        }

        const { id } = req.params;

        // Allowed fields that the frontend can update
        const allowedFields = [
            'price', 'currency', 'billingCycle', 'renewalDate',
            'category', 'serviceName', 'paymentMethod', 'notes',
            'status', 'isFreeTrial', 'freeTrialEndDate', 'workSpaceId'
        ];

        // Build updateData with only the fields that were actually sent in the body
        const updateData = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                if (field === 'workSpaceId') {
                    updateData[field] = req.body[field] ? req.body[field] : null;
                } else {
                    updateData[field] = req.body[field];
                }
            }
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({
                message: 'No valid fields provided for update',
                success: 'false',
                status: '400'
            })
        }

        const editSubscription = await updateSubscriptionService(req.user._id, id, updateData)

        if (editSubscription === 'subscription not found') {
            return res.status(404).json({
                message: 'Subscription not found',
                success: 'false',
                status: '404'
            })
        }

        return res.status(200).json({
            message: 'Subscription updated successfully',
            success: 'true',
            status: '200'
        })

    }
    catch (e) {
        return res.status(500).json({
            message: `internal server error: ${e}`
        })
    }
}


async function deleteSubscription(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Unauthorized',
                success: 'false',
                status: '401'
            })
        }

        const { id } = req.params;
        const deleteResult = await deleteSubscriptionService(req.user._id, id);

        if (deleteResult === 'subscription not found') {
            return res.status(404).json({
                message: 'Subscription not found',
                success: 'false',
                status: '404'
            })
        }

        return res.status(200).json({
            message: 'Subscription deleted successfully',
            success: 'true',
            status: '200'
        })
    }
    catch (e) {
        return res.status(500).json({
            message: `internal server error: ${e}`
        })
    }
}


async function getSubscriptionById(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Unauthorized',
                success: 'false',
                status: '401'
            })
        }

        const { id } = req.params;
        const subscription = await subscriptionModel.findOne({
            _id: id,
            userId: req.user._id
        })

        if (!subscription) {
            return res.status(404).json({
                message: 'Subscription not found',
                success: 'false',
                status: '404'
            })
        }

        return res.status(200).json({
            message: 'Subscription found successfully',
            success: 'true',
            status: '200',
            subscription
        })
    }
    catch (e) {
        return res.status(500).json({
            message: `internal server error: ${e}`
        })
    }
}

async function searchSubscriptions(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Unauthorized',
                success: 'false',
                status: '401'
            })
        }

        res.setHeader('Accept-Query', 'application/json');

        const body = req.body ?? {};

        const {
            name,
            category,
            currency,
            billingCycle,
            paymentMethod,
            status,
            isFreeTrial,
            renewal,      // expired | today | 7d | 30d | 90d | 180d | 365d
            minPrice,
            maxPrice,
            sortBy,       // price | renewalDate | serviceName | createdAt | status
            order,        // asc | desc
        } = body;

        const filters = {
            name,
            category,
            currency,
            billingCycle,
            paymentMethod,
            status,
            isFreeTrial,
            renewal,
            minPrice,
            maxPrice,
            sortBy,
            order,
        };

        Object.keys(filters).forEach((k) => filters[k] === undefined && delete filters[k]);

        const results = await searchSubscriptionsService(req.user._id, filters);

        return res.status(200).json({
            status: '200',
            success: 'true',
            message: 'Search results fetched successfully',
            count: results.length,
            appliedFilters: filters,
            subscriptions: results,
        })
    } catch (e) {
        return res.status(500).json({
            message: `internal server error: ${e}`
        })
    }
}

async function bulkImportSubscriptions(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                message: 'Unauthorized',
                success: 'false',
                status: '401'
            });
        }

        const { subscriptions } = req.body;
        if (!Array.isArray(subscriptions) || subscriptions.length === 0) {
            return res.status(400).json({
                message: 'Invalid or empty subscriptions array',
                success: 'false',
                status: '400'
            });
        }

        const importedDocs = await bulkImportSubscriptionsService(req.user._id, subscriptions);

        return res.status(201).json({
            status: '201',
            success: 'true',
            message: `Successfully imported ${importedDocs.length} subscription(s)`,
            count: importedDocs.length,
            subscriptions: importedDocs
        });
    } catch (e) {
        return res.status(500).json({
            message: `Internal server error: ${e.message || e}`
        });
    }
}

export { getSubscriptionById, addSubscription, getSubscriptions, updateSubscription, deleteSubscription, searchSubscriptions, bulkImportSubscriptions }
