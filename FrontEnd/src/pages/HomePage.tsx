import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Code2, Zap, Shield, Github } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <motion.section
        className="container mx-auto px-4 py-20 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">AI-Powered Code Reviews</span>
          </motion.div>

          <motion.h1
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            CodePro
          </motion.h1>

          <motion.p
            className="text-xl md:text-2xl text-muted-foreground mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Intelligent code reviews powered by Google Gemini AI.
            <br />
            Catch bugs, security issues, and improve code quality automatically.
          </motion.p>

          <motion.div
            className="flex gap-4 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/login">
              <Button size="lg" className="text-lg">
                Get Started
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button size="lg" variant="outline" className="text-lg">
                View Demo
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Code2 className="w-12 h-12 text-primary" />}
            title="AI-Powered Analysis"
            description="Gemini Pro 2.0 analyzes your code for bugs, security vulnerabilities, and performance issues."
          />
          <FeatureCard
            icon={<Github className="w-12 h-12 text-primary" />}
            title="GitHub Integration"
            description="Automatic reviews on pull requests. Get instant feedback as soon as you open a PR."
          />
          <FeatureCard
            icon={<Shield className="w-12 h-12 text-primary" />}
            title="Security First"
            description="Detect SQL injection, XSS, authentication flaws, and other security vulnerabilities."
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <StatCard number="1000+" label="Reviews Completed" />
          <StatCard number="5000+" label="Issues Found" />
          <StatCard number="95%" label="Accuracy Rate" />
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <div className="p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
      <div className="mb-4">{icon}</div>
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="p-6">
      <div className="text-4xl font-bold text-primary mb-2">{number}</div>
      <div className="text-muted-foreground">{label}</div>
    </div>
  );
}