import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mail, KeyRound, LogIn, Lock, User as UserIcon, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../AuthContext.jsx';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Finalize
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [otp, setOtp] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, requestOtp, verifyOtp, completeSignup } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  // Login
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Email and password required');

    setIsSubmitting(true);
    try {
      await login({ email, password });
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign Up: Step 1 (Request OTP)
  const handleRequestOtpSubmit = async (e) => {
    e.preventDefault();
    if (!email) return toast.error('Email is required');

    setIsSubmitting(true);
    try {
      let captchaToken = '';
      if (window.grecaptcha) {
        captchaToken = await window.grecaptcha.execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, { action: 'signup' });
      } else {
        toast.error('reCAPTCHA not loaded. Please refresh the page.');
        setIsSubmitting(false);
        return;
      }
      
      await requestOtp({ email, captchaToken });
      toast.success('Verification code sent to your email!');
      setStep(2);
    } catch (error) {
      toast.error(error.message || 'Failed to request code');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign Up: Step 2 (Verify OTP)
  const handleVerifyOtpSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) return toast.error('Valid 6-digit OTP required');
    
    setIsSubmitting(true);
    try {
      await verifyOtp(email, otp);
      toast.success('Email verified! Almost done.');
      setStep(3);
    } catch (error) {
      toast.error(error.message || 'Invalid or expired OTP');
      setOtp('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign Up: Step 3 (Set Password & Name)
  const handleCompleteSignupSubmit = async (e) => {
    e.preventDefault();
    if (!password || !displayName) return toast.error('All fields are required');

    setIsSubmitting(true);
    try {
      await completeSignup({ email, displayName, password });
      toast.success('Account created successfully!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(error.message || 'Failed to complete registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle Mode
  const toggleMode = () => {
    setIsLogin(!isLogin);
    setStep(1);
    setOtp('');
  };

  return (
    <div className="max-w-md mx-auto py-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {step === 3 ? 'Set up Profile' : step === 2 ? 'Verify Email' : (isLogin ? 'Welcome Back' : 'Create Account')}
          </h1>
          <p className="text-gray-500">
            {step === 3 ? 'Choose a password and set your name' : step === 2 ? 'Enter the 6-digit PIN sent to your email' : (isLogin ? 'Sign in to access your dashboard' : 'Join us to get started')}
          </p>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Login OR Sign Up Email Request */}
          {step === 1 && (
            <motion.form 
              key="step-1"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={isLogin ? handleLoginSubmit : handleRequestOtpSubmit} 
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    required
                    type="email"
                    placeholder="email@example.com"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      required
                      type="password"
                      placeholder="••••••••"
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-4 mt-2 rounded-2xl font-bold flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" /> {isLogin ? 'Sign In' : 'Send Verification Code'}
                  </>
                )}
              </button>

              <div className="mt-6 text-center">
                <button 
                  type="button"
                  onClick={toggleMode}
                  className="text-sm text-indigo-600 font-bold hover:underline"
                >
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
              </div>
            </motion.form>
          )}

          {/* STEP 2: OTP VERIFICATION (Sign Up Only) */}
          {step === 2 && (
            <motion.form 
              key="step-2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOtpSubmit} 
              className="space-y-6"
            >
              <div className="space-y-2 text-center bg-gray-50 p-4 rounded-xl border border-gray-100">
                <p className="text-sm font-medium text-gray-600">
                  Verification code sent to<br/>
                  <span className="font-bold text-gray-800">{email}</span>
                </p>
                <button 
                  type="button" 
                  onClick={() => { setStep(1); setOtp(''); }}
                  className="text-xs text-indigo-600 font-bold hover:underline mt-2 inline-block"
                >
                  Change email address
                </button>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-sm font-bold text-gray-700 ml-1">6-Digit Code</label>
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    required
                    autoFocus
                    type="text"
                    maxLength="6"
                    placeholder="123456"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-center tracking-widest font-mono text-xl"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || otp.length < 6}
                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Verify Code
                  </>
                )}
              </button>
            </motion.form>
          )}

          {/* STEP 3: ACCOUNT COMPLETION (Sign Up Only) */}
          {step === 3 && (
            <motion.form 
              key="step-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleCompleteSignupSubmit} 
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">Full Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    required
                    autoFocus
                    type="text"
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    required
                    type="password"
                    placeholder="••••••••"
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-indigo-600 text-white py-4 mt-2 rounded-2xl font-bold flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" /> Complete Registration
                  </>
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};
