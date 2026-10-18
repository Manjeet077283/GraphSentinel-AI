// GraphSentinel AI - Authentication & Login Portal

import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  ShieldAlert,
  Eye,
  EyeOff,
  Lock,
  Mail,
  User,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Play,
  ArrowLeft,
  Sun,
  Moon
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('sre@graphsentinel.ai');
  const [password, setPassword] = useState<string>('SREAdmin2026!');
  const [fullName, setFullName] = useState<string>('Alex Vance');
  const [role, setRole] = useState<string>('Lead Incident Commander');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // If already logged in, redirect to dashboard or requested page
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, from]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (isRegistering) {
        if (!fullName.trim()) {
          throw new Error('Please enter your full name.');
        }
        await register(email, password, fullName, role);
      } else {
        await login(email, password);
      }
      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInstantDemoLogin = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await login('sre@graphsentinel.ai', 'SREAdmin2026!');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo session initialisation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 selection:bg-indigo-500 selection:text-white dark:selection:bg-cyan-500 transition-colors duration-150">
      {/* Top Bar Navigation & Theme Switcher */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Product Homepage</span>
        </Link>

        <button
          type="button"
          onClick={toggleTheme}
          className="flex items-center justify-center w-8 h-8 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 dark:border-slate-700/60 dark:bg-[#0E1524] dark:hover:bg-[#131E32] dark:text-slate-300 transition-all cursor-pointer"
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-4 h-4 text-slate-600 hover:text-indigo-600 hover:-rotate-12 transition-transform" />
          )}
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo and Tagline */}
        <div className="flex justify-center mb-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 dark:bg-cyan-950/60 dark:border-cyan-500/40 flex items-center justify-center p-2 shadow-xs dark:shadow-[0_0_20px_rgba(6,182,212,0.2)]">
            <ShieldAlert className="w-7 h-7 text-indigo-600 dark:text-cyan-400" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white font-sans">
            GraphSentinel <span className="text-indigo-600 dark:text-cyan-400">AI</span>
          </h1>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-800/60 font-semibold tracking-wider">
            FalkorDB
          </span>
        </div>
        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
          Incident Intelligence & Dependency Graph Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white dark:bg-[#0E1524] py-8 px-6 shadow-sm dark:shadow-2xl border border-slate-200 dark:border-slate-800 rounded-2xl sm:px-10 transition-colors">
          {/* Header Switcher */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 pb-3 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setError(null);
              }}
              className={`flex-1 text-center py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                !isRegistering
                  ? 'border-indigo-600 text-indigo-700 dark:border-cyan-400 dark:text-cyan-300'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setError(null);
              }}
              className={`flex-1 text-center py-2 text-xs font-bold border-b-2 transition-colors cursor-pointer ${
                isRegistering
                  ? 'border-indigo-600 text-indigo-700 dark:border-cyan-400 dark:text-cyan-300'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Register Operator
            </button>
          </div>

          {/* Quick Demo Launch Fast-Track for Hackathon Judges */}
          {!isRegistering && (
            <div className="mb-6 p-4 rounded-xl bg-indigo-50/70 border border-indigo-200 dark:bg-cyan-950/40 dark:border-cyan-800/60 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase font-bold text-indigo-700 dark:text-cyan-300 tracking-wider">
                  Hackathon Evaluation Fast-Track
                </span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 dark:bg-cyan-900/60 dark:text-cyan-200 font-semibold">
                  Preloaded
                </span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300">
                Explore as <strong className="text-slate-900 dark:text-white">Lead SRE (Alex Vance)</strong> with immediate access to 16 microservices and incident graphs.
              </p>
              <button
                type="button"
                onClick={handleInstantDemoLogin}
                disabled={isSubmitting}
                className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 text-xs font-bold shadow-xs transition-all disabled:opacity-50 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Authenticating...</span>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-white dark:fill-slate-950" />
                    <span>Launch Preloaded SRE Demo</span>
                  </>
                )}
              </button>
            </div>
          )}

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl flex items-start gap-2.5 text-rose-700 dark:text-rose-400 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative rounded-lg shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Vance"
                    className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 dark:focus:ring-cyan-500 focus:border-indigo-500 dark:focus:border-cyan-500 bg-white dark:bg-[#131E32] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Work Email Address
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sre@graphsentinel.ai"
                  className="block w-full pl-9 pr-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 dark:focus:ring-cyan-500 focus:border-indigo-500 dark:focus:border-cyan-500 bg-white dark:bg-[#131E32] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative rounded-lg shadow-2xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-10 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 dark:focus:ring-cyan-500 focus:border-indigo-500 dark:focus:border-cyan-500 bg-white dark:bg-[#131E32] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role & Responsibility
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full px-3 py-2 text-xs border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-1 focus:ring-indigo-500 dark:focus:ring-cyan-500 focus:border-indigo-500 dark:focus:border-cyan-500 bg-white dark:bg-[#131E32] text-slate-900 dark:text-slate-100"
                >
                  <option value="Lead Incident Commander">Lead Incident Commander</option>
                  <option value="Site Reliability Engineer">Site Reliability Engineer (SRE)</option>
                  <option value="DevOps Operations">DevOps Operations</option>
                  <option value="Platform Architect">Platform Architect</option>
                  <option value="Security On-Call">Security On-Call</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 transition-colors disabled:opacity-50 mt-2 shadow-xs cursor-pointer"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : isRegistering ? (
                <>
                  <span>Create Account & Enter Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Sign In with Credentials</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Credentials quick fill */}
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800">
            <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Demo Credentials
            </p>
            <div
              onClick={() => {
                setEmail('sre@graphsentinel.ai');
                setPassword('SREAdmin2026!');
              }}
              className="p-3 bg-slate-50 dark:bg-[#131E32] border border-slate-200 dark:border-slate-800 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors group flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">Lead Incident Commander</span>
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  sre@graphsentinel.ai • SREAdmin2026!
                </p>
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 dark:text-cyan-400 group-hover:underline">
                Auto Fill
              </span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-xs text-slate-500 mt-4">
          Protected by FalkorDB Graph & PBKDF2 Session Security
        </p>
      </div>
    </div>
  );
};
