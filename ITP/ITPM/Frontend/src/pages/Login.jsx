import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Leaf, Sparkles, Clock, Users } from 'lucide-react';
import { motion } from 'framer-motion';
export function Login({ onLogin, onNavigateToRegister }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
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
    return (<div className="min-h-screen flex bg-wellness-bg">
      {/* Left Branding Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-wellness-blue to-blue-600 p-12 flex-col justify-between relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-64 h-64 bg-wellness-peach/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 text-white font-bold text-2xl mb-16">
            <div className="bg-white/20 p-2.5 rounded-xl backdrop-blur-sm">
              <Leaf className="w-8 h-8 text-white"/>
            </div>
            MindMadte
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
            Your wellness journey <br />
            starts here.
          </h1>
          <p className="text-blue-100 text-lg max-w-md mb-12">
            Balance your academic life with mental wellbeing. The all-in-one
            platform designed specifically for students.
          </p>

          <div className="space-y-6">
            <div className="flex items-center gap-4 text-white">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Sparkles className="w-6 h-6 text-wellness-peach-light"/>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Track your mood daily</h3>
                <p className="text-blue-100 text-sm">
                  Understand your emotional patterns over time.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-white">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Clock className="w-6 h-6 text-wellness-green-light"/>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Stay focused</h3>
                <p className="text-blue-100 text-sm">
                  Built-in Pomodoro timer and task management.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-white">
              <div className="bg-white/10 p-3 rounded-lg backdrop-blur-sm">
                <Users className="w-6 h-6 text-wellness-lavender"/>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Connect anonymously</h3>
                <p className="text-blue-100 text-sm">
                  Safe peer support from fellow students.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-blue-200 text-sm mt-12">
          &copy; 2026 MindMadte. All rights reserved.
        </div>
      </div>

      {/* Right Login Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Mobile logo */}
        <div className="absolute top-8 left-8 lg:hidden flex items-center gap-2 text-wellness-blue font-bold text-xl">
          <Leaf className="w-6 h-6 text-wellness-green"/>
          MindMadte
        </div>

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

          <motion.p variants={itemVariants} className="text-center mt-8 text-sm text-wellness-text-sec">

            Don't have an account?{' '}
            <button onClick={onNavigateToRegister} className="text-wellness-blue font-semibold hover:text-blue-600 transition-colors">

              Sign up for free
            </button>
          </motion.p>
        </motion.div>
      </div>
    </div>);
}
