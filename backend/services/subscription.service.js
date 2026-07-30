import mongoose from "mongoose";
import subscriptionModel from "../models/subscription.model.js";
import workspaceModel from "../models/workspace.model.js";

export async function addSubscriptionService(
    userId, serviceName, billingCycle, price, currency, category,
    renewalDate, notes, paymentMethod, status, isFreeTrial, freeTrialEndDate, workSpaceId
) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const doc = {
            userId,
            serviceName,
            price,
            billingCycle,
            currency,
            category,
            renewalDate,
            notes,
            paymentMethod,
            status: status || 'active',
            isFreeTrial: Boolean(isFreeTrial),
            freeTrialEndDate: isFreeTrial ? freeTrialEndDate : undefined,
            workSpaceId: workSpaceId || undefined
        };

        // Sequence of DB Operations (Create Subscription + Increment Workspace Count)
        const createdArray = await subscriptionModel.create([doc], { session });
        const createdSubscription = createdArray[0];

        if (workSpaceId) {
            await workspaceModel.findByIdAndUpdate(
                workSpaceId,
                { $inc: { totalNumberOfSubscriptions: 1 } },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();
        return createdSubscription;
    } catch (e) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();

        // Fallback for standalone MongoDB environments where transactions are not enabled
        if (e.message && (e.message.includes('replica set') || e.message.includes('Transaction numbers'))) {
            const createdSubscription = await subscriptionModel.create({
                userId,
                serviceName,
                price,
                billingCycle,
                currency,
                category,
                renewalDate,
                notes,
                paymentMethod,
                status: status || 'active',
                isFreeTrial: Boolean(isFreeTrial),
                freeTrialEndDate: isFreeTrial ? freeTrialEndDate : undefined,
                workSpaceId: workSpaceId || undefined
            });

            if (workSpaceId) {
                await workspaceModel.findByIdAndUpdate(workSpaceId, { $inc: { totalNumberOfSubscriptions: 1 } });
            }
            return createdSubscription;
        }
        throw e;
    }
}

export async function bulkImportSubscriptionsService(userId, subscriptionsArray) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const prepareDocs = subscriptionsArray.map(sub => ({
            userId,
            serviceName: String(sub.serviceName || '').trim().toLowerCase(),
            category: String(sub.category || 'General').trim(),
            price: Number(sub.price) || 0,
            currency: String(sub.currency || 'USD').toUpperCase().trim(),
            billingCycle: String(sub.billingCycle || 'monthly').toLowerCase().trim(),
            renewalDate: sub.renewalDate ? new Date(sub.renewalDate) : new Date(Date.now() + 30 * 86400000),
            paymentMethod: String(sub.paymentMethod || 'Credit Card').trim(),
            notes: sub.notes ? String(sub.notes).trim() : 'Bulk imported',
            status: sub.status ? String(sub.status).toLowerCase().trim() : 'active',
            isFreeTrial: Boolean(sub.isFreeTrial),
            freeTrialEndDate: sub.isFreeTrial && sub.freeTrialEndDate ? new Date(sub.freeTrialEndDate) : undefined,
            workSpaceId: sub.workSpaceId || undefined,
        }));

        // Sequence of DB Operations (Bulk Insert Subscriptions + Increment Workspace Counts)
        const inserted = await subscriptionModel.insertMany(prepareDocs, { session });

        const workspaceCounts = {};
        prepareDocs.forEach(d => {
            if (d.workSpaceId) {
                workspaceCounts[d.workSpaceId] = (workspaceCounts[d.workSpaceId] || 0) + 1;
            }
        });

        for (const [wsId, count] of Object.entries(workspaceCounts)) {
            await workspaceModel.findByIdAndUpdate(wsId, { $inc: { totalNumberOfSubscriptions: count } }, { session });
        }

        await session.commitTransaction();
        session.endSession();
        return inserted;
    } catch (e) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();

        if (e.message && (e.message.includes('replica set') || e.message.includes('Transaction numbers'))) {
            const prepareDocs = subscriptionsArray.map(sub => ({
                userId,
                serviceName: String(sub.serviceName || '').trim().toLowerCase(),
                category: String(sub.category || 'General').trim(),
                price: Number(sub.price) || 0,
                currency: String(sub.currency || 'USD').toUpperCase().trim(),
                billingCycle: String(sub.billingCycle || 'monthly').toLowerCase().trim(),
                renewalDate: sub.renewalDate ? new Date(sub.renewalDate) : new Date(Date.now() + 30 * 86400000),
                paymentMethod: String(sub.paymentMethod || 'Credit Card').trim(),
                notes: sub.notes ? String(sub.notes).trim() : 'Bulk imported',
                status: sub.status ? String(sub.status).toLowerCase().trim() : 'active',
                isFreeTrial: Boolean(sub.isFreeTrial),
                freeTrialEndDate: sub.isFreeTrial && sub.freeTrialEndDate ? new Date(sub.freeTrialEndDate) : undefined,
                workSpaceId: sub.workSpaceId || undefined,
            }));

            const inserted = await subscriptionModel.insertMany(prepareDocs);
            const workspaceCounts = {};
            prepareDocs.forEach(d => {
                if (d.workSpaceId) workspaceCounts[d.workSpaceId] = (workspaceCounts[d.workSpaceId] || 0) + 1;
            });
            for (const [wsId, count] of Object.entries(workspaceCounts)) {
                await workspaceModel.findByIdAndUpdate(wsId, { $inc: { totalNumberOfSubscriptions: count } });
            }
            return inserted;
        }
        throw e;
    }
}

export async function findSubscriptionsById(userId) {
    try {
        const foundSubscriptions = await subscriptionModel.find({
            userId
        });
        return foundSubscriptions;
    } catch (e) {
        throw e;
    }
}

export async function updateSubscriptionService(userId, subscription_id, updateData) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        const subscriptionData = await subscriptionModel.findOne({
            _id: subscription_id,
            userId
        }).session(session);

        if (!subscriptionData) {
            session.endSession();
            return 'subscription not found';
        }

        const oldWsId = subscriptionData.workSpaceId ? String(subscriptionData.workSpaceId) : null;
        const newWsId = updateData.workSpaceId !== undefined ? (updateData.workSpaceId ? String(updateData.workSpaceId) : null) : oldWsId;

        const updatedSubscription = await subscriptionModel.updateOne(
            { _id: subscription_id, userId },
            { $set: updateData },
            { session }
        );

        if (oldWsId !== newWsId) {
            if (oldWsId) {
                await workspaceModel.findByIdAndUpdate(oldWsId, { $inc: { totalNumberOfSubscriptions: -1 } }, { session });
            }
            if (newWsId) {
                await workspaceModel.findByIdAndUpdate(newWsId, { $inc: { totalNumberOfSubscriptions: 1 } }, { session });
            }
        }

        await session.commitTransaction();
        session.endSession();
        return updatedSubscription;
    } catch (e) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();

        if (e.message && (e.message.includes('replica set') || e.message.includes('Transaction numbers'))) {
            const subscriptionData = await subscriptionModel.findOne({ _id: subscription_id, userId });
            if (!subscriptionData) return 'subscription not found';

            const oldWsId = subscriptionData.workSpaceId ? String(subscriptionData.workSpaceId) : null;
            const newWsId = updateData.workSpaceId !== undefined ? (updateData.workSpaceId ? String(updateData.workSpaceId) : null) : oldWsId;

            const updatedSubscription = await subscriptionModel.updateOne({ _id: subscription_id, userId }, { $set: updateData });

            if (oldWsId !== newWsId) {
                if (oldWsId) await workspaceModel.findByIdAndUpdate(oldWsId, { $inc: { totalNumberOfSubscriptions: -1 } });
                if (newWsId) await workspaceModel.findByIdAndUpdate(newWsId, { $inc: { totalNumberOfSubscriptions: 1 } });
            }
            return updatedSubscription;
        }
        throw e;
    }
}

export async function deleteSubscriptionService(userId, subscription_id) {
    const session = await mongoose.startSession();
    try {
        session.startTransaction();

        // Sequence of DB Operations (Find Subscription + Delete Subscription + Decrement Workspace Count)
        const subscriptionData = await subscriptionModel.findOne({
            _id: subscription_id,
            userId
        }).session(session);

        if (!subscriptionData) {
            session.endSession();
            return 'subscription not found';
        }

        const deleteSubscription = await subscriptionModel.deleteOne({
            _id: subscription_id,
            userId
        }, { session });

        if (subscriptionData.workSpaceId) {
            await workspaceModel.findByIdAndUpdate(
                subscriptionData.workSpaceId,
                { $inc: { totalNumberOfSubscriptions: -1 } },
                { session }
            );
        }

        await session.commitTransaction();
        session.endSession();
        return deleteSubscription;
    } catch (e) {
        if (session.inTransaction()) {
            await session.abortTransaction();
        }
        session.endSession();

        if (e.message && (e.message.includes('replica set') || e.message.includes('Transaction numbers'))) {
            const subscriptionData = await subscriptionModel.findOne({ _id: subscription_id, userId });
            if (!subscriptionData) return 'subscription not found';

            const deleteSubscription = await subscriptionModel.deleteOne({ _id: subscription_id, userId });
            if (subscriptionData.workSpaceId) {
                await workspaceModel.findByIdAndUpdate(subscriptionData.workSpaceId, { $inc: { totalNumberOfSubscriptions: -1 } });
            }
            return deleteSubscription;
        }
        throw e;
    }
}

export async function searchSubscriptionsService(userId, filters = {}) {
    try {
        const query = { userId };

        if (filters.name) {
            query.serviceName = { $regex: filters.name.trim(), $options: 'i' };
        }

        if (filters.category) {
            query.category = { $regex: `^${filters.category.trim()}$`, $options: 'i' };
        }

        if (filters.currency) {
            query.currency = { $regex: `^${filters.currency.trim()}$`, $options: 'i' };
        }

        if (filters.billingCycle) {
            query.billingCycle = { $regex: `^${filters.billingCycle.trim()}$`, $options: 'i' };
        }

        if (filters.paymentMethod) {
            query.paymentMethod = { $regex: filters.paymentMethod.trim(), $options: 'i' };
        }

        if (filters.status) {
            query.status = filters.status.trim().toLowerCase();
        }

        if (filters.isFreeTrial !== undefined && filters.isFreeTrial !== '') {
            query.isFreeTrial = String(filters.isFreeTrial) === 'true';
        }

        if (filters.workSpaceId) {
            query.workSpaceId = filters.workSpaceId;
        }

        if (filters.renewal) {
            const now  = new Date();
            const sod  = new Date(now.getFullYear(), now.getMonth(), now.getDate());

            const renewalPresets = {
                expired: { $lt: sod },
                today:   { $gte: sod, $lt: new Date(sod.getTime() + 86_400_000) },
                '7d':    { $gte: sod, $lte: new Date(sod.getTime() + 7   * 86_400_000) },
                '30d':   { $gte: sod, $lte: new Date(sod.getTime() + 30  * 86_400_000) },
                '90d':   { $gte: sod, $lte: new Date(sod.getTime() + 90  * 86_400_000) },
                '180d':  { $gte: sod, $lte: new Date(sod.getTime() + 180 * 86_400_000) },
                '365d':  { $gte: sod, $lte: new Date(sod.getTime() + 365 * 86_400_000) },
            };

            if (renewalPresets[filters.renewal]) {
                query.renewalDate = renewalPresets[filters.renewal];
            }
        }

        const priceFilter = {};
        if (filters.minPrice !== undefined && !isNaN(Number(filters.minPrice))) {
            priceFilter.$gte = Number(filters.minPrice);
        }
        if (filters.maxPrice !== undefined && !isNaN(Number(filters.maxPrice))) {
            priceFilter.$lte = Number(filters.maxPrice);
        }
        if (Object.keys(priceFilter).length > 0) {
            query.price = priceFilter;
        }

        const allowedSortFields = ['price', 'renewalDate', 'serviceName', 'createdAt', 'status'];
        const sortField  = allowedSortFields.includes(filters.sortBy) ? filters.sortBy : 'renewalDate';
        const sortOrder  = filters.order === 'desc' ? -1 : 1;
        const sortObj    = { [sortField]: sortOrder };

        const results = await subscriptionModel.find(query).sort(sortObj);
        return results;
    } catch (e) {
        throw e;
    }
}