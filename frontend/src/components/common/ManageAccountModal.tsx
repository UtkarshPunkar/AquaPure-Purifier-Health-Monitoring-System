import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  KeyRound,
  ShieldCheck,
  User,
  Mail,
  Building2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Copy,
  Check,
  Save,
  Key,
  Crown,
  AlertTriangle,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface ManageAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ManageAccountModal: React.FC<ManageAccountModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, changePassword } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'credentials' | 'api'>('profile');

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [organization, setOrganization] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state when modal opens or user changes
  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setEmail(user.email || '');
      setOrganization(user.organization?.name || 'S.B. Jain Institute of Technology And Research');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMessage(null);
      setErrorMessage(null);
    }
  }, [user, isOpen]);

  if (!isOpen) return null;

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText('aquapure_iot_live_sec_token_983742');
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    setIsLoading(true);

    try {
      if (activeTab === 'profile') {
        if (!name.trim()) {
          setErrorMessage('Full name cannot be empty');
          setIsLoading(false);
          return;
        }
        await updateProfile(name.trim(), organization.trim());
        setSuccessMessage('Profile details updated successfully!');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else if (activeTab === 'credentials') {
        if (!newPassword || newPassword.length < 5) {
          setErrorMessage('New password must be at least 5 characters long');
          setIsLoading(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          setErrorMessage('New passwords do not match');
          setIsLoading(false);
          return;
        }
        await changePassword(newPassword, currentPassword);
        setSuccessMessage('Account password updated successfully!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.error || 'Failed to save changes. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadge = (role?: string) => {
    switch (role) {
      case 'TECHNICAL_HEAD':
        return {
          label: 'Technical Head (Lead Architect)',
          color: 'bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-[#00E5FF] border-sky-300 dark:border-sky-800',
          icon: Crown,
        };
      case 'ADMIN':
        return {
          label: 'Campus Administrator',
          color: 'bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-800',
          icon: ShieldCheck,
        };
      case 'MAINTENANCE_STAFF':
        return {
          label: 'Maintenance Staff',
          color: 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800',
          icon: KeyRound,
        };
      default:
        return {
          label: 'Campus Viewer',
          color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700',
          icon: User,
        };
    }
  };

  const roleInfo = getRoleBadge(user?.role);
  const RoleIcon = roleInfo.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 max-w-lg w-full rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-scale-up">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#00E5FF] to-sky-600 text-slate-950 flex items-center justify-center shrink-0 shadow-md shadow-sky-500/20 font-bold">
              <User size={20} className="stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                Manage Account &amp; Credentials
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {user?.email || 'utkarshpunkar7@gmail.com'} &bull; {roleInfo.label}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-5 pt-3 gap-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setActiveTab('profile');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'border-[#00E5FF] text-[#0288D1] dark:text-[#00E5FF] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Profile Details
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('credentials');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'credentials'
                ? 'border-[#00E5FF] text-[#0288D1] dark:text-[#00E5FF] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Security &amp; Passwords
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('api');
              setErrorMessage(null);
              setSuccessMessage(null);
            }}
            className={`pb-2.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'api'
                ? 'border-[#00E5FF] text-[#0288D1] dark:text-[#00E5FF] font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            IoT Ingestion Key
          </button>
        </div>

        {/* Alerts */}
        <div className="px-5 pt-3">
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 animate-shake">
              <AlertTriangle size={16} className="shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
          {activeTab === 'profile' && (
            <div className="space-y-3.5 animate-fade-in">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/40 focus:border-[#00E5FF] transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    readOnly
                    value={email}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-mono cursor-not-allowed"
                  />
                </div>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Email is locked to your verified account. Contact Technical Head to change login email.
                </span>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Campus Organization
                </label>
                <div className="relative">
                  <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/40 focus:border-[#00E5FF] transition-all"
                  />
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${roleInfo.color}`}>
                <div className="flex items-center gap-2.5">
                  <RoleIcon size={18} className="shrink-0" />
                  <div>
                    <span className="font-bold block leading-tight">
                      Role: {roleInfo.label}
                    </span>
                    <span className="text-[10px] opacity-80">
                      Status: <strong className="uppercase">{user?.status || 'ACTIVE'}</strong>
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/50 dark:bg-black/30 font-bold">
                  Verified ID
                </span>
              </div>
            </div>
          )}

          {activeTab === 'credentials' && (
            <div className="space-y-3.5 animate-fade-in">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Current Password (Optional if newly logged in)
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    placeholder="Enter current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/40 focus:border-[#00E5FF] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showCurrentPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter new strong password (min 5 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/40 focus:border-[#00E5FF] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00E5FF]/40 focus:border-[#00E5FF] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="space-y-3.5 animate-fade-in">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Key size={15} className="text-[#00E5FF]" />
                    Pico W REST Telemetry Bearer Key
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold">
                    Active
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value="aquapure_iot_live_sec_token_983742"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-mono text-xs font-semibold"
                  />
                  <button
                    type="button"
                    onClick={handleCopyApiKey}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] to-sky-600 hover:from-sky-400 hover:to-sky-700 text-slate-950 font-bold transition-all shrink-0 cursor-pointer shadow-sm"
                    title="Copy API Key"
                  >
                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  Use this authorization bearer token in your MicroPython `main.py` script on the Raspberry Pi Pico W for secure telemetry transmission.
                </p>
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Close
            </button>

            {activeTab !== 'api' && (
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00E5FF] via-[#29B6F6] to-[#0288D1] hover:from-[#29B6F6] hover:to-[#01579B] text-slate-950 font-black flex items-center gap-2 shadow-md shadow-sky-500/20 hover:shadow-lg transition-all cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <RefreshCw size={14} className="animate-spin" />
                ) : (
                  <Save size={14} />
                )}
                <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
