import { Link } from 'react-router-dom';
import { Code2, Github, Twitter, Linkedin, Mail, Zap, Shield, FileText, HelpCircle, BookOpen, Users, Briefcase, ArrowUp, Heart, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    { name: 'GitHub', href: 'https://github.com', icon: Github, color: 'hover:text-[#333] dark:hover:text-white' },
    { name: 'Twitter', href: 'https://twitter.com', icon: Twitter, color: 'hover:text-[#1DA1F2]' },
    { name: 'LinkedIn', href: 'https://linkedin.com', icon: Linkedin, color: 'hover:text-[#0A66C2]' },
  ];

  return (
    <footer className="relative border-t bg-gradient-to-b from-background to-muted/20">
      {/* Decorative gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-blue-500/5 pointer-events-none"></div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 relative">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2 space-y-6">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:bg-primary/30 transition-all duration-300"></div>
                <Code2 className="w-8 h-8 text-primary relative z-10 group-hover:scale-110 transition-transform duration-300" />
              </div>
              <span className="font-bold text-2xl bg-gradient-to-r from-primary via-primary to-blue-600 bg-clip-text text-transparent">
                CodePro
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="w-3 h-3" />
                AI
              </span>
            </Link>
            
            <p className="text-muted-foreground max-w-sm leading-relaxed">
              AI-powered code reviews powered by Google Gemini AI. 
              Catch bugs, security issues, and improve code quality automatically with intelligent analysis.
            </p>

            {/* Newsletter Signup */}
            <div className="space-y-3">
              <p className="text-sm font-semibold">Stay updated</p>
              <div className="flex gap-2 max-w-sm">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 px-4 py-2 rounded-lg border bg-background/50 backdrop-blur-sm text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
                <Button size="sm" className="rounded-lg bg-gradient-to-r from-primary to-blue-600 hover:opacity-90 transition-all duration-200 shadow-lg hover:shadow-xl">
                  Subscribe
                </Button>
              </div>
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.name}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative p-2.5 rounded-lg bg-accent/50 hover:bg-accent transition-all duration-200 hover:scale-110 ${social.color}`}
                    aria-label={social.name}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg">
                      {social.name}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Product Links */}
          <div>
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-primary to-blue-600 rounded-full"></div>
              Product
            </h3>
            <ul className="space-y-3">
              {productLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all duration-200"
                    >
                      <Icon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Resources Links */}
          <div>
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-primary to-blue-600 rounded-full"></div>
              Resources
            </h3>
            <ul className="space-y-3">
              {resourcesLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all duration-200"
                    >
                      <Icon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Company Links */}
          <div>
            <h3 className="font-semibold text-sm mb-4 flex items-center gap-2">
              <div className="w-1 h-4 bg-gradient-to-b from-primary to-blue-600 rounded-full"></div>
              Company
            </h3>
            <ul className="space-y-3">
              {companyLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.name}>
                    <Link
                      to={link.href}
                      className="group flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-all duration-200"
                    >
                      <Icon className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      <span className="group-hover:translate-x-0.5 transition-transform duration-200">
                        {link.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>© {currentYear} CodePro. All rights reserved.</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline-flex items-center gap-1">
                Made with <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" /> by developers
              </span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-sm">
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Terms
                </Link>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Privacy
                </Link>
                <Link to="#" className="text-muted-foreground hover:text-primary transition-colors">
                  Cookies
                </Link>
              </div>
              
              <Button
                onClick={scrollToTop}
                size="icon"
                variant="outline"
                className="rounded-full hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-110 shadow-lg"
                aria-label="Scroll to top"
              >
                <ArrowUp className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}