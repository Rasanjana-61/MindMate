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
    return (
      <div className="flex flex-col min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
          <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
            <button
              onClick={onNavigateToHome}
              className="flex items-center gap-2 hover:opacity-80 transition"
            >
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: '#7BAE7F' }}>
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
                className="text-sm font-medium text-slate-600 transition"
                style={{ color: '#5F705F' }}
                onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                onMouseLeave={(e) => e.target.style.color = '#5F705F'}
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
                className="text-sm font-medium text-slate-600 transition"
                style={{ color: '#5F705F' }}
                onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                onMouseLeave={(e) => e.target.style.color = '#5F705F'}
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
                className="text-sm font-medium text-slate-600 transition"
                style={{ color: '#5F705F' }}
                onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                onMouseLeave={(e) => e.target.style.color = '#5F705F'}
              >
                Benefits
              </a>
            </nav>

            <div className="flex items-center gap-3">
              <button
                onClick={onNavigateToHome}
                className="px-4 py-2 text-sm font-medium text-slate-700 transition" style={{ color: '#5F705F' }}
                onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                onMouseLeave={(e) => e.target.style.color = '#5F705F'}
              >
                Sign In
              </button>
              <button
                onClick={onNavigateToRegister}
                className="px-5 py-2 text-sm font-semibold text-white rounded-lg transition" style={{ backgroundColor: '#7BAE7F' }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#4F7D5C'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#7BAE7F'}
              >
                Sign Up
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 items-center justify-center px-6 py-12">
          <motion.div 
            className="w-full max-w-md"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                Welcome <span style={{ color: '#7BAE7F' }}>Back</span>
              </h1>
              <p className="text-slate-600">
                Sign in to your account to continue
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
              <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                    {error}
                  </div>
                )}

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@university.edu"
                      className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-lg outline-none transition-all text-slate-900" style={{ '--tw-ring-color': '#7BAE7F' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#7BAE7F';
                        e.target.style.boxShadow = '0 0 0 2px rgba(123, 174, 127, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-slate-900">
                      Password
                    </label>
                    <a href="#" className="text-sm font-medium" style={{ color: '#7BAE7F' }}
                      onMouseEnter={(e) => e.target.style.color = '#4F7D5C'}
                      onMouseLeave={(e) => e.target.style.color = '#7BAE7F'}>
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-3 border border-slate-200 rounded-lg outline-none transition-all text-slate-900" style={{ '--tw-ring-color': '#7BAE7F' }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#7BAE7F';
                        e.target.style.boxShadow = '0 0 0 2px rgba(123, 174, 127, 0.1)';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e2e8f0';
                        e.target.style.boxShadow = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full text-white font-semibold py-3 rounded-lg transition-all inline-flex items-center justify-center gap-2"
                  style={{ 
                    backgroundColor: isLoading ? '#B8D0B8' : '#7BAE7F'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading) {
                      e.target.style.backgroundColor = '#4F7D5C';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading) {
                      e.target.style.backgroundColor = '#7BAE7F';
                    }
                  }}
                >
                  Sign in
                  <ArrowRight size={18} />
                </button>
              </form>

              {/* Chat with Bot */}
              <button
                type="button"
                onClick={() => setShowChatbot(true)}
                className="w-full text-white font-medium py-3 rounded-lg transition-all inline-flex items-center justify-center gap-2 mt-6"
                style={{ background: 'linear-gradient(to right, #7BAE7F, #4F7D5C)' }}
                onMouseEnter={(e) => e.target.style.background = 'linear-gradient(to right, #4F7D5C, #3D5F48)'}
                onMouseLeave={(e) => e.target.style.background = 'linear-gradient(to right, #7BAE7F, #4F7D5C)'}
              >
                <MessageCircle size={18} />
                Chat with our bot first
              </button>

              {/* Sign Up Link */}
              <p className="text-center text-sm text-slate-600 mt-6">
                Don't have an account?{' '}
                <button 
                  onClick={onNavigateToRegister}
                  className="font-semibold" style={{ color: '#7BAE7F' }}
                  onMouseEnter={(e) => e.target.style.color = '#4F7D5C'}
                  onMouseLeave={(e) => e.target.style.color = '#7BAE7F'}
                >
                  Sign up
                </button>
              </p>
            </motion.div>

            {/* Back to Home */}
            <div className="text-center mt-6">
              <button
                onClick={onNavigateToHome}
                className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                ← Back to Home
              </button>
            </div>
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

        {/* Footer */}
        <Footer />
      </div>
    );
}
