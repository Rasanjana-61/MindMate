import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import PreLoginChatbot from '../components/PreLoginChatbot';
import { Footer } from '../components/Footer';

export function Login({ onLogin, onNavigateToRegister, onNavigateToHome = () => {} }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);
    const handleLogin = (e) => {
        e.preventDefault();
        setError('');
        if (!email || !password) {
            setError('Please enter both email and password.');
            return;
        }
        setIsLoading(true);
        onLogin({ email, password })
            .catch((apiError) => {
            setError(apiError.message || 'Invalid email or password. Please try again.');
        })
            .finally(() => {
            setIsLoading(false);
        });
    };
    const containerVariants = {
        hidden: {
            opacity: 0
        },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };
    const itemVariants = {
        hidden: {
            opacity: 0,
            y: 20
        },
        visible: {
            opacity: 1,
            y: 0
        }
    };
    return (<div className="flex flex-col min-h-screen bg-wellness-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-slate-200">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
          <button
            onClick={onNavigateToHome}
            className="flex items-center gap-2 hover:opacity-80 transition"
          >
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-lg">
              M
            </div>
            <span className="text-xl font-bold text-slate-900">MindMate</span>
          </button>

          <nav className="hidden md:flex items-center gap-8">
            <a 
              href="#features" 
              onClick={(e) => {
                e.preventDefault();
                onNavigateToHome();
                setTimeout(() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
            >
              Features
            </a>
            <a 
              href="#how-it-works" 
              onClick={(e) => {
                e.preventDefault();
                onNavigateToHome();
                setTimeout(() => {
                  document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
            >
              How It Works
            </a>
            <a 
              href="#benefits" 
              onClick={(e) => {
                e.preventDefault();
                onNavigateToHome();
                setTimeout(() => {
                  document.getElementById('benefits')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition"
            >
              Benefits
            </a>
          </nav>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-slate-600 hidden sm:inline">
              Don't have an account?
            </span>
            <button
              onClick={onNavigateToRegister}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
            >
              Sign Up
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 bg-wellness-bg">
      {/* Right Login Panel */}
      <div className="w-full flex items-center justify-center p-6 sm:p-12 relative">

        <motion.div className="w-full max-w-md" variants={containerVariants} initial="hidden" animate="visible">

          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-3xl font-bold text-wellness-text mb-2">
              Welcome back
            </h2>
            <p className="text-wellness-text-sec">
              Enter your credentials to continue your journey.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl shadow-xl shadow-wellness-blue/5 border border-wellness-border/50">

            <form onSubmit={handleLogin} className="space-y-5">
              {error &&
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                  {error}
                </div>}

              <div>
                <label className="block text-sm font-medium text-wellness-text mb-1.5">
                  University Email
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-wellness-text-muted group-focus-within:text-wellness-blue transition-colors"/>
                  </div>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="student@university.edu" className="w-full pl-11 pr-4 py-3 bg-wellness-bg/50 border border-wellness-border rounded-xl focus:bg-white focus:border-wellness-blue focus:ring-4 focus:ring-wellness-blue/10 outline-none transition-all text-sm"/>

                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-wellness-text mb-1.5">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-wellness-text-muted group-focus-within:text-wellness-blue transition-colors"/>
                  </div>
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-11 pr-12 py-3 bg-wellness-bg/50 border border-wellness-border rounded-xl focus:bg-white focus:border-wellness-blue focus:ring-4 focus:ring-wellness-blue/10 outline-none transition-all text-sm"/>

                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-wellness-text-muted hover:text-wellness-text transition-colors">

                    {showPassword ?
            <EyeOff className="h-5 w-5"/> :
            <Eye className="h-5 w-5"/>}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 rounded border-wellness-border text-wellness-blue focus:ring-wellness-blue/20 cursor-pointer"/>

                  <span className="text-sm text-wellness-text-sec group-hover:text-wellness-text transition-colors">
                    Remember me
                  </span>
                </label>
                <button type="button" className="text-sm text-wellness-blue hover:text-blue-600 font-medium transition-colors">

                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={isLoading} className="btn-primary w-full py-3.5 mt-4 flex justify-center items-center gap-2 text-base shadow-lg shadow-wellness-blue/20 disabled:opacity-70 disabled:cursor-not-allowed">

                {isLoading ?
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> :
            <>
                    Sign In <ArrowRight className="w-4 h-4"/>
                  </>}
              </button>
            </form>
          </motion.div>

          <motion.div variants={itemVariants} className="mt-8 space-y-4">
            <button
              onClick={() => setShowChatbot(true)}
              className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium hover:from-purple-700 hover:to-purple-800 transition-all inline-flex items-center justify-center gap-2 text-sm"
            >
              <MessageCircle size={18} />
              Chat with our bot first
            </button>

            <p className="text-center text-sm text-wellness-text-sec">
              Don't have an account?{' '}
              <button onClick={onNavigateToRegister} className="text-wellness-blue font-semibold hover:text-blue-600 transition-colors">
                Sign up for free
              </button>
            </p>
          </motion.div>
        </motion.div>
      </div>

        <PreLoginChatbot
          isOpen={showChatbot}
          onClose={() => setShowChatbot(false)}
          onComplete={(chatbotData) => {
            setShowChatbot(false);
            onNavigateToRegister(chatbotData);
          }}
        />
      </div>

      {/* Footer */}
      <Footer />
    </div>);
}
