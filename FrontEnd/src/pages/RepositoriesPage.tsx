import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { repositoryService } from '@/services/repositoryService';
import { Repository } from '@/types';
import { Github, Trash2, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import { githubService } from '@/services/githubService';

export default function RepositoriesPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      const data = await repositoryService.getAllRepositories();
      setRepositories(data);
    } catch (error) {
      console.error('Error fetching repositories:', error);
      toast.error('Failed to load repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to disconnect this repository?')) {
      return;
    }

    try {
      await repositoryService.deleteRepository(id);
      setRepositories(repositories.filter(r => r._id !== id));
      toast.success('Repository disconnected');
    } catch (error) {
      toast.error('Failed to disconnect repository');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading repositories...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Repositories</h1>
          <p className="text-muted-foreground">Manage connected GitHub repositories</p>
        </div>
        <Button onClick={() => githubService.startOAuth()}>
          <Plus className="w-4 h-4 mr-2" />
          Connect GitHub Repository
        </Button>
      </div>

      {/* Repository List */}
      {repositories.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center space-y-4">
            <Github className="w-12 h-12 mx-auto text-muted-foreground" />
            <div>
              <p className="text-lg font-medium">No repositories connected</p>
              <p className="text-sm text-muted-foreground mt-2">
                Connect your first GitHub repository to start reviewing code
              </p>
            </div>
            <Button onClick={() => githubService.startOAuth()}>
              <Plus className="w-4 h-4 mr-2" />
              Connect Repository
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {repositories.map((repo) => (
            <RepositoryCard
              key={repo._id}
              repository={repo}
              onDelete={() => handleDelete(repo._id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RepositoryCard({
  repository,
  onDelete
}: {
  repository: Repository;
  onDelete: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Github className="w-8 h-8 text-muted-foreground" />
            <div>
              <CardTitle className="text-lg">{repository.name}</CardTitle>
              <CardDescription>{repository.fullName}</CardDescription>
            </div>
          </div>
          <Badge variant={repository.webhookActive ? 'default' : 'secondary'}>
            {repository.webhookActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {repository.description && (
            <p className="text-sm text-muted-foreground">{repository.description}</p>
          )}

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Branch:</span>
              <span className="font-medium">{repository.defaultBranch}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-muted-foreground">Visibility:</span>
              <span className="font-medium">{repository.isPrivate ? 'Private' : 'Public'}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" size="sm" asChild>
              <a
                href={`https://github.com/${repository.fullName}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on GitHub
              </a>
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}