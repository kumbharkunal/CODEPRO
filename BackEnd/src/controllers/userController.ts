import { Request, Response } from "express";
import User from "../models/User";
import Team from "../models/Team";


export const createUser = async (req: Request, res: Response) => {
    try {
        const { clerkId, email, name, profileImage } = req.body;

        const existingUser = await User.findOne({ clerkId });
        if (existingUser) {
            return res.status(400).json({ message: "User already exist" });
        }

        // SECURITY FIX: Fresh signups are always admin with their own team
        // Only invitation acceptance sets role to 'developer'
        const newUser = new User({
            clerkId,
            email,
            name,
            profileImage: profileImage || '',
            role: 'admin', // Fresh users are always admin
        });

        await newUser.save();

        // Create team automatically for every new admin
        const team = new Team({
            name: `${newUser.name}'s Team`,
            adminId: newUser._id,
            members: [newUser._id],
        });
        await team.save();

        // Link user to team
        newUser.teamId = team._id;
        await newUser.save();

        res.status(201).json({ message: 'User created successfully', user: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: "Server Error" });
    }
};


// Get all users (TEAM-SCOPED - only team members)
export const getAllUsers = async (req: any, res: Response) => {
    try {
        const teamId = req.user.teamId;

        if (!teamId) {
            return res.status(403).json({ message: 'User must be part of a team' });
        }

        const users = await User.find({ teamId })
            .select('name email profileImage role createdAt')
            .sort({ createdAt: 1 });
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
    }
};

// Update user role (ADMIN ONLY, TEAM-SCOPED)
export const updateUserRole = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { role } = req.body as { role: 'admin' | 'developer' };
        const teamId = req.user.teamId;

        if (!teamId) {
            return res.status(403).json({ message: 'User must be part of a team' });
        }

        // Only allow admin and developer roles
        if (!['admin', 'developer'].includes(role)) {
            return res.status(400).json({ message: 'Invalid role. Only admin and developer are allowed.' });
        }

        // Find user and verify they're in the same team
        const targetUser = await User.findById(id);
        if (!targetUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (targetUser.teamId?.toString() !== teamId.toString()) {
            return res.status(403).json({ message: 'Cannot modify user from different team' });
        }

        // Cannot change the team admin's role
        const Team = require('../models/Team').default;
        const team = await Team.findById(teamId);
        if (team && team.adminId.toString() === id) {
            return res.status(400).json({ message: 'Cannot change team admin role' });
        }

        targetUser.role = role;
        await targetUser.save();

        res.status(200).json(targetUser);
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update user profile (ALL AUTHENTICATED USERS - can only update their own profile)
export const updateUserProfile = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const authenticatedUserId = req.user._id.toString();

        // Users can only update their own profile
        if (id !== authenticatedUserId) {
            return res.status(403).json({ message: 'You can only update your own profile' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Only allow updating name (profile image is handled separately via upload endpoint)
        if (name !== undefined && name.trim()) {
            user.name = name.trim();
        }

        await user.save();

        res.status(200).json(user);
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getUserById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error("Error fetching User", error);
        res.status(500).json({ message: "Sever error" });
    }
};