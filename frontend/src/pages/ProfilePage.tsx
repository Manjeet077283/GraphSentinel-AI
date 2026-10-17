import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Shield,
  Briefcase,
  Building,
  Globe,
  Clock,
  Lock,
  CheckCircle,
  AlertTriangle,
  Save,
  KeyRound,
  Bell
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage, SupportedLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

const TIMEZONES = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'Asia/Kolkata', label: 'Asia/Kolkata (IST, +05:30)' },
  { value: 'America/New_York', label: 'America/New_York (EST/EDT, -05:00)' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles (PST/PDT, -08:00)' },
  { value: 'Europe/London', label: 'Europe/London (GMT/BST, +00:00)' },
  { value: 'Europe/Berlin', label: 'Europe/Berlin (CET/CEST, +01:00)' },
  { value: 'Asia/Singapore', label: 'Asia/Singapore (SGT, +08:00)' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo (JST, +09:00)' },
];

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
];

export const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [displayName, setDisplayName] = useState(user?.display_name || user?.full_name || '');
  const [jobTitle, setJobTitle] = useState(user?.job_title || user?.role || 'Site Reliability Engineer');
  const [department, setDepartment] = useState(user?.department || 'Incident Operations');
  const [organization, setOrganization] = useState(user?.organization || 'Engineering');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [timeZone, setTimeZone] = useState(user?.time_zone || 'UTC');
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
    (user?.preferred_language as SupportedLanguage) || language
  );
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');

  // Notifications
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [criticalIncidentAlerts, setCriticalIncidentAlerts] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Status indicators
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null);
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null);

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || user.full_name || '');
      setJobTitle(user.job_title || user.role || 'Site Reliability Engineer');
      setDepartment(user.department || 'Incident Operations');
      setOrganization(user.organization || 'Engineering');
      setPhone(user.phone || '');
      setBio(user.bio || '');
      setTimeZone(user.time_zone || 'UTC');
      if (user.preferred_language) {
        setSelectedLanguage(user.preferred_language as SupportedLanguage);
      }
      setAvatarUrl(user.avatar_url || '');

      if (user.notification_preferences) {
        try {
          const parsed = typeof user.notification_preferences === 'string'
            ? JSON.parse(user.notification_preferences)
            : user.notification_preferences;
          if (parsed.email_alerts !== undefined) setEmailAlerts(parsed.email_alerts);
          if (parsed.critical_incident_alerts !== undefined) setCriticalIncidentAlerts(parsed.critical_incident_alerts);
          if (parsed.weekly_digest !== undefined) setWeeklyDigest(parsed.weekly_digest);
        } catch {
          // ignore
        }
      }
    }
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setProfileSuccessMsg(null);
    setProfileErrorMsg(null);

    try {
      const updated = await api.updateProfile({
        display_name: displayName,
        job_title: jobTitle,
        department,
        organization,
        phone,
        bio,
        time_zone: timeZone,
        preferred_language: selectedLanguage,
        avatar_url: avatarUrl,
        notification_preferences: {
          email_alerts: emailAlerts,
          critical_incident_alerts: criticalIncidentAlerts,
          weekly_digest: weeklyDigest,
        },
      });

      updateUser(updated);
      setLanguage(selectedLanguage);
      setProfileSuccessMsg('Your profile has been saved successfully.');
    } catch (err: any) {
      setProfileErrorMsg(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSuccessMsg(null);
    setPasswordErrorMsg(null);

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New password and confirmation do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordErrorMsg('Password must be at least 6 characters long.');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPasswordSuccessMsg('Your password has been changed securely.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordErrorMsg(err.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
          <User className="w-6 h-6 text-indigo-600" />
          User Profile & Account Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details, role, language preferences, notification settings, and account credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Avatar & Summary Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs text-center">
            <div className="relative inline-block mx-auto mb-3">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName || user?.full_name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-indigo-500 shadow-md mx-auto"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-bold text-3xl shadow-md mx-auto">
                  {(displayName || user?.full_name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <h2 className="text-base font-bold text-slate-900">{displayName || user?.full_name}</h2>
            <p className="text-xs text-slate-500">{user?.email}</p>

            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-semibold mt-2.5">
              <Shield className="w-3.5 h-3.5" />
              {user?.role || 'SRE Engineer'}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-left space-y-2 text-xs">
              <div className="flex justify-between py-1 text-slate-600">
                <span className="text-slate-400">Department:</span>
                <span className="font-medium text-slate-800">{department || 'Operations'}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span className="text-slate-400">Organization:</span>
                <span className="font-medium text-slate-800">{organization || 'Platform'}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span className="text-slate-400">Time Zone:</span>
                <span className="font-medium text-slate-800">{timeZone}</span>
              </div>
              <div className="flex justify-between py-1 text-slate-600">
                <span className="text-slate-400">Language:</span>
                <span className="font-semibold text-indigo-600 uppercase">
                  {selectedLanguage}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 text-left">
              <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                Choose Preset Avatar
              </label>
              <div className="flex items-center justify-center gap-2">
                {PRESET_AVATARS.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(url)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 transition-all ${
                      avatarUrl === url ? 'border-indigo-600 ring-2 ring-indigo-200 scale-105' : 'border-slate-200 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={url} alt={`Avatar ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-4 text-xs text-indigo-900 space-y-2">
            <h3 className="font-bold flex items-center gap-1.5 text-indigo-950">
              <Shield className="w-4 h-4 text-indigo-600" />
              Role & Permissions
            </h3>
            <p className="text-indigo-800 leading-relaxed text-[11px]">
              Your account has full investigator permissions on the <strong>graphsentinel-ai</strong> FalkorDB database, dataset imports, and AI solution generation.
            </p>
          </div>
        </div>

        {/* Right Columns: Edit Profile & Password Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Form */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-indigo-600" />
              Personal Details & Preferences
            </h2>

            {profileSuccessMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{profileSuccessMsg}</span>
              </div>
            )}
            {profileErrorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{profileErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900"
                    placeholder="e.g. Priya Sharma"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed"
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Job Title / Role
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={jobTitle}
                      onChange={(e) => setJobTitle(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900"
                      placeholder="e.g. Lead SRE Engineer"
                    />
                    <Briefcase className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Department / Team
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900"
                      placeholder="e.g. Platform Reliability"
                    />
                    <Building className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900"
                    placeholder="e.g. Cloud Infrastructure"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phone / Emergency Contact
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900"
                    placeholder="e.g. +91 98765 43210"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Preferred AI & Platform Language
                  </label>
                  <div className="relative">
                    <select
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value as SupportedLanguage)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 bg-white"
                    >
                      <option value="en">English (Default)</option>
                      <option value="hi">हिन्दी (Hindi)</option>
                      <option value="hinglish">Hinglish (Hybrid Technical)</option>
                    </select>
                    <Globe className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    AI responses will explain causes and solutions in this language.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Time Zone
                  </label>
                  <div className="relative">
                    <select
                      value={timeZone}
                      onChange={(e) => setTimeZone(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900 bg-white"
                    >
                      {TIMEZONES.map((tz) => (
                        <option key={tz.value} value={tz.value}>
                          {tz.label}
                        </option>
                      ))}
                    </select>
                    <Clock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Bio / Responsibilities
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900"
                  placeholder="Tell your team about your operational scope and on-call responsibilities..."
                />
              </div>

              {/* Notification Preferences */}
              <div className="pt-3 border-t border-slate-100">
                <h3 className="font-semibold text-slate-800 mb-2 flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-indigo-600" />
                  Notification Preferences
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700">Email Alerts</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={criticalIncidentAlerts}
                      onChange={(e) => setCriticalIncidentAlerts(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700">P1/P2 Critical Alerts</span>
                  </label>
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 cursor-pointer hover:bg-slate-50">
                    <input
                      type="checkbox"
                      checked={weeklyDigest}
                      onChange={(e) => setWeeklyDigest(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-[11px] font-medium text-slate-700">Weekly Health Digest</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSavingProfile ? 'Saving Changes...' : 'Save Profile Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Change Password Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
              <KeyRound className="w-4 h-4 text-indigo-600" />
              Change Password & Security
            </h2>

            {passwordSuccessMsg && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}
            {passwordErrorMsg && (
              <div className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900"
                    placeholder="Enter current password"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900"
                      placeholder="Minimum 6 characters"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900"
                      placeholder="Re-enter new password"
                    />
                    <KeyRound className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  {isChangingPassword ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
