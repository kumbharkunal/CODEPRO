import { Request, Response } from 'express';
import { Octokit } from '@octokit/rest';
import Repository from '../models/Repository';
import User from '../models/User';



// Exchange code for access token
export const githubCallback = async (req: Request, res: Response) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({ message: 'Code is required' });
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }),
    });

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
      error?: string;
      error_description?: string;
    };


    if (tokenData.error) {
      return res.status(400).json({ message: tokenData.error_description });
    }

    const accessToken = tokenData.access_token;

    // Get GitHub user info
    const octokit = new Octokit({ auth: accessToken });
    const { data: githubUser } = await octokit.users.getAuthenticated();

    res.status(200).json({
      accessToken,
      githubUser: {
        login: githubUser.login,
        name: githubUser.name,
        avatar: githubUser.avatar_url,
      },
    });
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ message: 'GitHub authentication failed' });
  }
};

// Get user's repositories from GitHub
export const getUserGitHubRepos = async (req: Request, res: Response) => {
  try {
    const { accessToken } = req.body;

    if (!accessToken) {
      return res.status(400).json({ message: 'Access token is required' });
    }

    const octokit = new Octokit({ auth: accessToken });

    // Get user's repos (up to 100)
    const { data: repos } = await octokit.repos.listForAuthenticatedUser({
      per_page: 100,
      sort: 'updated',
      affiliation: 'owner',
    });

    // Filter and format repositories
    const formattedRepos = repos.map(repo => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      isPrivate: repo.private,
      defaultBranch: repo.default_branch,
      owner: repo.owner.login,
      url: repo.html_url,
    }));

    res.status(200).json(formattedRepos);
  } catch (error) {
    console.error('Error fetching GitHub repos:', error);
    res.status(500).json({ message: 'Failed to fetch repositories' });
  }
};

// Connect repository (save to database and create webhook)
export const connectRepository = async (req: Request, res: Response) => {
  try {
    const {
      githubRepoId,
      name,
      fullName,
      owner,
      description,
      isPrivate,
      defaultBranch,
      accessToken,
      userId
    } = req.body;

    // Check if already connected
    const existingRepo = await Repository.findOne({ githubRepoId });
    if (existingRepo) {
      return res.status(400).json({ message: 'Repository already connected' });
    }

    // Create webhook on GitHub
    const octokit = new Octokit({ auth: accessToken });

    const [repoOwner, repoName] = fullName.split('/');

    // Get webhook URL (use environment variable or construct)
    const webhookUrl = process.env.WEBHOOK_URL;
    let webhookId = null;
    let webhookActive = false;
    let webhookWarning = null;

    if (!webhookUrl) {
      console.warn('⚠️ WEBHOOK_URL is not set in environment variables. Skipping webhook creation.');
      console.warn('⚠️ You will need to manually create webhooks or set WEBHOOK_URL to enable automatic PR reviews.');
      webhookWarning = 'Webhook not created - WEBHOOK_URL not configured. You can add webhooks manually later.';
    } else {
      try {
        // First, check if webhook already exists
        const { data: existingHooks } = await octokit.repos.listWebhooks({
          owner: repoOwner,
          repo: repoName,
        });

        // Find existing webhook with matching URL
        const existingWebhook = existingHooks.find((hook: any) => 
          hook.config?.url === webhookUrl
        );

        if (existingWebhook) {
          // Reuse existing webhook
          webhookId = existingWebhook.id;
          webhookActive = existingWebhook.active;
          console.log(`✅ Found existing webhook with ID: ${webhookId} (active: ${webhookActive})`);
          
          // Update webhook to ensure it has the correct configuration
          try {
            await octokit.repos.updateWebhook({
              owner: repoOwner,
              repo: repoName,
              hook_id: webhookId,
              config: {
                url: webhookUrl,
                content_type: 'json',
                secret: process.env.GITHUB_WEBHOOK_SECRET,
              },
              events: ['pull_request'],
              active: true,
            });
            webhookActive = true;
            console.log(`✅ Updated existing webhook configuration`);
          } catch (updateError: any) {
            console.warn('⚠️ Could not update webhook configuration:', updateError.message);
            // Continue with existing webhook even if update fails
          }
        } else {
          // Create new webhook
          const { data: webhook } = await octokit.repos.createWebhook({
            owner: repoOwner,
            repo: repoName,
            config: {
              url: webhookUrl,
              content_type: 'json',
              secret: process.env.GITHUB_WEBHOOK_SECRET,
            },
            events: ['pull_request'],
          });

          webhookId = webhook.id;
          webhookActive = true;
          console.log(`✅ Webhook created successfully with ID: ${webhookId}`);
        }
      } catch (webhookError: any) {
        console.error('❌ Failed to create/update webhook:', webhookError.message);
        
        // More specific error messages
        if (webhookError.message.includes('Hook already exists')) {
          webhookWarning = 'A webhook already exists for this repository. It will continue to work.';
        } else if (webhookError.status === 403) {
          webhookWarning = 'Insufficient permissions to manage webhooks. Please ensure your GitHub token has admin:repo_hook scope.';
        } else if (webhookError.status === 404) {
          webhookWarning = 'Repository not found or access denied. Please check repository permissions.';
        } else {
          webhookWarning = 'Webhook setup encountered an issue, but the repository was connected successfully.';
        }
        // Continue even if webhook creation fails (can add manually)
      }
    }

    // Save to database
    const newRepo = new Repository({
      githubRepoId,
      name,
      fullName,
      owner,
      description,
      isPrivate,
      defaultBranch,
      webhookId,
      webhookActive,
      connectedBy: userId,
      githubAccessToken: accessToken, // Store encrypted in production!
    });

    await newRepo.save();

    // Update user's repositories array
    await User.findByIdAndUpdate(userId, {
      $push: { repositories: newRepo._id },
    });

    res.status(201).json({
      message: 'Repository connected successfully',
      repository: newRepo,
      webhookCreated: webhookActive,
      webhookWarning: webhookWarning,
    });
  } catch (error) {
    console.error('Error connecting repository:', error);
    res.status(500).json({ message: 'Failed to connect repository' });
  }
};

// Disconnect repository (remove webhook and delete from database)
export const disconnectRepository = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const repository = await Repository.findById(id);

    if (!repository) {
      return res.status(404).json({ message: 'Repository not found' });
    }

    // Remove webhook from GitHub if it exists
    if (repository.webhookId && repository.githubAccessToken) {
      try {
        const octokit = new Octokit({ auth: repository.githubAccessToken });
        const [repoOwner, repoName] = repository.fullName.split('/');

        await octokit.repos.deleteWebhook({
          owner: repoOwner,
          repo: repoName,
          hook_id: repository.webhookId,
        });
      } catch (webhookError) {
        console.error('Failed to delete webhook:', webhookError);
        // Continue with disconnection even if webhook deletion fails
      }
    }

    // Remove from user's repositories
    await User.findByIdAndUpdate(repository.connectedBy, {
      $pull: { repositories: repository._id },
    });

    // Delete from database
    await Repository.findByIdAndDelete(id);

    res.status(200).json({ message: 'Repository disconnected successfully' });
  } catch (error) {
    console.error('Error disconnecting repository:', error);
    res.status(500).json({ message: 'Failed to disconnect repository' });
  }
};