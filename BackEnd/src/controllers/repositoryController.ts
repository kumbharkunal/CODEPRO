import { Request, Response } from 'express';
import Repository from '../models/Repository';

export const createRepository = async (req: Request, res: Response) => {
    try {
        const {
            githubRepoId,
            name,
            fullName,
            owner,
            description,
            isPrivate,
            defaultBranch,
            connectedBy,
        } = req.body;

        const existingRepo = await Repository.findOne({ githubRepoId });
        if (existingRepo) {
            return res.status(400).json({ message: 'Repository already connected' });
        }
        const newRepository = new Repository({
            githubRepoId,
            name,
            fullName,
            owner,
            description,
            isPrivate,
            defaultBranch,
            connectedBy,
        });

        await newRepository.save();
        res.status(201).json({
            message: 'Repository connected succesfully',
            Repository: newRepository,
        });

    } catch (error) {
        console.error("Error creating respository:", error);
        res.status(500).json({ message: 'Server error' });
    }
};


// Get all repositories
export const getAllRepositories = async (req: Request, res: Response) => {
    try {
        const repositories = await Repository.find().populate('connectedBy', 'name email');
        res.status(200).json(repositories);
    } catch (error) {
        console.error('Error fetching repositories', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get repositories by user
export const getUserRepositories = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const repositories = await Repository.find({ connectedBy: userId });
        res.status(200).json(repositories);
    } catch (error) {
        console.error('Error fetching user repositories:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single repository
export const getRepositoryById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const repository = await Repository.findById(id).populate('connectedBy', 'name email');

        if (!repository) {
            return res.status(404).json({ message: 'Repository not found' });
        }

        res.status(200).json(repository);
    } catch (error) {
        console.error('Error fetching repository:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete repository
export const deleteRepository = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const repository = await Repository.findByIdAndDelete(id);

        if (!repository) {
            return res.status(404).json({ message: 'Repository not found' });
        }

        res.status(200).json({ message: 'Repository disconnected successfully' });
    } catch (error) {
        console.error('Error deleting repository:', error);
        res.status(500).json({ message: 'Server error' });
    }
};