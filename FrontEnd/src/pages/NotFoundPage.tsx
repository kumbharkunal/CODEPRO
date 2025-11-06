import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ArrowLeft, Search, Code2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-10 w-96 h-96 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-40 right-10 w-96 h-96 bg-purple-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-20 left-1/2 w-96 h-96 bg-blue-300/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8 max-w-2xl"
      >
        {/* 404 Number with glitch effect */}
        <motion.div
          className="relative"
          animate={{
            textShadow: [
              '0 0 0 transparent',
              '2px 2px 8px rgba(59, 130, 246, 0.5)',
              '0 0 0 transparent',
            ],
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <h1 className="text-[12rem] md:text-[16rem] font-bold leading-none bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
            404
          </h1>
          
          {/* Floating code symbols */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 5, 0],
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-10 -left-10 text-6xl opacity-20"
          >
            &lt;/&gt;
          </motion.div>
          <motion.div
            animate={{
              y: [0, 10, 0],
              rotate: [0, -5, 0],
            }}
            transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
            className="absolute top-20 -right-10 text-6xl opacity-20"
          >
            { }
          </motion.div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-destructive/10 text-destructive border border-destructive/20">
            <Search className="w-4 h-4" />
            <span className="text-sm font-medium">Page Not Found</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold">
            Oops! This page got lost in code
          </h2>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or may have been moved to a different URL.
          </p>
        </motion.div>

        {/* Suggestions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-4"
        >
          <p className="text-sm text-muted-foreground">Here's what you can do:</p>
          <div className="grid sm:grid-cols-2 gap-3">
            <Link to="/" className="block">
              <div className="p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Home className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Go Home</div>
                    <div className="text-sm text-muted-foreground">Back to homepage</div>
                  </div>
                </div>
              </div>
            </Link>
            <Link to="/dashboard" className="block">
              <div className="p-4 rounded-lg border bg-card hover:bg-accent hover:border-primary/50 transition-all duration-300 group cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                    <Code2 className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold">Dashboard</div>
                    <div className="text-sm text-muted-foreground">View your reviews</div>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
        >
          <Link to="/">
            <Button size="lg" className="rounded-full px-8 bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300 group">
              <Home className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
              Go to Homepage
            </Button>
          </Link>
          <Button 
            size="lg" 
            variant="outline" 
            onClick={() => window.history.back()}
            className="rounded-full px-8 group"
          >
            <ArrowLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Go Back
          </Button>
        </motion.div>

        {/* Error code */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="pt-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 backdrop-blur-sm text-xs text-muted-foreground">
            <span>Error Code: HTTP 404</span>
            <span>•</span>
            <span>Resource Not Found</span>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}