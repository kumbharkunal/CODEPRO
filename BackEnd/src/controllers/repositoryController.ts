import { Request, Response } from 'express';
import Repository from '../models/Repository';
import { AuthRequest } from '../middlewares/auth';

export const createRepository = async (req: AuthRequest, res: Response) => {
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

        // Only admins can connect repositories
        if (req.user.role !== 'admin') {
            return res.status(403).json({ 
                message: 'Only admins can connect repositories.',
                code: 'ACCESS_DENIED'
            });
        }

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
            connectedBy: connectedBy || req.user._id, // Use current user if not specified
        });

        await newRepository.save();
        res.status(201).json({
            message: 'Repository connected successfully',
            repository: newRepository,
        });

    } catch (error) {
        console.error("Error creating repository:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all repositories
// - Admins: See all repositories
// - Developers: See all repositories (they need to see reviews for all repos)
export const getAllRepositories = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user._id;
        const userRole = req.user.role;
        
        // Admins see all repositories
        // Developers and viewers see all repositories (for viewing reviews)
        const repositories = await Repository.find()
            .populate('connectedBy', 'name email')
            .sort({ createdAt: -1 });
            
        res.status(200).json(repositories);
    } catch (error) {
        console.error('Error fetching repositories', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get repositories by user
export const getUserRepositories = async (req: AuthRequest, res: Response) => {
    try {
        const { userId } = req.params;
        
        // Admins can view any user's repositories, others can only view their own
        if (req.user.role !== 'admin' && userId !== req.user._id.toString()) {
            return res.status(403).json({ 
                message: 'Access denied. You can only view your own repositories.',
                code: 'ACCESS_DENIED'
            });
        }
        
        const repositories = await Repository.find({ connectedBy: userId })
            .populate('connectedBy', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json(repositories);
    } catch (error) {
        console.error('Error fetching user repositories:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single repository
// - Admins: Can view any repository
// - Developers: Can view any repository (for viewing reviews)
export const getRepositoryById = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        
        const repository = await Repository.findById(id)
            .populate('connectedBy', 'name email');

        if (!repository) {
            return res.status(404).json({ message: 'Repository not found' });
        }

        res.status(200).json(repository);
    } catch (error) {
        console.error('Error fetching repository:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete repository (Admin only - enforced by route middleware)
export const deleteRepository = async (req: AuthRequest, res: Response) => {
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