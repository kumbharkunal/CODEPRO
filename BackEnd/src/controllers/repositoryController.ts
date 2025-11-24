import { Response } from 'express';
import { SUBSCRIPTION_LIMITS, PLANS } from '../config/constants';
import Repository from '../models/Repository';
import User from '../models/User';

export const createRepository = async (req: any, res: Response) => {
    try {
        const {
            githubRepoId,
            name,
            fullName,
            owner,
            description,
            isPrivate,
            defaultBranch,
            githubAccessToken,
        } = req.body;

        const userId = req.user._id;
        const teamId = req.user.teamId;

        if (!teamId) {
            return res.status(403).json({ message: 'User must be part of a team to connect repositories' });
        }

        // Check if repo already exists for this team
        const existingRepo = await Repository.findOne({ githubRepoId, teamId });
        if (existingRepo) {
            return res.status(400).json({ message: 'Repository already connected to your team' });
        }

        // SUBSCRIPTION CHECK START
        // Check subscription limits
        const user = await User.findById(userId);
        const currentPlan = user?.subscription?.plan || PLANS.FREE;
        const limit = SUBSCRIPTION_LIMITS[currentPlan as keyof typeof SUBSCRIPTION_LIMITS].maxRepositories;

        const repoCount = await Repository.countDocuments({
            teamId: teamId // Count per team
        });

        if (repoCount >= limit) {
            return res.status(403).json({
                message: `Plan limit reached. You can only connect ${limit} repositories on the ${currentPlan} plan.`
            });
        }
        // SUBSCRIPTION CHECK END

        const newRepository = new Repository({
            githubRepoId,
            name,
            fullName,
            owner,
            description,
            isPrivate,
            defaultBranch,
            connectedBy: userId,
            teamId,
            githubAccessToken,
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


// Get all repositories (TEAM-SCOPED - only team's repositories)
export const getAllRepositories = async (req: any, res: Response) => {
    try {
        const teamId = req.user.teamId;

        // If user has no team yet, return empty array instead of error
        if (!teamId) {
            return res.status(200).json([]);
        }

        const repositories = await Repository.find({ teamId })
            .populate('connectedBy', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json(repositories);
    } catch (error) {
        console.error('Error fetching repositories', error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// Get repositories by user (TEAM-SCOPED)
export const getUserRepositories = async (req: any, res: Response) => {
    try {
        const { userId } = req.params;
        const teamId = req.user.teamId;

        if (!teamId) {
            return res.status(403).json({ message: 'User must be part of a team' });
        }

        // Only return repos that belong to the user AND the team
        const repositories = await Repository.find({ connectedBy: userId, teamId })
            .sort({ createdAt: -1 });
        res.status(200).json(repositories);
    } catch (error) {
        console.error('Error fetching user repositories:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single repository (TEAM-SCOPED with ownership verification)
export const getRepositoryById = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const teamId = req.user.teamId;

        if (!teamId) {
            return res.status(403).json({ message: 'User must be part of a team' });
        }

        const repository = await Repository.findOne({ _id: id, teamId })
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

// Delete repository (ADMIN ONLY, TEAM-SCOPED)
export const deleteRepository = async (req: any, res: Response) => {
    try {
        const { id } = req.params;
        const teamId = req.user.teamId;

        if (!teamId) {
            return res.status(403).json({ message: 'User must be part of a team' });
        }

        const repository = await Repository.findOneAndDelete({ _id: id, teamId });

        if (!repository) {
            return res.status(404).json({ message: 'Repository not found' });
        }

        // TODO: Also delete associated reviews if needed
        // await Review.deleteMany({ repositoryId: id });

        res.status(200).json({ message: 'Repository disconnected successfully' });
    } catch (error) {
        console.error('Error deleting repository:', error);
        res.status(500).json({ message: 'Server error' });
    }
};
