import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { toggleTheme } from '@/store/slices/themeSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { Code2, Moon, Sun, LogOut, User, Settings, LayoutDashboard, GitPullRequest, FolderGit2, CreditCard, Menu, X, Sparkles, Users, Crown, Code } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut, isSignedIn, isLoaded } = useAuth();
  const user = useAppSelector(state => state.auth.user);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      localStorage.removeItem('token');
      await signOut();
      dispatch(logout());
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Error during logout:', error);
      localStorage.removeItem('token');
      dispatch(logout());
      navigate('/login', { replace: true });
    }
  };

  const handleToggleTheme = () => {
    dispatch(toggleTheme());
  };

  const isActive = (path: string) => location.pathname === path;

  const isAdmin = user?.role === 'admin';

  // Show user menu if either Clerk says signed in OR Redux has user data
  // This prevents the "sign in" button from showing during sync
  const showUserMenu = (isLoaded && isSignedIn) || user;

  // Only show nav links when user data is fully loaded to prevent Team option flicker
  const navLinks = (showUserMenu && user) ? [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Reviews', path: '/reviews', icon: GitPullRequest },
    { name: 'Repositories', path: '/repositories', icon: FolderGit2 },
    ...(isAdmin ? [{ name: 'Team', path: '/team', icon: Users }] : []),
  ] : [];

  const getRoleBadge = () => {
    if (!user) return null;
    const config = user.role === 'admin'
      ? { icon: Crown, label: 'Admin', color: 'bg-purple-500' }
      : { icon: Code, label: 'Developer', color: 'bg-blue-500' };
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white text-xs px-2 py-0.5 flex items-center gap-1`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled
      ? 'bg-background/80 backdrop-blur-lg border-b shadow-sm'
      : 'bg-background/60 backdrop-blur-md border-b border-transparent'
      }`}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2 group relative"
            onClick={() => setMobileMenuOpen(false)}
          >
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all duration-300"></div>
              <Code2 className="w-7 h-7 lg:w-8 lg:h-8 text-primary relative z-10 group-hover:scale-110 transition-transform duration-300" />
            </div>
            <span className="font-bold text-xl lg:text-2xl bg-gradient-to-r from-primary via-primary to-blue-600 bg-clip-text text-transparent">
              CodePro
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
              <Sparkles className="w-3 h-3" />
              AI
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}
            <Link
              to="/pricing"
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/pricing')
                ? 'bg-primary/10 text-primary shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                }`}
            >
              <CreditCard className="w-4 h-4" />
              Pricing
            </Link>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleTheme}
              className="relative rounded-full hover:bg-accent transition-all duration-200 hover:scale-105"
            >
              <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* User Menu */}
            {showUserMenu ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="relative h-10 w-10 rounded-full hover:ring-2 hover:ring-primary/20 transition-all duration-200"
                  >
                    <Avatar className="h-10 w-10 border-2 border-primary/20">
                      <AvatarFallback className={user ? "bg-gradient-to-br from-primary to-blue-600 text-primary-foreground font-semibold" : "bg-gradient-to-br from-primary/20 to-primary/5 animate-pulse"}>
                        {user ? user.name.charAt(0).toUpperCase() : ''}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-64 p-2 rounded-xl border-border/50 bg-background/95 backdrop-blur-xl shadow-2xl"
                  sideOffset={8}
                >
                  {user ? (
                    <div className="flex flex-col items-center gap-2 p-3 mb-2 bg-gradient-to-b from-muted/50 to-muted/10 rounded-lg border border-border/50 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      <div className="relative">
                        <div className="absolute -inset-0.5 bg-gradient-to-br from-primary to-blue-600 rounded-full opacity-20 blur group-hover:opacity-40 transition-opacity duration-500" />
                        <Avatar className="h-14 w-14 ring-4 ring-background shadow-xl relative">
                          <AvatarFallback className="bg-gradient-to-br from-primary to-blue-600 text-primary-foreground font-bold text-xl">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </div>

                      <div className="flex flex-col items-center text-center min-w-0 w-full relative z-10">
                        <p className="text-sm font-bold text-foreground tracking-tight mb-0.5 w-full truncate">
                          {user.name}
                        </p>
                        <p className="text-[11px] font-medium text-muted-foreground w-full truncate mb-2">
                          {user.email}
                        </p>
                        <div className="transform hover:scale-105 transition-transform duration-200 scale-90">
                          {getRoleBadge()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-3 p-3 mb-2 bg-muted/30 rounded-lg border border-border/50">
                      <div className="w-14 h-14 rounded-full bg-muted animate-pulse ring-4 ring-background" />
                      <div className="flex flex-col items-center space-y-2 w-full">
                        <div className="h-4 bg-muted rounded w-24 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-32 animate-pulse" />
                      </div>
                    </div>
                  )}

                  <div className="space-y-0.5 px-1">
                    <DropdownMenuItem className="cursor-pointer rounded-lg py-2 px-3 text-sm font-medium transition-all duration-200 flex items-center gap-3 group hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary">
                      <User className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>Profile</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer rounded-lg py-2 px-3 text-sm font-medium transition-all duration-200 flex items-center gap-3 group hover:bg-primary/10 hover:text-primary focus:bg-primary/10 focus:text-primary">
                      <Settings className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </div>

                  <DropdownMenuSeparator className="my-1.5 bg-border/50" />

                  <div className="px-1 pb-1">
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-lg py-2 px-3 text-sm font-medium transition-all duration-200 flex items-center gap-3 group text-destructive hover:bg-destructive/10 hover:text-destructive focus:bg-destructive/10 focus:text-destructive">
                      <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login">
                <Button className="rounded-full px-6 bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105">
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile Menu Toggle */}
            {showUserMenu && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden rounded-full"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {showUserMenu && (
          <div
            className={`lg:hidden overflow-hidden transition-all duration-300 ease-in-out ${mobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'
              }`}
          >
            <div className="flex flex-col gap-1 pt-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.path);
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${active
                      ? 'bg-primary/10 text-primary'
                      : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    {link.name}
                  </Link>
                );
              })}
              <Link
                to="/pricing"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${isActive('/pricing')
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent/50'
                  }`}
              >
                <CreditCard className="w-5 h-5" />
                Pricing
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}