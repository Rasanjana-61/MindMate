import { useState } from 'react';
import { ArrowRight, Leaf, Sparkles, Clock, Users, BookOpen, Smile, Timer, MessageCircle, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import logo from '../assets/logo.svg';

export function HomePage({ onNavigateToLogin, onNavigateToRegister }) {
  const [activeTab, setActiveTab] = useState('wellness');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  const useCases = [
    { id: 'wellness', label: 'Mental Wellness', icon: Smile },
    { id: 'focus', label: 'Focus & Productivity', icon: Timer },
    { id: 'community', label: 'Peer Support', icon: Users },
    { id: 'resources', label: 'Learning', icon: BookOpen },
  ];

  const features = {
    wellness: {
      title: 'Track Your Mental Wellness',
      description: 'Daily mood tracking and mental health insights tailored for students. Understand your emotional patterns and take control of your wellbeing.',
      benefits: ['Daily mood tracking', 'Emotion pattern analysis', 'Personalized insights'],
    },
    focus: {
      title: 'Stay Focused & Productive',
      description: 'Pomodoro timer, task management, and focus sessions designed to help you manage your academic workload effectively.',
      benefits: ['Pomodoro timer', 'Task management', 'Focus analytics'],
    },
    community: {
      title: 'Connect with Peers',
      description: 'Safe, anonymous peer support community where students help students. Share experiences and find support among your peers.',
      benefits: ['Anonymous support', 'Peer advice', 'Community posts'],
    },
    resources: {
      title: 'AI-Powered Learning',
      description: 'Access curated mental health resources, academic support materials, and wellness guides powered by AI recommendations.',
      benefits: ['Curated resources', 'AI suggestions', 'Expert content'],
    },
  };

  const stats = [
    { number: '10K+', label: 'Active Students' },
    { number: '50K+', label: 'Mood Entries' },
    { number: '100+', label: 'Resources' },
  ];

  const benefits = [
    {
      icon: Sparkles,
      title: 'Smart Tracking',
      description: 'AI-powered mood and focus tracking with actionable insights',
    },
    {
      icon: Clock,
      title: 'Time Management',
      description: 'Built-in Pomodoro timer and productivity tools for academics',
    },
    {
      icon: Users,
      title: 'Community Support',
      description: 'Connect anonymously with peers who understand your journey',
    },
    {
      icon: Leaf,
      title: 'Holistic Wellness',
      description: 'Comprehensive mental health platform designed for students',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-wellness-bg to-white overflow-hidden">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-wellness-border/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center gap-2 text-wellness-blue font-bold text-xl">
              <img src={logo} alt="MindMate" className="w-10 h-10" />
              <span>MindMate</span>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-wellness-text-sec hover:text-wellness-text transition-colors text-sm font-medium">
                Features
              </a>
              <a href="#benefits" className="text-wellness-text-sec hover:text-wellness-text transition-colors text-sm font-medium">
                About
              </a>
              <a href="#" className="text-wellness-text-sec hover:text-wellness-text transition-colors text-sm font-medium">
                Pricing
              </a>
            </div>

            {/* Right Section */}
            <div className="flex items-center gap-3">
              <button
                onClick={onNavigateToLogin}
                className="hidden md:block text-wellness-text hover:text-wellness-blue font-medium text-sm transition-colors"
              >
                Log In
              </button>
              <button
                onClick={onNavigateToRegister}
                className="px-6 py-2 bg-wellness-blue text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-all shadow-sm hover:shadow-md"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
            >
              <ChevronDown className={`w-5 h-5 transition-transform ${mobileMenuOpen ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-wellness-border bg-white">
            <div className="px-4 py-3 space-y-2">
              <a href="#features" className="block text-wellness-text-sec hover:text-wellness-text py-2">
                Features
              </a>
              <a href="#benefits" className="block text-wellness-text-sec hover:text-wellness-text py-2">
                About
              </a>
              <button
                onClick={onNavigateToLogin}
                className="w-full text-left text-wellness-text hover:text-wellness-blue py-2"
              >
                Log In
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <motion.section
        className="relative pt-20 pb-16 md:pb-24 px-4 sm:px-6 lg:px-8"
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div variants={itemVariants} className="max-w-lg">
              <div className="inline-flex items-center gap-2 bg-wellness-blue/10 px-4 py-2 rounded-full mb-6 border border-wellness-blue/20">
                <img src={logo} alt="MindMate" className="w-5 h-5" />
                <span className="text-wellness-blue font-semibold text-sm">For Students, By Wellness Experts</span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-wellness-text leading-tight mb-6">
                Your Wellness{' '}
                <span className="bg-gradient-to-r from-wellness-blue to-blue-600 bg-clip-text text-transparent">
                  Companion
                </span>
              </h1>

              <p className="text-lg text-wellness-text-sec mb-8 leading-relaxed">
                Balance your academic life with mental wellbeing. Track moods, manage focus, find peer support, and access personalized resources—all in one platform designed for students like you.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <button
                  onClick={onNavigateToRegister}
                  className="px-8 py-4 bg-gradient-to-r from-wellness-blue to-blue-600 text-white rounded-xl font-semibold hover:shadow-lg hover:shadow-wellness-blue/30 transition-all flex items-center justify-center gap-2"
                >
                  Start Creating Free <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={onNavigateToLogin}
                  className="px-8 py-4 bg-white border-2 border-wellness-border text-wellness-blue rounded-xl font-semibold hover:bg-wellness-bg transition-all"
                >
                  Explore Demo
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 pt-8 border-t border-wellness-border/50">
                {stats.map((stat, idx) => (
                  <div key={idx}>
                    <div className="text-2xl font-bold text-wellness-blue">{stat.number}</div>
                    <p className="text-sm text-wellness-text-muted">{stat.label}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right Content - Featured Image */}
            <motion.div
              variants={itemVariants}
              className="relative h-96 md:h-full rounded-2xl overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-wellness-blue-light via-blue-50 to-purple-50 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full bg-white/80 flex items-center justify-center shadow-lg">
                    <img src={logo} alt="MindMate" className="w-20 h-20" />
                  </div>
                  <p className="text-wellness-text-sec font-medium">Student Wellness Platform</p>
                </div>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent"></div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Use Cases / Features Section */}
      <motion.section
        id="features"
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-wellness-text mb-4">
              Everything you need for student wellness
            </h2>
            <p className="text-lg text-wellness-text-sec max-w-2xl mx-auto">
              Designed specifically for the unique challenges students face in balancing academics and mental health
            </p>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-12">
            {useCases.map((useCase) => {
              const Icon = useCase.icon;
              return (
                <button
                  key={useCase.id}
                  onClick={() => setActiveTab(useCase.id)}
                  className={`px-6 py-3 rounded-full font-medium transition-all flex items-center gap-2 ${
                    activeTab === useCase.id
                      ? 'bg-wellness-blue text-white shadow-lg'
                      : 'bg-gray-100 text-wellness-text hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {useCase.label}
                </button>
              );
            })}
          </div>

          {/* Feature Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="grid md:grid-cols-2 gap-12 items-center"
          >
            <div>
              <h3 className="text-3xl md:text-4xl font-bold text-wellness-text mb-6">
                {features[activeTab].title}
              </h3>
              <p className="text-lg text-wellness-text-sec mb-8 leading-relaxed">
                {features[activeTab].description}
              </p>
              <ul className="space-y-3">
                {features[activeTab].benefits.map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-wellness-blue/20 flex items-center justify-center">
                      <span className="text-wellness-blue text-sm font-bold">✓</span>
                    </div>
                    <span className="text-wellness-text font-medium">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="h-96 rounded-2xl bg-gradient-to-br from-wellness-blue-light to-purple-50 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {activeTab === 'wellness'
                    ? '😌'
                    : activeTab === 'focus'
                      ? '⏱️'
                      : activeTab === 'community'
                        ? '🤝'
                        : '📚'}
                </div>
                <p className="text-wellness-text-sec font-medium">{features[activeTab].title}</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.section>

      {/* Benefits Grid Section */}
      <motion.section
        id="benefits"
        className="py-20 px-4 sm:px-6 lg:px-8"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-wellness-text mb-4">
              Why students choose MindMate
            </h2>
            <p className="text-lg text-wellness-text-sec max-w-2xl mx-auto">
              Built by understanding real student challenges
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {benefits.map((benefit, idx) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  className="p-8 rounded-2xl bg-white border border-wellness-border hover:border-wellness-blue/30 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 rounded-lg bg-wellness-blue/10 flex items-center justify-center group-hover:bg-wellness-blue/20 transition-colors mb-4">
                    <Icon className="w-6 h-6 text-wellness-blue" />
                  </div>
                  <h3 className="text-xl font-bold text-wellness-text mb-3">{benefit.title}</h3>
                  <p className="text-wellness-text-sec leading-relaxed">{benefit.description}</p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-wellness-blue to-blue-600 text-white"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to transform your student wellness journey?
          </h2>
          <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of students already using MindMate to balance academics and mental health.
          </p>
          <button
            onClick={onNavigateToRegister}
            className="px-10 py-4 bg-white text-wellness-blue rounded-xl font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 mx-auto"
          >
            Get Started Free <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-white border-t border-wellness-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 text-wellness-blue font-bold text-lg mb-4">
                <img src={logo} alt="MindMate" className="w-6 h-6" />
                MindMate
              </div>
              <p className="text-sm text-wellness-text-sec">Student wellness platform for better balance.</p>
            </div>
            <div>
              <h4 className="font-semibold text-wellness-text mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-wellness-text-sec">
                <li><a href="#" className="hover:text-wellness-blue transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-wellness-blue transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-wellness-blue transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-wellness-text mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-wellness-text-sec">
                <li><a href="#" className="hover:text-wellness-blue transition-colors">About</a></li>
                <li><a href="#" className="hover:text-wellness-blue transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-wellness-blue transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-wellness-text mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-wellness-text-sec">
                <li><a href="#" className="hover:text-wellness-blue transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-wellness-blue transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-wellness-border pt-8 text-center text-sm text-wellness-text-muted">
            <p>&copy; 2026 MindMate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
