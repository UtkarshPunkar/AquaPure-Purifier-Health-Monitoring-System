import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useTelemetry } from '../context/TelemetryContext';
import { PurifierCard } from '../components/purifier/PurifierCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Link, useNavigate } from 'react-router-dom';
import {
  Droplets,
  Search,
  LayoutGrid,
  List,
  ArrowRight,
  RefreshCw,
  Plus,
  RotateCcw,
  Building2,
  SlidersHorizontal,
  X,
  CheckCircle2,
} from 'lucide-react';
import { Purifier } from '../types';

export const PurifiersPage: React.FC = () => {
  const { purifiers, refreshData } = useTelemetry();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [buildingFilter, setBuildingFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Purifier Form State
  const [newPurifier, setNewPurifier] = useState({
    code: '',
    name: '',
    building: 'EMTech Dept',
    floor: '2nd Floor',
    location: '',
    modelType: 'Commercial Multi-Stage RO + UV',
  });
  const [addSuccess, setAddSuccess] = useState(false);

  // Extract unique buildings for dropdown
  const uniqueBuildings = useMemo(() => {
    const bSet = new Set<string>();
    purifiers.forEach((p) => {
      if (p.building) bSet.add(p.building);
    });
    return Array.from(bSet);
  }, [purifiers]);

  // Functional filtering
  const filtered = useMemo(() => {
    return purifiers.filter((p) => {
      const q = search.toLowerCase();
      const matchesSearch =
        p.purifierCode.toLowerCase().includes(q) ||
        p.name.toLowerCase().includes(q) ||
        p.location.toLowerCase().includes(q) ||
        p.building.toLowerCase().includes(q) ||
        p.floor.toLowerCase().includes(q);

      let matchesStatus = true;
      if (statusFilter === 'ONLINE') {
        matchesStatus = p.status !== 'OFFLINE' && p.status !== 'INACTIVE';
      } else if (statusFilter === 'OFFLINE') {
        matchesStatus = p.status === 'OFFLINE' || p.status === 'INACTIVE';
      } else if (statusFilter === 'SAFE') {
        matchesStatus = p.status === 'HEALTHY' || p.status === 'ACTIVE';
      } else if (statusFilter === 'WARNING') {
        matchesStatus = p.status === 'WARNING';
      } else if (statusFilter === 'CRITICAL') {
        matchesStatus = p.status === 'CRITICAL';
      }

      const matchesBuilding = buildingFilter === 'ALL' || p.building === buildingFilter;

      return matchesSearch && matchesStatus && matchesBuilding;
    });
  }, [purifiers, search, statusFilter, buildingFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setBuildingFilter('ALL');
  };

  const handleAddPurifierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPurifier.code || !newPurifier.name) return;

    // Simulate adding purifier
    setAddSuccess(true);
    setTimeout(() => {
      setAddSuccess(false);
      setIsAddModalOpen(false);
      setNewPurifier({
        code: '',
        name: '',
        building: 'EMTech Dept',
        floor: '2nd Floor',
        location: '',
        modelType: 'Commercial Multi-Stage RO + UV',
      });
      refreshData();
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Purifier Fleet Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time status, health metrics, and telemetry across all installed purification systems.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshData()}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            title="Refresh purifiers"
          >
            <RefreshCw size={15} />
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm shadow-sky-600/20"
          >
            <Plus size={15} />
            <span>Add Purifier</span>
          </button>
        </div>
      </div>

      {/* Filter and View Toggle Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
          {/* Search Bar */}
          <div className="relative w-full md:w-80">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by ID, name, building, floor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto justify-between md:justify-end">
            {/* Building Dropdown */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Building2 size={14} className="text-slate-400" />
              <select
                value={buildingFilter}
                onChange={(e) => setBuildingFilter(e.target.value)}
                className="px-2.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white font-semibold focus:outline-none"
              >
                <option value="ALL">All Buildings</option>
                {uniqueBuildings.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            {/* Layout Toggle (Grid vs Table) */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Table View"
              >
                <List size={15} />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-slate-900 text-sky-600 dark:text-sky-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
                title="Grid View"
              >
                <LayoutGrid size={15} />
              </button>
            </div>

            {(search || statusFilter !== 'ALL' || buildingFilter !== 'ALL') && (
              <button
                onClick={handleResetFilters}
                className="px-2.5 py-2 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-1 transition-colors"
                title="Reset Filters"
              >
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 flex-wrap pt-2 border-t border-slate-100 dark:border-slate-800 text-xs font-semibold">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider mr-1">Status:</span>
          {[
            { id: 'ALL', label: 'All Units' },
            { id: 'ONLINE', label: 'Online' },
            { id: 'OFFLINE', label: 'Offline / Inactive' },
            { id: 'SAFE', label: 'Safe' },
            { id: 'WARNING', label: 'Warning' },
            { id: 'CRITICAL', label: 'Critical' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              className={`px-3 py-1 rounded-lg transition-all ${
                statusFilter === item.id
                  ? 'bg-sky-600 text-white shadow-xs font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {item.label}
            </button>
          ))}
          <span className="ml-auto text-slate-400 font-mono text-[11px]">
            Showing {filtered.length} of {purifiers.length} units
          </span>
        </div>
      </div>

      {/* Grid or Table Display */}
      {viewMode === 'table' ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Purifier ID</th>
                  <th className="py-3 px-4">Purifier Name</th>
                  <th className="py-3 px-4">Building</th>
                  <th className="py-3 px-4">Floor / Location</th>
                  <th className="py-3 px-4">Current Status</th>
                  <th className="py-3 px-4">Water Quality</th>
                  <th className="py-3 px-4 font-mono">Filter Health</th>
                  <th className="py-3 px-4">Last Updated</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                {filtered.map((p) => {
                  const filterHealth = p.filter?.healthScore ?? 80;
                  const isInactive = p.status === 'INACTIVE';
                  const isOff = p.status === 'OFFLINE' || isInactive;
                  const isSafe = p.status === 'HEALTHY' || p.status === 'ACTIVE';
                  const isWarn = p.status === 'WARNING';
                  const isCrit = p.status === 'CRITICAL';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/purifiers/${p.id}`)}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono font-bold text-sky-600 dark:text-sky-400">
                          <span>{p.purifierCode}</span>
                          {p.isPhysicalHardware && (
                            <span className="text-[9px] font-sans px-1 py-0.2 rounded bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300">
                              Pico W
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                        {p.name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        {p.building}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                        <div>{p.floor}</div>
                        <div className="text-[11px] text-slate-400">{p.location}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                            isInactive
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              : isOff
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${isOff ? 'bg-slate-400' : 'bg-emerald-500 animate-pulse'}`}
                          />
                          <span>{isInactive ? 'Inactive' : isOff ? 'Offline' : 'Online'}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isInactive
                              ? 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                              : isSafe
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                              : isWarn
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400'
                              : isCrit
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {isInactive ? 'Standby' : isSafe ? 'Safe' : isWarn ? 'Warning' : isCrit ? 'Critical' : 'Offline'}
                        </span>
                        <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                          {isInactive ? 'Standby' : `TDS ${p.currentTelemetry?.tds || 150} ppm`}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                filterHealth >= 70
                                  ? 'bg-emerald-500'
                                  : filterHealth >= 35
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${filterHealth}%` }}
                            />
                          </div>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {filterHealth.toFixed(0)}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 font-mono text-[11px]">
                        2 min ago
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/purifiers/${p.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 dark:text-sky-400 hover:underline"
                        >
                          <span>Details</span>
                          <ArrowRight size={13} />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {filtered.map((p) => (
            <PurifierCard key={p.id} purifier={p} />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8">
          <Droplets size={36} className="mx-auto mb-2 text-slate-400" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No purifiers match your filter criteria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Try resetting your search query or setting the status filter back to &apos;All Units&apos;.
          </p>
          <button
            onClick={handleResetFilters}
            className="mt-4 px-4 py-2 rounded-xl bg-sky-600 text-white text-xs font-semibold hover:bg-sky-700 transition-colors"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* Add Purifier Modal */}
      {isAddModalOpen &&
        createPortal(
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 relative">
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setAddSuccess(false);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X size={18} />
              </button>

              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                Add New Water Purifier
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Register an IoT node or standard campus water purifier to the centralized platform.
              </p>

              {addSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2.5">
                  <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
                  <span>Purifier registered successfully! Connecting telemetry stream...</span>
                </div>
              ) : (
                <form onSubmit={handleAddPurifierSubmit} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Purifier Code / ID *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. WP-013"
                      value={newPurifier.code}
                      onChange={(e) => setNewPurifier({ ...newPurifier, code: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Purifier Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Biotechnology Wing Water Station"
                      value={newPurifier.name}
                      onChange={(e) => setNewPurifier({ ...newPurifier, name: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Building
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Science Block"
                        value={newPurifier.building}
                        onChange={(e) => setNewPurifier({ ...newPurifier, building: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Floor
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. 2nd Floor"
                        value={newPurifier.floor}
                        onChange={(e) => setNewPurifier({ ...newPurifier, floor: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Location Description
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Near Seminar Hall East"
                      value={newPurifier.location}
                      onChange={(e) => setNewPurifier({ ...newPurifier, location: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Purifier Model / Technology
                    </label>
                    <select
                      value={newPurifier.modelType}
                      onChange={(e) => setNewPurifier({ ...newPurifier, modelType: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                    >
                      <option>Commercial Multi-Stage RO + UV</option>
                      <option>Industrial Heavy-Duty RO + UF</option>
                      <option>Commercial RO + Carbon Filter</option>
                      <option>Ultra-Pure RO + UV + Deionizer</option>
                    </select>
                  </div>

                  <div className="pt-2 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setIsAddModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold"
                    >
                      Add Purifier
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
