import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  AlertOctagon,
  Server,
  Share2,
  BotMessageSquare,
  Settings,
  Database,
  Search,
  User,
  LogOut,
  X,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
  UploadCloud,
  History,
  Globe,
  Menu,
  Home,
  Sun,
  Moon
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { GlobalSearchResultItem } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [dbConnected, setDbConnected] = useState<boolean | null>(null);
  const [dbTarget, setDbTarget] = useState<string>('Local FalkorDB');

  // Search states
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<GlobalSearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Profile menu states
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);
  const [showLogoutModal, setShowLogoutModal] = useState<boolean>(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Language dropdown state
  const [showLangMenu, setShowLangMenu] = useState<boolean>(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Mobile navigation drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  useEffect(() => {
    api.getHealth()
      .then((h) => {
        setDbConnected(h.database.connected);
        if (h.database.target.includes('cloud') || h.database.target.includes('falkordb.com')) {
          setDbTarget('FalkorDB Cloud');
        } else {
          setDbTarget('Local FalkorDB');
        }
      })
      .catch(() => {
        setDbConnected(false);
      });
  }, []);

  // Global search debouncing
  useEffect(() => {
    const trimmed = searchQuery.trim();
    if (!trimmed) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.globalSearch(trimmed);
        setSearchResults(res.results);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (langRef.current && !langRef.current.contains(event.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectResult = (url: string) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    setSearchResults([]);
    setMobileMenuOpen(false);
    navigate(url);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 shadow-xs font-semibold dark:bg-cyan-950/70 dark:text-cyan-300 dark:border-cyan-500/40'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold dark:bg-cyan-950/70 dark:text-cyan-300 dark:border-cyan-500/40'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800/60'
    }`;

  const userInitials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : 'SR';

  return (
    <>
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md sticky top-0 z-40 transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2 shrink-0">
              <Link to="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 dark:bg-cyan-950/60 dark:border-cyan-500/40 flex items-center justify-center p-1 group-hover:border-indigo-400 dark:group-hover:border-cyan-400 transition-colors shadow-xs">
                  <ShieldAlert className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white font-sans">
                      GraphSentinel<span className="text-indigo-600 dark:text-cyan-400"> AI</span>
                    </span>
                    <span className="text-[9px] uppercase font-mono px-1 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-800/60 font-semibold tracking-wider">
                      FalkorDB
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center gap-1">
              <NavLink to="/dashboard" className={navLinkClass}>
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/incidents" className={navLinkClass}>
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Incidents</span>
              </NavLink>
              <NavLink to="/services" className={navLinkClass}>
                <Server className="w-3.5 h-3.5" />
                <span>Services</span>
              </NavLink>
              <NavLink to="/graph" className={navLinkClass}>
                <Share2 className="w-3.5 h-3.5" />
                <span>Graph</span>
              </NavLink>
              <NavLink to="/data" className={navLinkClass}>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Data</span>
              </NavLink>
              <NavLink to="/chat" className={navLinkClass}>
                <BotMessageSquare className="w-3.5 h-3.5" />
                <span>AI Copilot</span>
              </NavLink>
              <NavLink to="/history" className={navLinkClass}>
                <History className="w-3.5 h-3.5" />
                <span>History</span>
              </NavLink>
              <NavLink to="/settings" className={navLinkClass}>
                <Settings className="w-3.5 h-3.5" />
                <span>Settings</span>
              </NavLink>
            </nav>

            {/* Global Search Bar */}
            <div className="hidden sm:block flex-1 max-w-xs relative" ref={searchRef}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 dark:text-slate-500">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    const val = e.target.value;
                    setSearchQuery(val);
                    if (!val.trim()) {
                      setSearchResults([]);
                    }
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  placeholder="Search incidents or services..."
                  className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-slate-100 focus:bg-white dark:bg-[#0E1524] dark:hover:bg-[#131E32] dark:focus:bg-[#131E32] border border-slate-200 focus:border-indigo-500 dark:border-slate-700/80 dark:focus:border-cyan-500 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors focus:outline-hidden"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>

              {/* Search Dropdown Results */}
              {showSearchDropdown && searchQuery.trim() && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xl z-50 overflow-hidden text-xs max-h-80 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-slate-500 dark:text-slate-400">Searching graph topology...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                      <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/80 text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Matching Results ({searchResults.length})
                      </div>
                      {searchResults.map((item) => (
                        <div
                          key={`${item.type}-${item.id}`}
                          onClick={() => handleSelectResult(item.url)}
                          className="px-3 py-2.5 hover:bg-slate-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                  item.type === 'service'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/80 dark:text-blue-300 dark:border-blue-800'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-800'
                                }`}
                              >
                                {item.type.toUpperCase()}
                              </span>
                              <span className="font-semibold text-slate-900 dark:text-white truncate">
                                {item.title}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-500 dark:text-slate-400">
                      No matching services or incidents found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Indicators, Theme Toggle & User Profile */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Back to Public Landing Page Link */}
              <Link
                to="/"
                className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs text-slate-700 font-medium dark:border-slate-700/60 dark:bg-[#0E1524] dark:hover:bg-[#131E32] dark:text-slate-300 transition-colors"
                title="View Public Product Landing Page"
              >
                <Home className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                <span className="text-[11px]">Home</span>
              </Link>

              {/* Light / Dark Mode Toggle */}
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

              {/* Language Selector Dropdown */}
              <div className="relative" ref={langRef}>
                <button
                  type="button"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs text-slate-700 font-medium dark:border-slate-700/60 dark:bg-[#0E1524] dark:hover:bg-[#131E32] dark:text-slate-300 transition-colors"
                  title="Switch Language"
                  aria-expanded={showLangMenu}
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                  <span className="font-semibold text-[10px] uppercase">
                    {language === 'hi' ? 'HI' : language === 'hinglish' ? 'MIX' : 'EN'}
                  </span>
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xl py-1 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('en');
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                        language === 'en'
                          ? 'text-indigo-600 dark:text-cyan-400 font-semibold bg-indigo-50/50 dark:bg-cyan-950/40'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>English</span>
                      <span className="text-[10px] text-slate-400">EN</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('hi');
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                        language === 'hi'
                          ? 'text-indigo-600 dark:text-cyan-400 font-semibold bg-indigo-50/50 dark:bg-cyan-950/40'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>हिन्दी</span>
                      <span className="text-[10px] text-slate-400">HI</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('hinglish');
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                        language === 'hinglish'
                          ? 'text-indigo-600 dark:text-cyan-400 font-semibold bg-indigo-50/50 dark:bg-cyan-950/40'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span>Hinglish</span>
                      <span className="text-[10px] text-slate-400">MIX</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Database Status Badge */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 font-medium dark:border-slate-700/60 dark:bg-[#0E1524] dark:text-slate-300"
                title={`${dbTarget} ${dbConnected ? 'Online' : 'Offline'}`}
              >
                <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                {dbConnected === null ? (
                  <span className="text-slate-400 text-[10px]">Connecting...</span>
                ) : dbConnected ? (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Cloud
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold text-[10px]">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Offline
                  </span>
                )}
              </div>

              {/* User Profile Button & Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700 text-left"
                  aria-expanded={showProfileMenu}
                  aria-haspopup="true"
                >
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white dark:bg-cyan-500 dark:text-slate-950 flex items-center justify-center font-bold text-xs shadow-xs">
                    {userInitials}
                  </div>
                  <div className="hidden xl:block leading-tight pr-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate max-w-[100px]">
                      {user?.full_name || 'SRE'}
                    </p>
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0E1524] border border-slate-200 dark:border-slate-700/80 rounded-xl shadow-xl py-1.5 z-50 text-xs">
                    <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800">
                      <p className="font-semibold text-slate-900 dark:text-white">{user?.full_name}</p>
                      <p className="text-slate-500 dark:text-slate-400 text-[11px] truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-cyan-950/80 dark:text-cyan-300 dark:border-cyan-800/60">
                        {user?.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <NavLink
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Account Profile
                      </NavLink>
                      <NavLink
                        to="/data"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-slate-400" />
                        Data Workspace
                      </NavLink>
                      <NavLink
                        to="/history"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                      >
                        <History className="w-3.5 h-3.5 text-slate-400" />
                        Investigation History
                      </NavLink>
                      <NavLink
                        to="/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-400" />
                        Settings & Diagnostics
                      </NavLink>
                    </div>

                    <div className="border-t border-slate-100 dark:border-slate-800 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors font-medium text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Hamburger Menu Toggle */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="lg:hidden p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/60 transition-colors"
                aria-label="Toggle Mobile Navigation"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0E1524] px-4 pt-3 pb-5 space-y-2">
            <NavLink
              to="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>Dashboard</span>
            </NavLink>
            <NavLink
              to="/incidents"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Incidents</span>
            </NavLink>
            <NavLink
              to="/services"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <Server className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Services</span>
            </NavLink>
            <NavLink
              to="/graph"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <Share2 className="w-4 h-4 text-indigo-600 dark:text-cyan-400" />
              <span>Graph Explorer</span>
            </NavLink>
            <NavLink
              to="/data"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <UploadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Data Workspace</span>
            </NavLink>
            <NavLink
              to="/chat"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <BotMessageSquare className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>AI Copilot</span>
            </NavLink>
            <NavLink
              to="/history"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <History className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>History</span>
            </NavLink>
            <NavLink
              to="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Profile</span>
            </NavLink>
            <NavLink
              to="/settings"
              onClick={() => setMobileMenuOpen(false)}
              className={mobileNavLinkClass}
            >
              <Settings className="w-4 h-4 text-slate-400" />
              <span>Settings</span>
            </NavLink>

            {/* Mobile Drawer Actions: Theme Toggle, Home Link, Sign Out */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300"
              >
                {isDark ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span>Light Mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Dark Mode</span>
                  </>
                )}
              </button>

              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-cyan-400 font-medium py-1"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Public Home</span>
              </Link>

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setShowLogoutModal(true);
                }}
                className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium py-1"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        )}
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white dark:bg-[#0E1524] rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl max-w-sm w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-800/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">Confirm Sign Out</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Are you sure you want to end your active investigation session? You will need to sign in again to access incident workflows.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2.5 px-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2.5 px-3 bg-rose-600 hover:bg-rose-500 rounded-xl text-xs font-semibold text-white transition-colors shadow-xs"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
