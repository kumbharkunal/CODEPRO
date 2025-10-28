import { Request, Response } from "express";
import User from "../models/User";


export const createUser = async (req: Request, res: Response) => {
    try {
        const { clerkId, email, name, profileImage, role } = req.body;

        const existingUser = await User.findOne({ clerkId });
        if (existingUser) {
            return res.status(400).json({ message: "User already exist" });
        }

        const newUser = new User({
            clerkId,
            email,
            name,
            profileImage: profileImage || '',
            role: role || 'viewer',
        });

        await newUser.save();
        res.status(201).json({ message: 'User created succesfully', user: newUser });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({ message: "Server Error" });
    }
};


export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Server error" });
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