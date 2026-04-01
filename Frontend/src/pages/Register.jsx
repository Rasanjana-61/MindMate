import { useEffect, useState } from 'react';
import { Mail, Lock, Eye, EyeOff, User, BookOpen, Calendar, GraduationCap, ShieldCheck, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Chatbot from '../components/Chatbot';
import { getChatbotData, clearChatbotData } from '../lib/preLoginChatbot';
import { Footer } from '../components/Footer';

export function Register({ onRegister, onNavigateToLogin, chatbotData = null, onNavigateToHome = () => {} }) {
    const [formData, setFormData] = useState({
        studentId: '',
        universityMail: '',
        fullName: '',
        bio: '',
        password: '',
        confirmPassword: '',
        faculty: '',
        year: '',
        semester: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [passwordStrength, setPasswordStrength] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [submitError, setSubmitError] = useState('');
    const [agreed, setAgreed] = useState(false);
    const [showChatbot, setShowChatbot] = useState(false);

    // Pre-fill form with chatbot data if available
    useEffect(() => {
        // Check for chatbot data from props first
        if (chatbotData && Object.keys(chatbotData).length > 0) {
            console.log('Pre-filling with chatbot data:', chatbotData);
            setFormData((prev) => ({
                ...prev,
                studentId: chatbotData.studentId || prev.studentId || '',
                universityMail: chatbotData.universityMail || prev.universityMail || '',
                fullName: chatbotData.fullName || prev.fullName || '',
                bio: chatbotData.bio || prev.bio || '',
                faculty: chatbotData.faculty || prev.faculty || '',
                year: chatbotData.year || prev.year || '',
                semester: chatbotData.semester || prev.semester || '',
            }));
        } else {
            // Fallback to localStorage if no props
            const storedData = getChatbotData();
            if (storedData && Object.keys(storedData).length > 0) {
                console.log('Pre-filling with localStorage data:', storedData);
                setFormData((prev) => ({
                    ...prev,
                    studentId: storedData.studentId || prev.studentId || '',
                    universityMail: storedData.universityMail || prev.universityMail || '',
                    fullName: storedData.fullName || prev.fullName || '',
                    bio: storedData.bio || prev.bio || '',
                    faculty: storedData.faculty || prev.faculty || '',
                    year: storedData.year || prev.year || '',
                    semester: storedData.semester || prev.semester || '',
                }));
                // Clear localStorage after using the data only once
                setTimeout(() => {
                    clearChatbotData();
                }, 100);
            }
        }
    }, [chatbotData]);

    useEffect(() => {
        const pwd = formData.password;
        if (!pwd) {
            setPasswordStrength('');
        }
        else if (pwd.length < 6) {
            setPasswordStrength('Weak');
        }
        else if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) {
            setPasswordStrength('Strong');
        }
        else {
            setPasswordStrength('Medium');
        }
    }, [formData.password]);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: ''
            }));
        }
        if (submitError) {
            setSubmitError('');
        }
    };

    const validateForm = () => {
    const newErrors = {};
    
    if (!formData.studentId)
        newErrors.studentId = 'Required';
    else if (formData.studentId.length !== 10)
        newErrors.studentId = 'Student ID must be exactly 10 characters';
    
    if (!formData.universityMail)
        newErrors.universityMail = 'Required';
    else if (!formData.universityMail.includes('@'))
        newErrors.universityMail = 'Invalid university email';

      //Cross-validate: StudentID must match first 10 chars of university email (before @)
    if (formData.studentId && formData.universityMail && formData.universityMail.includes('@')) {
        const emailPrefix = formData.universityMail.split('@')[0]; // get part before @
        if (formData.studentId !== emailPrefix.substring(0, 10)) {
            newErrors.studentId = 'Student ID must match the first 10 characters of your university email';
        }
    }
    
    if (!formData.password)
        newErrors.password = 'Required';
    else if (formData.password.length < 6)
        newErrors.password = 'Min 6 chars';
    
    if (!formData.confirmPassword)
        newErrors.confirmPassword = 'Required';
    else if (formData.password !== formData.confirmPassword)
        newErrors.confirmPassword = 'Passwords mismatch';
    
    if (!formData.faculty)
        newErrors.faculty = 'Required';
    if (!formData.year)
        newErrors.year = 'Required';
    if (!formData.semester)
        newErrors.semester = 'Required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && agreed;
};

    const handleRegister = (e) => {
        e.preventDefault();
        if (validateForm()) {
            setIsLoading(true);
            setSubmitError('');
            // Add email field using universityMail and include fullName and bio
            const registrationData = {
                ...formData,
                email: formData.universityMail
            };
            console.log('📤 Sending registration data:', registrationData);
            onRegister(registrationData)
                .then(() => {
                    // Show chatbot after successful registration
                    setShowChatbot(true);
                })
                .catch((apiError) => {
                setSubmitError(apiError.message || 'Registration failed.');
                if (apiError.errors) {
                    setErrors((prev) => ({
                        ...prev,
                        ...apiError.errors
                    }));
                }
            })
                .finally(() => {
                setIsLoading(false);
            });
        }
    };
    const getStrengthColor = () => {
        switch (passwordStrength) {
            case 'Weak':
                return 'text-red-500 bg-red-50';
            case 'Medium':
                return 'text-yellow-600 bg-yellow-50';
            case 'Strong':
                return 'text-wellness-green bg-wellness-green-light/50';
            default:
                return 'bg-transparent';
        }
    };
    const getStrengthWidth = () => {
        switch (passwordStrength) {
            case 'Weak':
                return 'w-1/3 bg-red-500';
            case 'Medium':
                return 'w-2/3 bg-yellow-500';
            case 'Strong':
                return 'w-full bg-wellness-green';
            default:
                return 'w-0';
        }
    };

    // Show chatbot if registration successful
    if (showChatbot) {
        return (
            <Chatbot 
                isOpen={true} 
                onClose={() => setShowChatbot(false)}
                onComplete={() => onNavigateToLogin()}
            />
        );
    }

    const isFormValid = formData.studentId &&
        formData.universityMail &&
        formData.password &&
        formData.confirmPassword === formData.password &&
        formData.faculty &&
        formData.year &&
        formData.semester &&
        agreed;
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
              Already have an account?
            </span>
            <button
              onClick={onNavigateToLogin}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 bg-wellness-bg">
      {/* Right Register Panel */}
      <div className="w-full flex items-center justify-center p-6 sm:p-12 min-h-screen relative">

        <motion.div className="w-full max-w-2xl mt-12 lg:mt-0" variants={containerVariants} initial="hidden" animate="visible">

          <motion.div variants={itemVariants} className="mb-8">
            <h2 className="text-3xl font-bold text-wellness-text mb-2">
              Create your account
            </h2>
            <p className="text-wellness-text-sec">
              Fill in your details to get started.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-white p-8 rounded-3xl shadow-xl shadow-wellness-blue/5 border border-wellness-border/50">

            <form onSubmit={handleRegister} className="space-y-6">
              {submitError &&
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm border border-red-100 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                  {submitError}
                </div>}
              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-wellness-text mb-1.5">
                    Student ID
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-wellness-text-muted group-focus-within:text-wellness-blue transition-colors"/>
                    </div>
                    <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} placeholder="e.g. STU2024" className={`w-full pl-11 pr-4 py-3 bg-wellness-bg/50 border ${errors.studentId ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-wellness-border focus:border-wellness-blue focus:ring-wellness-blue/10'} rounded-xl focus:bg-white focus:ring-4 outline-none transition-all text-sm`}/>

                  </div>
                  {errors.studentId &&
            <p className="text-xs text-red-500 mt-1.5 ml-1">
                      {errors.studentId}
                    </p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-wellness-text mb-1.5">
                    University Email
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-wellness-text-muted group-focus-within:text-wellness-blue transition-colors"/>
                    </div>
                    <input type="email" name="universityMail" value={formData.universityMail} onChange={handleChange} placeholder="student@university.edu" className={`w-full pl-11 pr-4 py-3 bg-wellness-bg/50 border ${errors.universityMail ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-wellness-border focus:border-wellness-blue focus:ring-wellness-blue/10'} rounded-xl focus:bg-white focus:ring-4 outline-none transition-all text-sm`}/>

                  </div>
                  {errors.universityMail &&
            <p className="text-xs text-red-500 mt-1.5 ml-1">
                      {errors.universityMail}
                    </p>}
                </div>
              </div>

              {/* Password Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-wellness-text mb-1.5">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-wellness-text-muted group-focus-within:text-wellness-blue transition-colors"/>
                    </div>
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className={`w-full pl-11 pr-12 py-3 bg-wellness-bg/50 border ${errors.password ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-wellness-border focus:border-wellness-blue focus:ring-wellness-blue/10'} rounded-xl focus:bg-white focus:ring-4 outline-none transition-all text-sm`}/>

                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-wellness-text-muted hover:text-wellness-text">

                      {showPassword ?
            <EyeOff className="h-5 w-5"/> :
            <Eye className="h-5 w-5"/>}
                    </button>
                  </div>

                  {/* Password Strength */}
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[10px] text-wellness-text-muted font-medium uppercase tracking-wider">
                        Strength
                      </span>
                      {passwordStrength &&
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${getStrengthColor()}`}>

                          {passwordStrength}
                        </span>}
                    </div>
                    <div className="h-1.5 w-full bg-wellness-bg rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-500 ease-out ${getStrengthWidth()}`}/>

                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-wellness-text mb-1.5">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-wellness-text-muted group-focus-within:text-wellness-blue transition-colors"/>
                    </div>
                    <input type={showConfirmPassword ? 'text' : 'password'} name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className={`w-full pl-11 pr-12 py-3 bg-wellness-bg/50 border ${errors.confirmPassword ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-wellness-border focus:border-wellness-blue focus:ring-wellness-blue/10'} rounded-xl focus:bg-white focus:ring-4 outline-none transition-all text-sm`}/>

                    <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-wellness-text-muted hover:text-wellness-text">

                      {showConfirmPassword ?
            <EyeOff className="h-5 w-5"/> :
            <Eye className="h-5 w-5"/>}
                    </button>
                  </div>
                  {errors.confirmPassword &&
            <p className="text-xs text-red-500 mt-1.5 ml-1">
                      {errors.confirmPassword}
                    </p>}
                </div>
              </div>

              {/* Academic Info */}
              <div className="bg-wellness-bg/30 p-5 rounded-2xl border border-wellness-border/50">
                <p className="text-xs text-wellness-text-sec mb-4 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-wellness-blue"/>
                  Your faculty determines your accessible modules and community.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-wellness-text-sec mb-1.5">
                      Faculty
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <BookOpen className="h-4 w-4 text-wellness-text-muted"/>
                      </div>
                      <select name="faculty" value={formData.faculty} onChange={handleChange} className="w-full pl-9 pr-8 py-2.5 bg-white border border-wellness-border rounded-xl focus:border-wellness-blue focus:ring-2 focus:ring-wellness-blue/10 outline-none transition-all text-sm appearance-none cursor-pointer">

                        <option value="" disabled>
                          Select
                        </option>
                        <option value="FOC">Computing (FOC)</option>
                        <option value="FOB">Business (FOB)</option>
                        <option value="FOE">Engineering (FOE)</option>
                        <option value="FAS">Science (FAS)</option>
                        <option value="FOL">Law (FOL)</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-4 h-4 text-wellness-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7">
                          </path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-wellness-text-sec mb-1.5">
                      Year
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <GraduationCap className="h-4 w-4 text-wellness-text-muted"/>
                      </div>
                      <select name="year" value={formData.year} onChange={handleChange} className="w-full pl-9 pr-8 py-2.5 bg-white border border-wellness-border rounded-xl focus:border-wellness-blue focus:ring-2 focus:ring-wellness-blue/10 outline-none transition-all text-sm appearance-none cursor-pointer">

                        <option value="" disabled>
                          Select
                        </option>
                        <option value="Year 1">Year 1</option>
                        <option value="Year 2">Year 2</option>
                        <option value="Year 3">Year 3</option>
                        <option value="Year 4">Year 4</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-4 h-4 text-wellness-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7">
                          </path>
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-wellness-text-sec mb-1.5">
                      Semester
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Calendar className="h-4 w-4 text-wellness-text-muted"/>
                      </div>
                      <select name="semester" value={formData.semester} onChange={handleChange} disabled={!formData.year} className="w-full pl-9 pr-8 py-2.5 bg-white border border-wellness-border rounded-xl focus:border-wellness-blue focus:ring-2 focus:ring-wellness-blue/10 outline-none transition-all text-sm appearance-none cursor-pointer disabled:opacity-50 disabled:bg-gray-50">

                        <option value="" disabled>
                          Select
                        </option>
                        <option value="Semester 1">Semester 1</option>
                        <option value="Semester 2">Semester 2</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-4 h-4 text-wellness-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">

                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7">
                          </path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-start gap-3 cursor-pointer group mb-6">
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-1 w-4 h-4 rounded border-wellness-border text-wellness-blue focus:ring-wellness-blue/20 cursor-pointer"/>

                  <span className="text-sm text-wellness-text-sec group-hover:text-wellness-text transition-colors leading-relaxed">
                    I agree to the{' '}
                    <a href="#" className="text-wellness-blue hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-wellness-blue hover:underline">
                      Privacy Policy
                    </a>
                    .
                  </span>
                </label>

                <button type="submit" disabled={!isFormValid || isLoading} className="btn-primary w-full py-3.5 flex justify-center items-center gap-2 text-base shadow-lg shadow-wellness-blue/20 disabled:opacity-70 disabled:cursor-not-allowed">

                  {isLoading ?
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> :
            <>
                      Create Account <ArrowRight className="w-4 h-4"/>
                    </>}
                </button>
                <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-wellness-text-muted">
                  <Lock className="w-3 h-3"/>
                  <span>Secure, encrypted registration</span>
                </div>
              </div>
            </form>
          </motion.div>

          <motion.p variants={itemVariants} className="text-center mt-8 text-sm text-wellness-text-sec">

            Already have an account?{' '}
            <button onClick={onNavigateToLogin} className="text-wellness-blue font-semibold hover:text-blue-600 transition-colors">

              Sign in
            </button>
          </motion.p>
        </motion.div>
      </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>);
}
