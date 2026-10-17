// GraphSentinel AI - Authentication & Login Portal

import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, Eye, EyeOff, Lock, Mail, User, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register, isAuthenticated } = useAuth();

  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('sre@graphsentinel.ai');
  const [password, setPassword] = useState<string>('SREAdmin2026!');
  const [fullName, setFullName] = useState<string>('Alex Vance');
  const [role, setRole] = useState<string>('Lead Incident Commander');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // If already logged in, redirect
  const from = (location.state as any)?.from?.pathname || '/';

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

  const handleFillDemo = (demoEmail: string, demoPass: string, demoName: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setFullName(demoName);
    setRole(demoRole);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Logo and Tagline */}
        <div className="flex justify-center mb-3">
          <img
            src="/assets/logo.png"
            alt="GraphSentinel AI"
            className="h-16 w-auto object-contain drop-shadow-sm"
            onError={(e) => {
              // fallback if image not loaded
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <Shield className="w-6 h-6 text-indigo-600" />
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            GraphSentinel <span className="text-indigo-600">AI</span>
          </h1>
        </div>
        <p className="text-sm font-semibold text-indigo-700 tracking-wide uppercase text-xs mb-1">
          Incident Intelligence & Resolution Platform
        </p>
        <p className="text-sm text-slate-600 font-medium">
          “See the Impact. Find the Cause.”
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-sm border border-slate-200 rounded-xl sm:px-10">
          {/* Header Switcher */}
          <div className="flex border-b border-slate-100 pb-4 mb-6">
            <button
              type="button"
              onClick={() => { setIsRegistering(false); setError(null); }}
              className={`flex-1 text-center py-2 text-sm font-semibold border-b-2 transition-colors ${
                !isRegistering
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegistering(true); setError(null); }}
              className={`flex-1 text-center py-2 text-sm font-semibold border-b-2 transition-colors ${
                isRegistering
                  ? 'border-indigo-600 text-indigo-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              Register Operator
            </button>
          </div>

          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-rose-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="h-4 w-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Alex Vance"
                    className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Work Email Address
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sre@graphsentinel.ai"
                  className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="block w-full pl-9 pr-10 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isRegistering && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role & Responsibility
                </label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="block w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-900"
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
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-50 mt-2"
            >
              {isSubmitting ? (
                <span>Authenticating...</span>
              ) : isRegistering ? (
                <>
                  <span>Create Account & Sign In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In to Platform</span>
                </>
              )}
            </button>
          </form>

          {/* SRE Demo Account Quick Selector */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
              Instant Demonstration Credentials
            </p>
            <div
              onClick={() => handleFillDemo('sre@graphsentinel.ai', 'SREAdmin2026!', 'Alex Vance', 'Lead Incident Commander')}
              className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-lg cursor-pointer hover:bg-indigo-100/70 transition-colors group flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-xs font-bold text-slate-800">Primary Incident Commander</span>
                </div>
                <p className="text-[11px] text-slate-600 font-mono mt-0.5">
                  sre@graphsentinel.ai • SREAdmin2026!
                </p>
              </div>
              <span className="text-[11px] font-semibold text-indigo-600 group-hover:underline">
                Click to Load
              </span>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="text-center text-xs text-slate-500 mt-4">
          Protected by FalkorDB Graph & Salted PBKDF2 Session Security
        </p>
      </div>
    </div>
  );
};
