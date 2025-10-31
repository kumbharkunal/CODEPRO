import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { githubService } from '@/services/githubService';
import { useAppSelector } from '@/store/hooks';
import { Github, Search, Check } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ConnectRepositoryPage() {
  const navigate = useNavigate();
  const user = useAppSelector(state => state.auth.user);
  const [repos, setRepos] = useState<any[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRepositories();
  }, []);

  useEffect(() => {
    // Filter repositories based on search
    if (searchQuery) {
      const filtered = repos.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredRepos(filtered);
    } else {
      setFilteredRepos(repos);
    }
  }, [searchQuery, repos]);

  const fetchRepositories = async () => {
    try {
      const token = localStorage.getItem('github_token');
      
      if (!token) {
        toast.error('GitHub token not found. Please connect GitHub again.');
        navigate('/repositories');
        return;
      }

      const data = await githubService.getUserRepos(token);
      setRepos(data);
      setFilteredRepos(data);
    } catch (error) {
      toast.error('Failed to fetch repositories');
      navigate('/repositories');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (repo: any) => {
    if (!user) {
      toast.error('User not authenticated');
      return;
    }

    setConnecting(repo.id);

    try {
      const token = localStorage.getItem('github_token');
      
      if (!token) {
        toast.error('GitHub token not found');
        return;
      }

      await githubService.connectRepository(
        {
          githubRepoId: repo.id,
          name: repo.name,
          fullName: repo.fullName,
          owner: repo.owner,
          description: repo.description || '',
          isPrivate: repo.isPrivate,
          defaultBranch: repo.defaultBranch,
        },
        token,
        user.id
      );

      toast.success(`${repo.name} connected successfully!`);
      
      // Clear GitHub token
      localStorage.removeItem('github_token');
      
      navigate('/repositories');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to connect repository';
      toast.error(message);
    } finally {
      setConnecting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading your repositories...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Connect Repository</h1>
        <p className="text-muted-foreground">
          Select a repository to start reviewing code with AI
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Repository List */}
      {filteredRepos.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">
              {searchQuery ? 'No repositories found matching your search' : 'No repositories available'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredRepos.map((repo) => (
            <Card key={repo.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Github className="w-8 h-8 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-lg">{repo.name}</CardTitle>
                      <CardDescription>{repo.fullName}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={repo.isPrivate ? 'secondary' : 'outline'}>
                      {repo.isPrivate ? 'Private' : 'Public'}
                    </Badge>
                    <Button
                      onClick={() => handleConnect(repo)}
                      disabled={connecting === repo.id}
                      size="sm"
                    >
                      {connecting === repo.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Connect
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {repo.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{repo.description}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>Default branch: {repo.defaultBranch}</span>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}