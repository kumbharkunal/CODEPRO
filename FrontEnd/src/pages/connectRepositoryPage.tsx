import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { githubService } from '@/services/githubService';
import { useAppSelector } from '@/store/hooks';
import { Github, Search, Check, Lock, Unlock, GitBranch, Star, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ConnectRepositoryPage() {
  const navigate = useNavigate();
  const user = useAppSelector(state => state.auth.user);
  const [repos, setRepos] = useState<any[]>([]);
  const [filteredRepos, setFilteredRepos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'public' | 'private'>('all');

  useEffect(() => {
    fetchRepositories();
  }, []);

  useEffect(() => {
    let filtered = repos;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(repo =>
        repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        repo.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply visibility filter
    if (filter !== 'all') {
      filtered = filtered.filter(repo => 
        filter === 'private' ? repo.isPrivate : !repo.isPrivate
      );
    }

    setFilteredRepos(filtered);
  }, [searchQuery, repos, filter]);

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
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-lg font-medium">Loading your repositories...</p>
          <p className="text-sm text-muted-foreground">This may take a moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-primary to-blue-600 text-white">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold">Connect Repository</h1>
            <p className="text-muted-foreground mt-1">
              Select a repository to start reviewing code with AI
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary border border-primary/20">
            <Github className="w-4 h-4" />
            <span className="text-sm font-medium">{repos.length} repositories found</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted">
            <Star className="w-4 h-4" />
            <span className="text-sm font-medium">AI-powered reviews enabled</span>
          </div>
        </div>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search repositories by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-12 text-base"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
            className="flex-1 sm:flex-none"
          >
            <Filter className="w-4 h-4 mr-2" />
            All
          </Button>
          <Button
            variant={filter === 'public' ? 'default' : 'outline'}
            onClick={() => setFilter('public')}
            className="flex-1 sm:flex-none"
          >
            <Unlock className="w-4 h-4 mr-2" />
            Public
          </Button>
          <Button
            variant={filter === 'private' ? 'default' : 'outline'}
            onClick={() => setFilter('private')}
            className="flex-1 sm:flex-none"
          >
            <Lock className="w-4 h-4 mr-2" />
            Private
          </Button>
        </div>
      </motion.div>

      {/* Repository List */}
      {filteredRepos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-dashed">
            <CardContent className="py-16 text-center space-y-4">
              <div className="inline-flex p-4 rounded-full bg-muted">
                <Github className="w-12 h-12 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">No repositories found</h3>
                <p className="text-muted-foreground">
                  {searchQuery || filter !== 'all'
                    ? 'Try adjusting your search or filters'
                    : 'No repositories available to connect'}
                </p>
              </div>
              {(searchQuery || filter !== 'all') && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery('');
                    setFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid gap-4">
          {filteredRepos.map((repo, index) => (
            <motion.div
              key={repo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.05 }}
            >
              <Card className="hover:shadow-xl transition-all duration-300 hover:border-primary/50 group">
                <CardHeader>
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                        <Github className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-xl truncate">{repo.name}</CardTitle>
                          <Badge 
                            variant={repo.isPrivate ? 'secondary' : 'outline'}
                            className="flex items-center gap-1"
                          >
                            {repo.isPrivate ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            {repo.isPrivate ? 'Private' : 'Public'}
                          </Badge>
                        </div>
                        <CardDescription className="truncate">{repo.fullName}</CardDescription>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleConnect(repo)}
                      disabled={connecting === repo.id}
                      size="lg"
                      className="w-full lg:w-auto bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      {connecting === repo.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Connect Repository
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                {(repo.description || repo.defaultBranch) && (
                  <CardContent className="space-y-3">
                    {repo.description && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {repo.description}
                      </p>
                    )}
                    {repo.defaultBranch && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <GitBranch className="w-4 h-4" />
                        <span>Default branch: <span className="font-medium">{repo.defaultBranch}</span></span>
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}