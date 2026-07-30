import mongoose from "mongoose";
import workspaceModel from "../models/workspace.model.js";
import subscriptionModel from "../models/subscription.model.js";

export async function createWorkspace(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: '401',
                message: "Unauthorized"
            });
        }

        const { name, category, colorTheme, iconName } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                status: '400',
                message: "Workspace name is required"
            });
        }

        const formattedName = name.trim();

        // 1. Check whether workspace with given name already exists for this user (case-insensitive check)
        const existingWorkspace = await workspaceModel.findOne({
            userId: req.user._id,
            name: { $regex: `^${formattedName}$`, $options: 'i' }
        });

        if (existingWorkspace) {
            return res.status(400).json({
                status: '400',
                message: `Workspace with name "${formattedName}" already exists`
            });
        }

        // 2. Create new workspace
        const workspace = await workspaceModel.create({
            name: formattedName,
            category: category || 'General',
            colorTheme,
            iconName,
            userId: req.user._id
        });

        return res.status(201).json({
            status: '201',
            message: "Workspace created successfully",
            workspace
        });
    } catch (e) {
        return res.status(500).json({
            status: '500',
            message: `Internal server error: ${e.message || e}`
        });
    }
}

export const getAllWorkspace = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: '401',
                message: "Unauthorized"
            });
        }

        const workspace = await workspaceModel.find({
            userId: req.user._id
        });

        return res.status(200).json({
            status: '200',
            message: "Workspaces fetched successfully",
            workspace
        });
    } catch (error) {
        return res.status(500).json({
            status: '500',
            message: `Internal server error: ${error.message || error}`
        });
    }
};

export const getWorkspaceById = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: '401',
                message: "Unauthorized"
            });
        }

        const { id } = req.params;

        const workspace = await workspaceModel.findOne({
            _id: id,
            userId: req.user._id
        });

        if (!workspace) {
            return res.status(404).json({
                status: '404',
                message: "Workspace not found"
            });
        }

        return res.status(200).json({
            status: '200',
            message: "Workspace details fetched successfully",
            workspace
        });
    } catch (error) {
        return res.status(500).json({
            status: '500',
            message: `Internal server error: ${error.message || error}`
        });
    }
};

export const updateWorkspace = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: '401',
                message: "Unauthorized"
            });
        }

        const { id } = req.params;
        const { name } = req.body;

        // If updating name, check for duplicate workspace name
        if (name && name.trim()) {
            const formattedName = name.trim();
            const existing = await workspaceModel.findOne({
                _id: { $ne: id },
                userId: req.user._id,
                name: { $regex: `^${formattedName}$`, $options: 'i' }
            });

            if (existing) {
                return res.status(400).json({
                    status: '400',
                    message: `Workspace with name "${formattedName}" already exists`
                });
            }
        }

        const workspace = await workspaceModel.findOneAndUpdate(
            { _id: id, userId: req.user._id },
            req.body,
            { new: true }
        );

        if (!workspace) {
            return res.status(404).json({
                status: '404',
                message: "Workspace not found"
            });
        }

        return res.status(200).json({
            status: '200',
            message: "Workspace updated successfully",
            workspace
        });
    } catch (error) {
        return res.status(500).json({
            status: '500',
            message: `Internal server error: ${error.message || error}`
        });
    }
};

export async function getSubscriptionsInWorkspace(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: '401',
                message: "Unauthorized"
            });
        }

        const { id } = req.params;

        const workspace = await workspaceModel.findOne({
            _id: id,
            userId: req.user._id
        });

        if (!workspace) {
            return res.status(404).json({
                status: '404',
                message: "Workspace not found or unauthorized"
            });
        }

        const subscriptions = await subscriptionModel.find({
            workSpaceId: id,
            userId: req.user._id
        });

        return res.status(200).json({
            status: '200',
            message: "Subscriptions fetched successfully",
            subscriptions
        });
    } catch (error) {
        return res.status(500).json({
            status: '500',
            message: `Internal server error: ${error.message || error}`
        });
    }
}

export async function deleteWorkspace(req, res, next) {
    try {
        if (!req.user) {
            return res.status(401).json({
                status: '401',
                message: "Unauthorized"
            });
        }

        const { id } = req.params;

        const workspace = await workspaceModel.findOne({
            _id: id,
            userId: req.user._id
        });

        if (!workspace) {
            return res.status(404).json({
                status: '404',
                message: "Workspace not found or unauthorized"
            });
        }

        // Mongoose Transaction for sequence of DB operations (Delete Subscriptions + Delete Workspace)
        const session = await mongoose.startSession();
        try {
            session.startTransaction();

            // 1. Delete all subscriptions belonging to this workspace
            await subscriptionModel.deleteMany({ workSpaceId: id, userId: req.user._id }, { session });

            // 2. Delete workspace document
            await workspaceModel.deleteOne({ _id: id, userId: req.user._id }, { session });

            await session.commitTransaction();
            session.endSession();
        } catch (txnError) {
            if (session.inTransaction()) {
                await session.abortTransaction();
            }
            session.endSession();

            // Fallback for standalone MongoDB instances without replica set support
            if (txnError.message && (txnError.message.includes('replica set') || txnError.message.includes('Transaction numbers'))) {
                await subscriptionModel.deleteMany({ workSpaceId: id, userId: req.user._id });
                await workspaceModel.deleteOne({ _id: id, userId: req.user._id });
            } else {
                throw txnError;
            }
        }

        return res.status(200).json({
            status: '200',
            message: "Workspace and its associated subscriptions deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({
            status: '500',
            message: `Internal server error: ${error.message || error}`
        });
    }
}
