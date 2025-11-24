import { Request, Response } from "express";
import User from '../models/User';
import Team from '../models/Team';
import { generateToken } from "../utils/jwt";

export const login = async (req: Request, res: Response) => {
    try {
        const { email, clerkId } = req.body;
        let user = await User.findOne({ $or: [{ email }, { clerkId }] });
        if (!user) {
            // Fresh signups are always admin with their own team
            user = new User({
                clerkId: clerkId || `temp_${Date.now()}`,
                email,
                name: email.split('@')[0],
                role: 'admin' // Fresh users are always admin
            });
            await user.save();

            // Create team automatically for every new admin
            const team = new Team({
                name: `${user.name}'s Team`,
                adminId: user._id,
                members: [user._id],
            });
            await team.save();

            // Link user to team
            user.teamId = team._id;
            await user.save();
        }

        const token = generateToken({
            userId: user.id.toString(),
            email: user.email,
            role: user.role,
        });

        res.status(200).json({
            message: 'Login succesful',
            token,
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

export const getCurrentUser = async (req: any, res: Response) => {
    try {
        const user = await User.findById(req.user._id).select('-__v');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.status(200).json(user);
    } catch (error) {
        console.error('Error fetching current user:', error);
        res.status(500).json({ message: 'Server error' });
    }
}