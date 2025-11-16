import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { repositoryService } from '@/services/repositoryService';
import { Repository } from '@/types';
import { Github, Trash2, Plus, GitBranch, Lock, Unlock, CheckCircle2, XCircle, ExternalLink } from 'lucide-react';
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-lg font-medium animate-pulse">Loading repositories...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8">
        {/* Header Section */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-6 sm:p-8 lg:p-10 text-primary-foreground shadow-2xl">
          <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,transparent,black)]"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/5 to-transparent"></div>
          
          <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                  <Github className="w-6 h-6" />
                </div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">Repositories</h1>
              </div>
              <p className="text-primary-foreground/80 text-sm sm:text-base">
                {repositories.length} {repositories.length === 1 ? 'repository' : 'repositories'} connected
              </p>
            </div>
            <Button 
              onClick={() => githubService.startOAuth()}
              size="lg"
              className="bg-white text-primary hover:bg-white/90 shadow-xl hover:shadow-2xl transition-all"
            >
              <Plus className="w-5 h-5 mr-2" />
              Connect Repository
            </Button>
          </div>
        </div>

        {/* Repository List */}
        {repositories.length === 0 ? (
          <Card className="border-2 border-dashed hover:border-primary/30 transition-all duration-300">
            <CardContent className="py-16 sm:py-24 text-center space-y-6">
              <div className="w-24 h-24 mx-auto bg-gradient-to-br from-primary/20 to-primary/5 rounded-3xl flex items-center justify-center">
                <Github className="w-12 h-12 text-primary/50" />
              </div>
              <div className="space-y-3">
                <p className="text-xl sm:text-2xl font-semibold">No Repositories Connected</p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Connect your first GitHub repository to start reviewing code with AI-powered analysis
                </p>
              </div>
              <Button 
                onClick={() => githubService.startOAuth()} 
                size="lg"
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all"
              >
                <Plus className="w-5 h-5 mr-2" />
                Connect Repository
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 xl:grid-cols-3">
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
  const isActive = repository.webhookActive;
  
  return (
    <Card className="group relative overflow-hidden border-2 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className={`absolute inset-0 bg-gradient-to-br ${isActive ? 'from-emerald-500/10 to-emerald-500/5' : 'from-secondary/50 to-transparent'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
      
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`p-3 rounded-xl ${isActive ? 'bg-emerald-500/10' : 'bg-secondary'} flex-shrink-0`}>
              <Github className={`w-6 h-6 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1 min-w-0 space-y-1">
              <CardTitle className="text-lg line-clamp-1 group-hover:text-primary transition-colors">
                {repository.name}
              </CardTitle>
              <CardDescription className="text-xs line-clamp-1">
                {repository.fullName}
              </CardDescription>
            </div>
          </div>
          <Badge 
            variant={isActive ? 'default' : 'secondary'}
            className={`${isActive ? 'bg-emerald-500 hover:bg-emerald-600' : ''} flex-shrink-0`}
          >
            {isActive ? (
              <>
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Active
              </>
            ) : (
              <>
                <XCircle className="w-3 h-3 mr-1" />
                Inactive
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="relative space-y-4">
        {repository.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
            {repository.description}
          </p>
        )}

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 p-3 rounded-lg border border-blue-500/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <GitBranch className="w-3.5 h-3.5" />
              <span>Branch</span>
            </div>
            <div className="text-sm font-semibold truncate">{repository.defaultBranch}</div>
          </div>
          
          <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 p-3 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              {repository.isPrivate ? (
                <Lock className="w-3.5 h-3.5" />
              ) : (
                <Unlock className="w-3.5 h-3.5" />
              )}
              <span>Visibility</span>
            </div>
            <div className="text-sm font-semibold">{repository.isPrivate ? 'Private' : 'Public'}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 hover:bg-primary/5 hover:text-primary hover:border-primary/50 transition-all" 
            asChild
          >
            <a
              href={`https://github.com/${repository.fullName}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              GitHub
            </a>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="flex-1 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 shadow-lg hover:shadow-xl transition-all"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}