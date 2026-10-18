import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowRight,
  Network,
  Share2,
  AlertOctagon,
  Wrench,
  CheckCircle2,
  Database,
  Cpu,
  Layers,
  Sparkles,
  Terminal,
  Activity,
  FileText,
  Clock,
  Search,
  ChevronRight,
  ExternalLink,
  Menu,
  X,
  Play,
  Flame,
  Check,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LandingPage: React.FC = () => {
  const { isAuthenticated, login } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoLoggingIn, setDemoLoggingIn] = useState(false);
  const [demoError, setDemoError] = useState<string | null>(null);

  const handleLaunchDemo = async () => {
    if (isAuthenticated) {
      navigate('/dashboard');
      return;
    }
    setDemoLoggingIn(true);
    setDemoError(null);
    try {
      await login('sre@graphsentinel.ai', 'SREAdmin2026!');
      navigate('/dashboard');
    } catch (err: any) {
      setDemoError(err.message || 'Demo session initialisation failed. Please use Login.');
      setDemoLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white dark:selection:bg-cyan-500 overflow-x-hidden transition-colors duration-150">
      {/* ------------------------------------------------------------------- */}
      {/* HEADER / NAVIGATION                                                 */}
      {/* ------------------------------------------------------------------- */}
      <header className="sticky top-0 z-50 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Brand Logo */}
            <Link to="/" className="flex items-center gap-3 group shrink-0">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 dark:bg-cyan-950/60 dark:border-cyan-500/40 flex items-center justify-center p-1.5 shadow-xs group-hover:border-indigo-400 dark:group-hover:border-cyan-400 transition-colors">
                <ShieldAlert className="w-5 h-5 text-indigo-600 dark:text-cyan-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white">
                  GraphSentinel<span className="text-indigo-600 dark:text-cyan-400"> AI</span>
                </span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-800/60 font-semibold tracking-wider">
                  FalkorDB
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-600 dark:text-slate-300">
              <a href="#capabilities" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">
                Capabilities
              </a>
              <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">
                How It Works
              </a>
              <a href="#architecture" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">
                Architecture
              </a>
              <a href="#demo" className="hover:text-indigo-600 dark:hover:text-cyan-400 transition-colors">
                Live Demo
              </a>
            </nav>

            {/* Action CTAs & Theme Toggle */}
            <div className="hidden sm:flex items-center gap-3">
              {/* Theme Toggle Button */}
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

              {isAuthenticated ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 text-xs font-semibold shadow-xs transition-all"
                >
                  <span>Launch Console</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="px-3.5 py-2 rounded-lg text-xs font-medium text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60 dark:border-slate-700/60 transition-colors"
                  >
                    Sign In
                  </Link>
                  <button
                    onClick={handleLaunchDemo}
                    disabled={demoLoggingIn}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 text-xs font-semibold shadow-xs transition-all disabled:opacity-50"
                  >
                    {demoLoggingIn ? (
                      <span className="flex items-center gap-1.5">
                        <span className="w-3 h-3 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" />
                        Loading Demo...
                      </span>
                    ) : (
                      <>
                        <span>Explore Live Demo</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </>
              )}
            </div>

            {/* Mobile Hamburger Toggle & Theme Toggle */}
            <div className="flex md:hidden items-center gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300"
                aria-label="Toggle Theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition-colors"
                aria-label="Toggle Navigation"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1524] px-4 pt-3 pb-5 space-y-3">
            <a
              href="#capabilities"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              Capabilities
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              How It Works
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              Architecture
            </a>
            <a
              href="#demo"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            >
              Live Demo
            </a>
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-2">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLaunchDemo();
                }}
                disabled={demoLoggingIn}
                className="w-full text-center py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 text-xs font-semibold shadow-xs"
              >
                Launch SRE Console
              </button>
              {!isAuthenticated && (
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2 px-4 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-200"
                >
                  Sign In with Password
                </Link>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* HERO SECTION                                                        */}
      {/* ------------------------------------------------------------------- */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden border-b border-slate-200 dark:border-slate-800/60">
        {/* Subtle Background Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-indigo-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[300px] bg-blue-500/5 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 dark:bg-cyan-950/80 dark:border-cyan-800/60 dark:text-cyan-300 text-xs font-mono font-medium shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-cyan-400 animate-ping" />
              <span>Real-Time Incident Intelligence & Dependency Graph</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-[1.15]">
              Turn Infrastructure Incidents Into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-sky-600 dark:from-cyan-400 dark:via-sky-300 dark:to-indigo-400">
                Actionable Intelligence.
              </span>
            </h1>

            {/* Plain English Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              When microservices fail, raw logs and alert storms are overwhelming. GraphSentinel AI connects service topologies, telemetry metrics, and incident memory in a <strong className="text-slate-900 dark:text-white font-medium">FalkorDB knowledge graph</strong> to isolate the true root cause, calculate cascading blast radius, and recommend verified recovery steps.
            </p>

            {/* Hero CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={handleLaunchDemo}
                disabled={demoLoggingIn}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 text-sm font-bold shadow-md shadow-indigo-500/20 dark:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {demoLoggingIn ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white dark:border-slate-950 border-t-transparent rounded-full animate-spin" />
                    Connecting to FalkorDB...
                  </span>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-white dark:fill-slate-950" />
                    <span>Explore Live Demo Console</span>
                  </>
                )}
              </button>

              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-sm font-semibold border border-slate-300 dark:bg-slate-900/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700/80 transition-colors"
              >
                <span>How It Works</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </a>
            </div>

            {demoError && (
              <p className="text-xs text-rose-700 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 p-2.5 rounded-lg max-w-md mx-auto">
                {demoError}
              </p>
            )}

            {/* Quick Proof Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>16 Monitored Microservices</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>FalkorDB Graph Engine</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>Gemini Graph Grounding</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                <span>Zero Hallucination Proof</span>
              </div>
            </div>
          </div>

          {/* Product Preview Card */}
          <div className="mt-12 sm:mt-16 relative rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1524] shadow-xl p-4 sm:p-6 overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800/80 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <div className="w-3 h-3 rounded-full bg-amber-500" />
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="ml-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                  GraphSentinel AI • Active Incident Investigation (INC-001)
                </span>
              </div>
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800/80">
                P1 CRITICAL
              </span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Left Column: Causal Problem Card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#131E32] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
                  <Flame className="w-4 h-4" />
                  <span>Isolated Root Failure</span>
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  Payment Processing API (SVC-PAYMENT)
                </h4>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Connection pool exhausted (50/50 active, 124 waiting). Upstream latency spiked from 145ms to 12,850ms causing cascading 504 timeouts across checkout.
                </p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Downstream Cascade:</span>
                  <strong className="text-indigo-600 dark:text-cyan-400">3 Dependent Services</strong>
                </div>
              </div>

              {/* Middle Column: Visual Dependency Path */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#131E32] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  <Network className="w-4 h-4" />
                  <span>FalkorDB Multi-Hop Cascade</span>
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="p-2 rounded bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-800 dark:text-slate-200">
                    <span>SVC-PAYMENT</span>
                    <span className="text-rose-600 dark:text-rose-400 font-bold">ROOT CAUSE</span>
                  </div>
                  <div className="text-center text-slate-400 dark:text-slate-500 text-[10px]">↓ DEPENDS_ON (HTTP Sync)</div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-700 dark:text-slate-300">
                    <span>SVC-CHECKOUT</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">DEGRADED</span>
                  </div>
                  <div className="text-center text-slate-400 dark:text-slate-500 text-[10px]">↓ DEPENDS_ON (RPC)</div>
                  <div className="p-2 rounded bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span>SVC-ORDER</span>
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">DEGRADED</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Verified Actionable Next Steps */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#131E32] border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <Wrench className="w-4 h-4" />
                  <span>Verified Remediation Steps</span>
                </div>
                <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">1</span>
                    <span>Scale Hikari connection pool from 50 to 100 on primary database.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">2</span>
                    <span>Enable gateway circuit breaker on Payment route to shed stalled client queues.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">3</span>
                    <span>Run live recovery probe verification checklist before closing incident.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* HOW IT WORKS (4-STEP PIPELINE)                                      */}
      {/* ------------------------------------------------------------------- */}
      <section id="how-it-works" className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800/60 bg-slate-100/60 dark:bg-[#0E1524]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">
              Investigation Methodology
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
              From Alert Noise to Root-Cause Clarity
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3">
              Standard APMs dump disconnected alerts. GraphSentinel AI models your architecture as a connected graph to trace exact failure causality.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Step 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#131E32] border border-slate-200 dark:border-slate-800 space-y-3 relative shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800 flex items-center justify-center text-xs font-mono font-bold">
                01
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Incident Ingestion</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Normalizes multi-format inputs (CSV, JSON, JSONL, logs, alerts) with automated column schema inference and deduplication.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#131E32] border border-slate-200 dark:border-slate-800 space-y-3 relative shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800 flex items-center justify-center text-xs font-mono font-bold">
                02
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Graph Topology Traversal</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                FalkorDB traverses microservice call chains and infrastructure links via Cypher to map exact caller/callee dependencies.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#131E32] border border-slate-200 dark:border-slate-800 space-y-3 relative shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800 flex items-center justify-center text-xs font-mono font-bold">
                03
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Causal Blast Radius</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Distinguishes between root failure culprits and noisy downstream cascade symptoms, quantifying exact blast radius distance.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#131E32] border border-slate-200 dark:border-slate-800 space-y-3 relative shadow-xs">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-cyan-950 dark:text-cyan-400 dark:border-cyan-800 flex items-center justify-center text-xs font-mono font-bold">
                04
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Actionable Remediation</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Generates a 14-section SRE postmortem report, step-by-step mitigation workflow, and automated telemetry recovery probes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* CORE CAPABILITIES (VERIFIED IMPLEMENTED FEATURES)                   */}
      {/* ------------------------------------------------------------------- */}
      <section id="capabilities" className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">
              Core Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
              Engineered for Production SREs
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3">
              Only authentic, fully verified features. Every metric and graph query is backed by live FalkorDB queries.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Capability 1 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 dark:bg-cyan-950/80 dark:border-cyan-800/60 text-indigo-600 dark:text-cyan-400 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">FalkorDB Graph Explorer</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Interactive Cytoscape.js canvas showing 17 microservices, 32 dependency edges, and active incident nodes with progressive disclosure.
              </p>
            </div>

            {/* Capability 2 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 dark:bg-indigo-950/80 dark:border-indigo-800/60 text-blue-600 dark:text-indigo-400 flex items-center justify-center">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Blast Radius Calculation</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Bounded 1-to-3 hop path traversal calculating exact downstream impact chains so on-call commanders know which customer flows are at risk.
              </p>
            </div>

            {/* Capability 3 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 dark:bg-emerald-950/80 dark:border-emerald-800/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">14-Section SRE Reports</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Executive summaries, timeline breakdowns, observed symptoms, causal facts, and postmortem documentation formatted for instant copy/export.
              </p>
            </div>

            {/* Capability 4 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 dark:bg-amber-950/80 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Wrench className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Step-by-Step Mitigation</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Guided resolution checklists with actor tracking, step confirmation, and risk indicators grounded directly in graph telemetry facts.
              </p>
            </div>

            {/* Capability 5 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-cyan-50 border border-cyan-100 dark:bg-cyan-950/80 dark:border-cyan-800/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Telemetry Recovery Probes</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Live verification checks inspecting error rate rolling averages, socket saturation, and downstream reachability before marking resolved.
              </p>
            </div>

            {/* Capability 6 */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-800 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 dark:bg-purple-950/80 dark:border-purple-800/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Graph-Grounded AI Copilot</h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Google Gemini 2.5 Flash strictly bounded by FalkorDB Cypher facts. Prevents LLM hallucinations during high-stakes operational incidents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* ARCHITECTURE & VERIFIED STACK                                       */}
      {/* ------------------------------------------------------------------- */}
      <section id="architecture" className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800/60 bg-slate-100/60 dark:bg-[#0E1524]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
            <span className="text-xs font-mono font-bold text-indigo-600 dark:text-cyan-400 uppercase tracking-wider">
              Technical Foundation
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white mt-2 tracking-tight">
              Verified Production Architecture
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-3">
              Built on enterprise-grade components verified against the live environment.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-center">
            <div className="p-4 rounded-xl bg-white dark:bg-[#131E32] border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <div className="text-indigo-600 dark:text-cyan-400 font-mono font-bold text-base">FalkorDB</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">Graph Database Engine (Cloud AWS)</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#131E32] border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <div className="text-indigo-600 dark:text-cyan-400 font-mono font-bold text-base">FastAPI</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">Python 3.12 Core Backend Service</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#131E32] border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <div className="text-indigo-600 dark:text-cyan-400 font-mono font-bold text-base">React 19</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">Vite 8 Single-Page Application</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#131E32] border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <div className="text-indigo-600 dark:text-cyan-400 font-mono font-bold text-base">Gemini 2.5</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">Graph-Grounded SRE Copilot</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#131E32] border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <div className="text-indigo-600 dark:text-cyan-400 font-mono font-bold text-base">Cytoscape</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">Hardware-Accelerated Canvas</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-[#131E32] border border-slate-200 dark:border-slate-800 space-y-2 shadow-xs">
              <div className="text-indigo-600 dark:text-cyan-400 font-mono font-bold text-base">Render</div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">Global Edge CDN & Cloud Container</p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* LIVE DEMO & SAFE EVALUATION SECTION                                 */}
      {/* ------------------------------------------------------------------- */}
      <section id="demo" className="py-16 sm:py-24 border-b border-slate-200 dark:border-slate-800/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-3xl bg-gradient-to-br from-indigo-50/70 via-white to-slate-50 border border-slate-200 shadow-xl dark:from-[#0E1524] dark:via-[#131E32] dark:to-[#0E1524] dark:border-slate-700/60 p-8 sm:p-12 text-center max-w-4xl mx-auto space-y-6 relative overflow-hidden">
            <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 dark:bg-cyan-950/80 dark:border-cyan-500/40 dark:text-cyan-400 flex items-center justify-center mx-auto shadow-sm dark:shadow-[0_0_30px_rgba(6,182,212,0.2)]">
              <Play className="w-8 h-8 fill-indigo-600 dark:fill-cyan-400" />
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Ready to Explore the Incident Graph?
            </h2>

            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl mx-auto leading-relaxed">
              For safe and reproducible hackathon evaluation, GraphSentinel AI comes preloaded with a synthetic enterprise baseline (16 microservices, 42 incidents, 137 nodes, 281 graph edges). Zero risk to real infrastructure.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={handleLaunchDemo}
                disabled={demoLoggingIn}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white dark:bg-cyan-500 dark:hover:bg-cyan-400 dark:text-slate-950 text-sm font-bold shadow-md shadow-indigo-500/20 dark:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
              >
                {demoLoggingIn ? (
                  <span>Loading Demo Console...</span>
                ) : (
                  <>
                    <span>Launch SRE Console</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <Link
                to="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-sm font-semibold border border-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 transition-colors"
              >
                Manual Login / Custom SRE Account
              </Link>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Preconfigured Lead SRE Demo Account • Immediate Read/Write Access
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------- */}
      {/* FOOTER                                                              */}
      {/* ------------------------------------------------------------------- */}
      <footer className="py-12 bg-white dark:bg-[#080C14] border-t border-slate-200 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span className="font-bold text-slate-900 dark:text-white text-sm">GraphSentinel AI</span>
              <span className="text-slate-500 dark:text-slate-400">— See the Impact. Find the Cause.</span>
            </div>

            <div className="flex items-center gap-6 text-slate-600 dark:text-slate-400 text-xs">
              <a href="#capabilities" className="hover:text-indigo-600 dark:hover:text-slate-200 transition-colors">
                Capabilities
              </a>
              <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-slate-200 transition-colors">
                How It Works
              </a>
              <a href="#architecture" className="hover:text-indigo-600 dark:hover:text-slate-200 transition-colors">
                Architecture
              </a>
              <a
                href="https://github.com/Manjeet077283/GraphSentinel-AI"
                target="_blank"
                rel="noreferrer"
                className="hover:text-indigo-600 dark:hover:text-cyan-400 flex items-center gap-1 transition-colors"
              >
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-400">
            <div>
              Built for modern Site Reliability Engineering • FalkorDB Cloud Graph Engine
            </div>
            <div>
              Production Release • Verified Zero-Hallucination Graph Intelligence
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
