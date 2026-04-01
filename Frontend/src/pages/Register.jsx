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
                onClick={onNavigateToLogin}
                className="px-4 py-2 text-sm font-medium text-slate-700 transition" style={{ color: '#5F705F' }}
                onMouseEnter={(e) => e.target.style.color = '#7BAE7F'}
                onMouseLeave={(e) => e.target.style.color = '#5F705F'}
              >
                Sign In
              </button>
              <button
                onClick={onNavigateToHome}
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
                Join the <span style={{ color: '#7BAE7F' }}>Community</span>
              </h1>
              <p className="text-slate-600">
                Create an account to get started
              </p>
            </motion.div>

            <motion.div variants={itemVariants} className="bg-white rounded-2xl shadow-lg p-8 border border-slate-100">
              <form onSubmit={handleRegister} className="space-y-5">
                {submitError && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-200 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
                    {submitError}
                  </div>
                )}

                {/* Student ID */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Student ID
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleChange}
                      placeholder="e.g. STU2024"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none transition-all text-slate-900 ${
                        errors.studentId 
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                          : 'border-slate-200'
                      }`}
                      onFocus={(e) => {
                        if (!errors.studentId) {
                          e.target.style.borderColor = '#7BAE7F';
                          e.target.style.boxShadow = '0 0 0 2px rgba(123, 174, 127, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.studentId) {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    />
                  </div>
                  {errors.studentId && <p className="text-xs text-red-500 mt-1">{errors.studentId}</p>}
                </div>

                {/* University Email */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    University Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      name="universityMail"
                      value={formData.universityMail}
                      onChange={handleChange}
                      placeholder="student@university.edu"
                      className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none transition-all text-slate-900 ${
                        errors.universityMail 
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                          : 'border-slate-200'
                      }`}
                      onFocus={(e) => {
                        if (!errors.universityMail) {
                          e.target.style.borderColor = '#7BAE7F';
                          e.target.style.boxShadow = '0 0 0 2px rgba(123, 174, 127, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.universityMail) {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    />
                  </div>
                  {errors.universityMail && <p className="text-xs text-red-500 mt-1">{errors.universityMail}</p>}
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none transition-all text-slate-900 ${
                        errors.password 
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                          : 'border-slate-200'
                      }`}
                      onFocus={(e) => {
                        if (!errors.password) {
                          e.target.style.borderColor = '#7BAE7F';
                          e.target.style.boxShadow = '0 0 0 2px rgba(123, 174, 127, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.password) {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }
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
                  {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-slate-900 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:outline-none transition-all text-slate-900 ${
                        errors.confirmPassword 
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                          : 'border-slate-200'
                      }`}
                      onFocus={(e) => {
                        if (!errors.confirmPassword) {
                          e.target.style.borderColor = '#7BAE7F';
                          e.target.style.boxShadow = '0 0 0 2px rgba(123, 174, 127, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.confirmPassword) {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
                </div>

                {/* Faculty, Year, Semester */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Faculty
                    </label>
                    <select
                      name="faculty"
                      value={formData.faculty}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none transition-all text-sm text-slate-900 ${
                        errors.faculty 
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                          : 'border-slate-200'
                      }`}
                      onFocus={(e) => {
                        if (!errors.faculty) {
                          e.target.style.borderColor = '#7BAE7F';
                          e.target.style.boxShadow = '0 0 0 2px rgba(123, 174, 127, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.faculty) {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <option value="">Select</option>
                      <option value="FOC">Computing</option>
                      <option value="FOB">Business</option>
                      <option value="FOE">Engineering</option>
                      <option value="FAS">Science</option>
                      <option value="FOL">Law</option>
                    </select>
                    {errors.faculty && <p className="text-xs text-red-500 mt-1">{errors.faculty}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Year
                    </label>
                    <select
                      name="year"
                      value={formData.year}
                      onChange={handleChange}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none transition-all text-sm text-slate-900 ${
                        errors.year 
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                          : 'border-slate-200'
                      }`}
                      onFocus={(e) => {
                        if (!errors.year) {
                          e.target.style.borderColor = '#7BAE7F';
                          e.target.style.boxShadow = '0 0 0 2px rgba(123, 174, 127, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.year) {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <option value="">Select</option>
                      <option value="Year 1">Year 1</option>
                      <option value="Year 2">Year 2</option>
                      <option value="Year 3">Year 3</option>
                      <option value="Year 4">Year 4</option>
                    </select>
                    {errors.year && <p className="text-xs text-red-500 mt-1">{errors.year}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-900 mb-2">
                      Semester
                    </label>
                    <select
                      name="semester"
                      value={formData.semester}
                      onChange={handleChange}
                      disabled={!formData.year}
                      className={`w-full px-3 py-2 border rounded-lg focus:outline-none transition-all text-sm text-slate-900 ${
                        errors.semester 
                          ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100' 
                          : 'border-slate-200'
                      } disabled:opacity-50 disabled:bg-slate-50`}
                      onFocus={(e) => {
                        if (!errors.semester) {
                          e.target.style.borderColor = '#7BAE7F';
                          e.target.style.boxShadow = '0 0 0 2px rgba(123, 174, 127, 0.1)';
                        }
                      }}
                      onBlur={(e) => {
                        if (!errors.semester) {
                          e.target.style.borderColor = '#e2e8f0';
                          e.target.style.boxShadow = 'none';
                        }
                      }}
                    >
                      <option value="">Select</option>
                      <option value="Semester 1">Sem 1</option>
                      <option value="Semester 2">Sem 2</option>
                    </select>
                    {errors.semester && <p className="text-xs text-red-500 mt-1">{errors.semester}</p>}
                  </div>
                </div>

                {/* Terms Checkbox */}
                <label className="flex items-center gap-2 cursor-pointer mt-4">
                  <input
                    type="checkbox"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="w-4 h-4 border-slate-300 rounded"
                    style={{ accentColor: '#7BAE7F' }}
                  />
                  <span className="text-sm text-slate-600">
                    I agree to the Terms of Service and Privacy Policy
                  </span>
                </label>

                {/* Sign Up Button */}
                <button
                  type="submit"
                  disabled={isLoading || !agreed}
                  className="w-full text-white font-semibold py-3 rounded-lg transition-all inline-flex items-center justify-center gap-2 mt-6"
                  style={{ 
                    backgroundColor: isLoading || !agreed ? '#B8D0B8' : '#7BAE7F'
                  }}
                  onMouseEnter={(e) => {
                    if (!isLoading && agreed) {
                      e.target.style.backgroundColor = '#4F7D5C';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isLoading && agreed) {
                      e.target.style.backgroundColor = '#7BAE7F';
                    }
                  }}
                >
                  Create Account
                  <ArrowRight size={18} />
                </button>
              </form>

              {/* Sign In Link */}
              <p className="text-center text-sm text-slate-600 mt-6">
                Already have an account?{' '}
                <button 
                  onClick={onNavigateToLogin}
                  className="font-semibold transition-colors"
                  style={{ color: '#7BAE7F' }}
                  onMouseEnter={(e) => e.target.style.color = '#4F7D5C'}
                  onMouseLeave={(e) => e.target.style.color = '#7BAE7F'}
                >
                  Sign in
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

        {/* Footer */}
        <Footer />
      </div>
    );
}
