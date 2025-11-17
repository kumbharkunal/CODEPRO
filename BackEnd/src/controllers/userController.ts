import { Request, Response } from "express";
import User from "../models/User";
import { AuthRequest } from "../middlewares/auth";

export const createUser = async (req: AuthRequest, res: Response) => {
    try {
        const { clerkId, email, name, profileImage, role } = req.body;

        const existingUser = await User.findOne({ clerkId });
        if (existingUser) {
            return res.status(400).json({ message: "User already exist" });
        }

        // Only allow creating users with 'developer' or 'viewer' role
        // Admins are created manually or via special process
        const allowedRole = role === 'admin' ? 'viewer' : (role || 'viewer');
        
        const newUser = new User({
            clerkId,
            email,
            name,
            profileImage: profileImage || '',
            role: allowedRole,
        });

        await newUser.save();
        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: "Server Error" });
    }
};

export const getAllUsers = async (req: AuthRequest, res: Response) => {
    try {
        // Only admins can access this (enforced by route middleware)
        const users = await User.find().select('-__v').sort({ createdAt: -1 });
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getUserById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const userId = req.user._id.toString();
        
        // Users can only view their own profile, or admins can view any
        if (id !== userId && req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: "Access denied. You can only view your own profile.",
                code: 'ACCESS_DENIED'
            });
        }

        const user = await User.findById(id).select('-__v');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching User", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const updateUserRole = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        // Validate role
        if (!['admin', 'developer', 'viewer'].includes(role)) {
            return res.status(400).json({ 
                message: "Invalid role. Must be 'admin', 'developer', or 'viewer'." 
            });
        }

        // Prevent changing own role (security measure)
        if (id === req.user._id.toString()) {
            return res.status(400).json({ 
                message: "You cannot change your own role." 
            });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { role },
            { new: true, runValidators: true }
        ).select('-__v');

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ 
            message: 'User role updated successfully', 
            user 
        });
    } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Prevent deleting own account
        if (id === req.user._id.toString()) {
            return res.status(400).json({ 
                message: "You cannot delete your own account." 
            });
        }

        const user = await User.findByIdAndDelete(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json({ 
            message: 'User deleted successfully' 
        });
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ message: "Server error" });
    }
};