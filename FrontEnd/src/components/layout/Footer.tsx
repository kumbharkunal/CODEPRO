import { Link } from 'react-router-dom';
import { Code2, Github, Twitter, Linkedin, Mail, Zap, Shield, FileText, HelpCircle, BookOpen, Users, Briefcase, ArrowUp, Heart, Sparkles, Send, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { motion } from 'framer-motion';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    // Add your newsletter subscription logic here
    console.log('Subscribing:', email);
    setEmail('');
  };

  const productLinks = [
    { name: 'Features', href: '/#features', icon: Zap },
    { name: 'Pricing', href: '/pricing', icon: Briefcase },
    { name: 'Documentation', href: '#', icon: BookOpen },
    { name: 'Security', href: '#', icon: Shield },
  ];

  const resourcesLinks = [
    { name: 'Documentation', href: '#', icon: FileText },
    { name: 'Help Center', href: '#', icon: HelpCircle },
    { name: 'Blog', href: '#', icon: BookOpen },
    { name: 'API Reference', href: '#', icon: Code2 },
  ];

  const companyLinks = [
    { name: 'About Us', href: '#', icon: Users },
    { name: 'Careers', href: '#', icon: Briefcase },
    { name: 'Contact', href: '#', icon: Mail },
    { name: 'Privacy Policy', href: '#', icon: Shield },
  ];

  const socialLinks = [
    { 
      name: 'GitHub', 
      href: 'https://github.com', 
      icon: Github, 
      gradient: 'from-gray-700 to-gray-900',
      hoverColor: 'hover:shadow-gray-500/50'
    },
    { 
      name: 'Twitter', 
      href: 'https://twitter.com', 
      icon: Twitter, 
      gradient: 'from-sky-400 to-blue-500',
      hoverColor: 'hover:shadow-blue-500/50'
    },
    { 
      name: 'LinkedIn', 
      href: 'https://linkedin.com', 
      icon: Linkedin, 
      gradient: 'from-blue-600 to-blue-700',
      hoverColor: 'hover:shadow-blue-600/50'
    },
  ];

  return (
    <footer className="relative border-t bg-gradient-to-b from-background via-background to-muted/30 overflow-hidden">
      {/* Animated background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-300/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/2 w-96 h-96 bg-blue-300/5 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-blob animation-delay-4000"></div>
      </div>

      {/* Decorative top border */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-10 relative">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12 mb-12">
          {/* Brand Section - Takes 2 columns on large screens */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Logo */}
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/40 transition-all duration-300"></div>
                <div className="relative p-2 rounded-xl bg-gradient-to-br from-primary/10 to-blue-600/10 group-hover:scale-110 transition-transform duration-300">
                  <Code2 className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-2xl bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent">
                  CodePro
                </span>
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r from-primary/10 to-blue-600/10 text-primary border border-primary/20">
                  <Sparkles className="w-3 h-3" />
                  AI
                </span>
              </div>
            </Link>
            
            {/* Description */}
            <p className="text-muted-foreground max-w-sm leading-relaxed text-sm">
              Transform your code review process with AI-powered analysis. Catch bugs, security issues, and improve code quality automatically with Google Gemini AI.
            </p>

            {/* Newsletter Signup */}
            <div className="space-y-3">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary" />
                Stay in the loop
              </p>
              <form onSubmit={handleSubscribe} className="flex gap-2 max-w-sm">
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="w-full px-4 py-2.5 rounded-lg border bg-background/80 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <Button 
                  type="submit"
                  size="sm" 
                  className="px-4 rounded-lg bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 group"
                >
                  <Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Button>
              </form>
              <p className="text-xs text-muted-foreground">
                Get updates on new features and releases
              </p>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <motion.a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative p-3 rounded-xl bg-gradient-to-br ${social.gradient} text-white transition-all duration-300 hover:scale-110 shadow-lg ${social.hoverColor}`}
                    aria-label={social.name}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-popover text-popover-foreground text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl border">
                      {social.name}
                      <ExternalLink className="w-3 h-3 inline ml-1" />
                    </span>
                  </motion.a>
                );
              })}
            </div>
          </motion.div>

          {/* Product Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h3 className="font-semibold text-sm mb-5 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-primary to-blue-600 rounded-full"></div>
              Product
            </h3>
            <ul className="space-y-3">
              {productLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="group flex items-center gap-2.5 text-sm text-muted-foreground hover:text-primary transition-all duration-200"
                    >
                      <div className="p-1.5 rounded-md bg-muted group-hover:bg-primary/10 transition-colors">
                        <Icon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:text-primary transition-all" />
                      </div>
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          {/* Resources Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="font-semibold text-sm mb-5 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-purple-600 to-pink-600 rounded-full"></div>
              Resources
            </h3>
            <ul className="space-y-3">
              {resourcesLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="group flex items-center gap-2.5 text-sm text-muted-foreground hover:text-purple-600 transition-all duration-200"
                    >
                      <div className="p-1.5 rounded-md bg-muted group-hover:bg-purple-600/10 transition-colors">
                        <Icon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:text-purple-600 transition-all" />
                      </div>
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          {/* Company Links */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <h3 className="font-semibold text-sm mb-5 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-green-600 to-emerald-600 rounded-full"></div>
              Company
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="group flex items-center gap-2.5 text-sm text-muted-foreground hover:text-green-600 transition-all duration-200"
                    >
                      <div className="p-1.5 rounded-md bg-muted group-hover:bg-green-600/10 transition-colors">
                        <Icon className="w-3.5 h-3.5 opacity-60 group-hover:opacity-100 group-hover:text-green-600 transition-all" />
                      </div>
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </motion.div>

          {/* Quick Stats / Trust Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="space-y-4"
          >
            <h3 className="font-semibold text-sm mb-5 flex items-center gap-2">
              <div className="w-1 h-5 bg-gradient-to-b from-orange-600 to-red-600 rounded-full"></div>
              Trust & Safety
            </h3>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-primary/5 to-blue-600/5 border border-primary/10">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold">SOC 2 Certified</span>
                </div>
                <p className="text-xs text-muted-foreground">Enterprise-grade security</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-500/5 to-emerald-600/5 border border-green-500/10">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-green-600" />
                  <span className="text-xs font-semibold">10k+ Developers</span>
                </div>
                <p className="text-xs text-muted-foreground">Trusted worldwide</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="border-t pt-8"
        >
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="flex flex-col sm:flex-row items-center gap-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-2">
                © {currentYear} CodePro. All rights reserved.
              </span>
              <span className="hidden sm:inline text-muted-foreground/50">•</span>
              <span className="flex items-center gap-1.5">
                Crafted with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" /> by Kunal, for developers
              </span>
            </div>
            
            {/* Bottom Links & Scroll to Top */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-sm">
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  Terms
                </Link>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  Privacy
                </Link>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors font-medium">
                  Cookies
                </Link>
              </div>
              
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
                <Button
                  onClick={scrollToTop}
                  size="icon"
                  className="rounded-full bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 shadow-lg hover:shadow-xl transition-all duration-300 group"
                  aria-label="Scroll to top"
                >
                  <ArrowUp className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </motion.div>
            </div>
          </div>

        </motion.div>
      </div>
    </footer>
  );
}