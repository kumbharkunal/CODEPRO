import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Code2, Zap, Shield, Github, ArrowRight, CheckCircle, Sparkles, TrendingUp, Lock, Rocket } from 'lucide-react';
import { motion } from 'framer-motion';

export default function HomePage() {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Animated background gradients */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-purple-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-300/30 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Hero Section */}
      <motion.section
        className="container mx-auto px-4 py-20 lg:py-32 text-center relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 border border-primary/20 backdrop-blur-sm"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: 'spring' }}
          >
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              Powered by Google Gemini AI
            </span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </motion.div>

          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
              <span className="bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                Code Reviews
              </span>
              <br />
              <span className="text-foreground">Powered by AI</span>
            </h1>
            <div className="flex items-center justify-center gap-2 text-lg md:text-xl text-muted-foreground">
              <Code2 className="w-5 h-5 text-primary" />
              <span>Intelligent • Automated • Instant</span>
            </div>
          </motion.div>

          {/* Description */}
          <motion.p
            className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Catch bugs, security vulnerabilities, and code quality issues before they reach production.
            <span className="block mt-2 font-semibold text-foreground">
              Let AI be your code review partner.
            </span>
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link to="/login">
              <Button size="lg" className="text-lg px-8 py-6 rounded-full bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-2xl hover:shadow-primary/50 transition-all duration-300 group">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/pricing">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-full border-2 hover:bg-accent/50 backdrop-blur-sm group">
                View Pricing
                <TrendingUp className="w-5 h-5 ml-2 group-hover:translate-y-[-2px] transition-transform" />
              </Button>
            </Link>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-6 pt-8 text-sm text-muted-foreground"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>Cancel anytime</span>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
            <Zap className="w-4 h-4" />
            <span className="text-sm font-medium">Features</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            Everything you need for
            <span className="block bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              perfect code reviews
            </span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Advanced AI technology meets developer-friendly tools
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          <FeatureCard
            icon={<Sparkles className="w-12 h-12" />}
            title="AI-Powered Analysis"
            description="Gemini Pro 2.0 analyzes your code for bugs, security vulnerabilities, and performance issues with unprecedented accuracy."
            gradient="from-primary to-blue-600"
            delay={0.1}
          />
          <FeatureCard
            icon={<Github className="w-12 h-12" />}
            title="GitHub Integration"
            description="Seamless integration with GitHub. Get automatic reviews on pull requests with instant feedback as soon as you push code."
            gradient="from-purple-600 to-pink-600"
            delay={0.2}
          />
          <FeatureCard
            icon={<Lock className="w-12 h-12" />}
            title="Security First"
            description="Detect SQL injection, XSS, authentication flaws, and 50+ other security vulnerabilities before they become problems."
            gradient="from-orange-500 to-red-600"
            delay={0.3}
          />
          <FeatureCard
            icon={<Zap className="w-12 h-12" />}
            title="Lightning Fast"
            description="Get comprehensive code reviews in seconds, not hours. Our AI processes thousands of lines of code instantly."
            gradient="from-yellow-500 to-orange-600"
            delay={0.4}
          />
          <FeatureCard
            icon={<CheckCircle className="w-12 h-12" />}
            title="Best Practices"
            description="Enforce coding standards and best practices automatically. Keep your codebase clean and maintainable."
            gradient="from-green-500 to-teal-600"
            delay={0.5}
          />
          <FeatureCard
            icon={<Rocket className="w-12 h-12" />}
            title="Continuous Learning"
            description="Our AI improves over time, learning from millions of code reviews to provide better insights every day."
            gradient="from-blue-600 to-cyan-600"
            delay={0.6}
          />
        </div>
      </section>

      {/* Stats Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-purple-500/10 to-blue-500/10 rounded-3xl blur-3xl"></div>
          <div className="relative bg-card/50 backdrop-blur-xl border rounded-3xl p-8 md:p-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Trusted by developers worldwide
              </h2>
              <p className="text-muted-foreground text-lg">
                Join thousands of teams improving their code quality
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <StatCard number="10,000+" label="Reviews Completed" icon={<CheckCircle className="w-6 h-6" />} />
              <StatCard number="50,000+" label="Issues Found" icon={<Shield className="w-6 h-6" />} />
              <StatCard number="99.9%" label="Accuracy Rate" icon={<TrendingUp className="w-6 h-6" />} />
            </div>
          </div>
        </motion.div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20 lg:py-32">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary via-purple-600 to-blue-600 rounded-3xl blur-2xl opacity-20"></div>
          <div className="relative bg-gradient-to-r from-primary to-blue-600 rounded-3xl p-12 md:p-16 text-center text-white">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Ready to improve your code quality?
            </h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Start your free trial today. No credit card required.
            </p>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="text-lg px-8 py-6 rounded-full shadow-2xl hover:scale-105 transition-transform">
                Get Started Free
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, gradient, delay }: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  gradient: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay }}
      className="group relative"
    >
      <div className="absolute inset-0 bg-gradient-to-r opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl blur-xl"></div>
      <div className="relative h-full p-8 rounded-2xl border bg-card hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
        <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${gradient} text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
          {icon}
        </div>
        <h3 className="text-xl font-bold mb-3">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
    </motion.div>
  );
}

function StatCard({ number, label, icon }: { number: string; label: string; icon: React.ReactNode }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      className="text-center p-6 rounded-xl bg-background/50 backdrop-blur-sm border hover:border-primary/50 transition-all duration-300"
    >
      <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-4">
        {icon}
      </div>
      <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent mb-2">
        {number}
      </div>
      <div className="text-muted-foreground font-medium">{label}</div>
    </motion.div>
  );
}