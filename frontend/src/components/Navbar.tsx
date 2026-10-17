import React, { useEffect, useState, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
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
  Globe
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage, SupportedLanguage } from '../context/LanguageContext';
import { GlobalSearchResultItem } from '../types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
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
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = setTimeout(async () => {
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
    navigate(url);
  };

  const handleConfirmLogout = async () => {
    setShowLogoutModal(false);
    await logout();
    navigate('/login');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
      isActive
        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200/80 shadow-xs'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo & Brand */}
            <div className="flex items-center gap-3 shrink-0">
              <NavLink to="/" className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-center p-1 group-hover:border-indigo-300 transition-colors">
                  <img
                    src="/assets/logo.png"
                    alt="GraphSentinel AI"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback');
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <ShieldAlert className="logo-fallback w-5 h-5 text-indigo-600 hidden" />

                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-base tracking-tight text-slate-900 font-sans">
                      GraphSentinel<span className="text-indigo-600"> AI</span>
                    </span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold tracking-wider">
                      FalkorDB
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-normal leading-none hidden sm:block">
                    See the Impact. Find the Cause.
                  </p>
                </div>
              </NavLink>
            </div>

            {/* Navigation Links (9 Platform Items) */}
            <nav className="hidden xl:flex items-center gap-0.5">
              <NavLink to="/" className={navLinkClass}>
                <LayoutDashboard className="w-3.5 h-3.5" />
                {t('nav.dashboard')}
              </NavLink>
              <NavLink to="/incidents" className={navLinkClass}>
                <AlertOctagon className="w-3.5 h-3.5" />
                {t('nav.incidents')}
              </NavLink>
              <NavLink to="/services" className={navLinkClass}>
                <Server className="w-3.5 h-3.5" />
                {t('nav.services')}
              </NavLink>
              <NavLink to="/graph" className={navLinkClass}>
                <Share2 className="w-3.5 h-3.5" />
                {t('nav.graph')}
              </NavLink>
              <NavLink to="/data" className={navLinkClass}>
                <UploadCloud className="w-3.5 h-3.5" />
                {t('nav.data_workspace')}
              </NavLink>
              <NavLink to="/chat" className={navLinkClass}>
                <BotMessageSquare className="w-3.5 h-3.5" />
                {t('nav.ai_agent')}
              </NavLink>
              <NavLink to="/history" className={navLinkClass}>
                <History className="w-3.5 h-3.5" />
                {t('nav.history')}
              </NavLink>
              <NavLink to="/profile" className={navLinkClass}>
                <User className="w-3.5 h-3.5" />
                {t('nav.profile')}
              </NavLink>
              <NavLink to="/settings" className={navLinkClass}>
                <Settings className="w-3.5 h-3.5" />
                {t('nav.settings')}
              </NavLink>
            </nav>

            {/* Global Search Bar */}
            <div className="flex-1 max-w-xs md:max-w-sm relative" ref={searchRef}>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Search className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchDropdown(true);
                  }}
                  onFocus={() => setShowSearchDropdown(true)}
                  placeholder="Search services, incidents, or graph..."
                  className="w-full pl-9 pr-8 py-1.5 text-xs bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 rounded-lg text-slate-900 transition-colors placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {/* Search Dropdown Results */}
              {showSearchDropdown && searchQuery.trim() && (
                <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden text-xs max-h-80 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-4 text-center text-slate-500">Searching graph topology...</div>
                  ) : searchResults.length > 0 ? (
                    <div className="divide-y divide-slate-100">
                      <div className="px-3 py-1.5 bg-slate-50 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                        Matching Results ({searchResults.length})
                      </div>
                      {searchResults.map((item) => (
                        <div
                          key={`${item.type}-${item.id}`}
                          onClick={() => handleSelectResult(item.url)}
                          className="px-3 py-2.5 hover:bg-indigo-50/60 cursor-pointer transition-colors flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-semibold ${
                                  item.type === 'service'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {item.type.toUpperCase()}
                              </span>
                              <span className="font-semibold text-slate-900 truncate">{item.title}</span>
                            </div>
                            <p className="text-[11px] text-slate-500 truncate">{item.subtitle}</p>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-slate-500">
                      No matching services or incidents found.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Indicators & User Profile */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Language Selector Dropdown */}
              <div className="relative" ref={langRef}>
                <button
                  type="button"
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs text-slate-700 font-medium transition-colors"
                  title="Switch Language (English / Hindi / Hinglish)"
                  aria-expanded={showLangMenu}
                >
                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-semibold text-[11px] uppercase tracking-wide">
                    {language === 'hi' ? 'हिन्दी' : language === 'hinglish' ? 'Hinglish' : 'EN'}
                  </span>
                </button>

                {showLangMenu && (
                  <div className="absolute right-0 mt-2 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setLanguage('en');
                        setShowLangMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                        language === 'en' ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-700'
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
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                        language === 'hi' ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-700'
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
                      className={`w-full flex items-center justify-between px-3 py-2 text-left hover:bg-slate-50 transition-colors ${
                        language === 'hinglish' ? 'text-indigo-600 font-semibold bg-indigo-50/50' : 'text-slate-700'
                      }`}
                    >
                      <span>Hinglish</span>
                      <span className="text-[10px] text-slate-400">Mix</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Database Status Badge */}
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50 text-xs text-slate-700 font-medium"
                title={`${dbTarget} ${dbConnected ? 'Online' : 'Offline'}`}
              >
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span className="hidden xl:inline">{dbTarget}:</span>
                {dbConnected === null ? (
                  <span className="text-slate-400 text-[11px]">Connecting...</span>
                ) : dbConnected ? (
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-600 font-semibold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-red-500" />
                    Offline
                  </span>
                )}
              </div>

              {/* User Profile Button & Dropdown */}
              <div className="relative" ref={profileRef}>
                <button
                  type="button"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition-colors border border-transparent hover:border-slate-200 text-left"
                  aria-expanded={showProfileMenu}
                  aria-haspopup="true"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {userInitials}
                  </div>
                  <div className="hidden md:block leading-tight pr-1">
                    <p className="text-xs font-semibold text-slate-900 truncate max-w-[120px]">
                      {user?.full_name || 'SRE Engineer'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate max-w-[120px]">
                      {user?.role || 'Incident Commander'}
                    </p>
                  </div>
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-50 text-xs">
                    <div className="px-3.5 py-2.5 border-b border-slate-100">
                      <p className="font-semibold text-slate-900">{user?.full_name}</p>
                      <p className="text-slate-500 text-[11px] truncate">{user?.email}</p>
                      <span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {user?.role}
                      </span>
                    </div>

                    <div className="py-1">
                      <NavLink
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <User className="w-3.5 h-3.5 text-slate-500" />
                        {t('nav.profile')} & Account
                      </NavLink>
                      <NavLink
                        to="/data"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <UploadCloud className="w-3.5 h-3.5 text-slate-500" />
                        {t('nav.data_workspace')}
                      </NavLink>
                      <NavLink
                        to="/history"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <History className="w-3.5 h-3.5 text-slate-500" />
                        {t('nav.history')}
                      </NavLink>
                      <NavLink
                        to="/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5 text-slate-500" />
                        {t('nav.settings')} & Diagnostics
                      </NavLink>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowLogoutModal(true);
                        }}
                        className="w-full flex items-center gap-2 px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition-colors font-medium text-left"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        {t('action.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xl max-w-sm w-full p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-50 border border-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-1">Confirm Sign Out</h3>
            <p className="text-xs text-slate-600 mb-5">
              Are you sure you want to end your active investigation session? You will need to log in again to access incident workflows.
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowLogoutModal(false)}
                className="flex-1 py-2 px-3 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmLogout}
                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 rounded-lg text-xs font-semibold text-white transition-colors shadow-xs"
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
