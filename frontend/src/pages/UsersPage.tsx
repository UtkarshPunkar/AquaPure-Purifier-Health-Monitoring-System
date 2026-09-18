import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../api/client';
import { UserItem, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import {
  Users,
  UserPlus,
  Shield,
  ShieldCheck,
  Wrench,
  Eye,
  CheckCircle2,
  XCircle,
  Edit2,
  Trash2,
  X,
  Search,
  KeyRound,
  Crown,
  Lock,
  Sparkles,
  AlertCircle,
} from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const isTechHead = currentUser?.role === 'TECHNICAL_HEAD' || currentUser?.email?.toLowerCase() === 'utkarshpunkar7@gmail.com';

  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'VIEWER' as UserRole,
    status: 'ACTIVE',
    password: '',
  });

  const fetchUsers = async () => {
    if (!isTechHead) return;
    try {
      setIsLoading(true);
      const data = await api.getUsers();
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isTechHead) {
      fetchUsers();
    }
  }, [isTechHead]);

  if (!isTechHead) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6 space-y-4 animate-fade-in">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center shadow-lg border border-rose-200 dark:border-rose-900">
          <Lock size={32} />
        </div>
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white">
          Access Restricted to Technical Head
        </h2>
        <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md leading-relaxed">
          Only the designated Technical Head (Utkarsh Punkar) has authorization to view and manage users, staff profiles, and the Role-Based Access Control (RBAC) Matrix.
        </p>
      </div>
    );
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.createUser(formData);
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        email: '',
        role: 'VIEWER',
        status: 'ACTIVE',
        password: '',
      });
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create user');
    }
  };

  const [editUserPassword, setEditUserPassword] = useState('');

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      const payload: any = {
        name: editingUser.name,
        role: editingUser.role,
        status: editingUser.status,
      };
      if (editUserPassword.trim().length >= 4) {
        payload.password = editUserPassword.trim();
      }
      await api.updateUser(editingUser.id, payload);
      setEditingUser(null);
      setEditUserPassword('');
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to remove user "${name}" from the AquaPure system?`)) {
      try {
        await api.deleteUser(id);
        await fetchUsers();
      } catch (err: any) {
        alert(err.response?.data?.error || 'Failed to delete user');
      }
    }
  };

  const handleToggleStatus = async (user: UserItem) => {
    if (!isTechHead) {
      alert('Only Technical Head (Utkarsh Punkar) has authorization to change account status.');
      return;
    }
    try {
      const newStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await api.updateUser(user.id, { status: newStatus });
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to toggle status');
    }
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.toLowerCase().includes(q);
  });

  const roleBadge = (role: UserRole, email?: string) => {
    if (email === 'utkarshpunkar7@gmail.com' || role === 'TECHNICAL_HEAD') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-gradient-to-r from-sky-500/20 to-blue-500/20 text-sky-600 dark:text-[#00E5FF] border border-sky-400/40 shadow-xs flex items-center gap-1 w-fit">
          <Crown size={12} className="text-amber-400" /> Technical Head
        </span>
      );
    }

    switch (role) {
      case 'ADMIN':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1 w-fit">
            <Shield size={11} /> Administrator
          </span>
        );
      case 'MAINTENANCE_STAFF':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1 w-fit">
            <Wrench size={11} /> Maintenance Staff
          </span>
        );
      case 'VIEWER':
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center gap-1 w-fit">
            <Eye size={11} /> Viewer (User)
          </span>
        );
    }
  };

  // Permission Matrix Definition
  const permissionsMatrix = [
    { feature: 'View Live Dashboard & Status', tech: true, admin: true, viewer: true },
    { feature: 'Purifier Fleet Management (View)', tech: true, admin: true, viewer: true },
    { feature: 'Water Quality Telemetry & Trends', tech: true, admin: true, viewer: true },
    { feature: 'Filter Health & ML Predictions', tech: true, admin: true, viewer: true },
    { feature: 'Generate Compliance & PDF Reports', tech: true, admin: true, viewer: true },
    { feature: 'AI Vision Frame Scans & Solenoid Controls', tech: true, admin: true, viewer: false },
    { feature: 'Dispatch Maintenance Tickets & Work Orders', tech: true, admin: true, viewer: false },
    { feature: 'Acknowledge & Resolve Sensor Breaches', tech: true, admin: true, viewer: false },
    { feature: 'Assign User Roles & Promote Accounts (RBAC)', tech: true, admin: false, viewer: false },
    { feature: 'Configure System Threshold Limits & Rules', tech: true, admin: false, viewer: false },
    { feature: 'Delete Users & Control Root Security', tech: true, admin: false, viewer: false },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
              User & Role Management
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manage user accounts, assign roles, and configure system permissions.
          </p>
        </div>

        {isTechHead && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-sky-600/20 transition-all self-start sm:self-auto cursor-pointer"
          >
            <UserPlus size={15} />
            <span>+ Add New User</span>
          </button>
        )}
      </div>

      {/* 2. User Table & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden space-y-3">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search user by name, email or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-slate-400">
              {filteredUsers.length} total users registered
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {filteredUsers.map((u) => {
                const isActive = u.status === 'ACTIVE';
                const isRootHead = u.email === 'utkarshpunkar7@gmail.com' || u.role === 'TECHNICAL_HEAD';

                return (
                  <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                          isRootHead 
                            ? 'bg-gradient-to-tr from-sky-500 to-blue-600 text-white shadow-sm shadow-sky-500/30'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                        }`}>
                          {u.name.charAt(0)}
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span>{u.name}</span>
                          {isRootHead && <Crown size={13} className="text-amber-400" />}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4">
                      {roleBadge(u.role, u.email)}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(u)}
                        disabled={!isTechHead || isRootHead}
                        className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-all ${
                          isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 hover:bg-slate-200'
                        } ${(!isTechHead || isRootHead) ? 'opacity-80 cursor-default' : 'cursor-pointer'}`}
                        title={isTechHead ? 'Click to toggle status' : 'Managed by Technical Head'}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span>{isActive ? 'Active' : 'Inactive'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                      {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isTechHead ? (
                          <>
                            <button
                              onClick={() => setEditingUser(u)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-950 transition-colors cursor-pointer"
                              title="Assign Role & Manage"
                            >
                              <Edit2 size={14} />
                            </button>
                            {!isRootHead && (
                              <button
                                onClick={() => handleDeleteUser(u.id, u.name)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors cursor-pointer"
                                title="Delete User"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-400 flex items-center gap-1">
                            <Lock size={12} /> Read-only
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Role-Based Permissions Matrix */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <KeyRound size={16} className="text-sky-600 dark:text-sky-400" />
              Role-Based Access Control (RBAC) Matrix
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Definitive permission boundaries for Technical Head, Administrator, and Viewer tiers.
            </p>
          </div>
          <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400 font-semibold">
            Strict Multi-Tier Policy
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Platform Capability / Security Boundary</th>
                <th className="py-3 px-4 text-center">Technical Head (Utkarsh)</th>
                <th className="py-3 px-4 text-center">Administrator</th>
                <th className="py-3 px-4 text-center">Viewer (Default User)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
              {permissionsMatrix.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                    {p.feature}
                  </td>
                  <td className="py-3 px-4 text-center bg-sky-50/30 dark:bg-sky-950/20">
                    {p.tech ? (
                      <CheckCircle2 size={16} className="inline text-sky-600 dark:text-[#00E5FF]" />
                    ) : (
                      <XCircle size={16} className="inline text-slate-300 dark:text-slate-600" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.admin ? (
                      <CheckCircle2 size={16} className="inline text-emerald-500" />
                    ) : (
                      <XCircle size={16} className="inline text-slate-300 dark:text-slate-600" />
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {p.viewer ? (
                      <CheckCircle2 size={16} className="inline text-emerald-500" />
                    ) : (
                      <XCircle size={16} className="inline text-slate-300 dark:text-slate-600" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Add User Modal (Technical Head Only) */}
      {isAddModalOpen &&
        isTechHead &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <UserPlus size={16} className="text-sky-600 dark:text-sky-400" />
                  Register New User (Technical Controller)
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs font-sans">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Gayatri Borikar"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. user@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Initial Password *
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assign Role
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="VIEWER">Viewer (Default User)</option>
                      <option value="ADMIN">Administrator</option>
                      <option value="MAINTENANCE_STAFF">Maintenance Staff</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-semibold"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold cursor-pointer"
                  >
                    Create User
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* 6. Edit User Modal (Role Assignment by Technical Head) */}
      {editingUser &&
        isTechHead &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
            <div className="bg-white dark:bg-slate-900 max-w-md w-full p-6 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit2 size={16} className="text-sky-600 dark:text-sky-400" />
                  Assign Role & Manage User
                </h3>
                <button
                  onClick={() => setEditingUser(null)}
                  className="text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleUpdateUser} className="space-y-3.5 text-xs font-sans">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email (Read-only)
                  </label>
                  <input
                    type="email"
                    readOnly
                    value={editingUser.email}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-500 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Assign Role
                    </label>
                    <select
                      value={editingUser.role}
                      disabled={editingUser.email === 'utkarshpunkar7@gmail.com'}
                      onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value as UserRole })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="VIEWER">Viewer (User)</option>
                      <option value="ADMIN">Administrator</option>
                      <option value="MAINTENANCE_STAFF">Maintenance Staff</option>
                      {editingUser.email === 'utkarshpunkar7@gmail.com' && (
                        <option value="TECHNICAL_HEAD">Technical Head</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={editingUser.status}
                      disabled={editingUser.email === 'utkarshpunkar7@gmail.com'}
                      onChange={(e) => setEditingUser({ ...editingUser, status: e.target.value as 'ACTIVE' | 'INACTIVE' })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-bold"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="INACTIVE">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Reset User Password (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="Leave blank to keep unchanged, or enter new password"
                    value={editUserPassword}
                    onChange={(e) => setEditUserPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-mono"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingUser(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold cursor-pointer"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};

export default UsersPage;
