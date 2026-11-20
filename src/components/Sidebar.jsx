'use client';

import {
  LayoutDashboard,
  UploadCloud,
  Package,
  Activity,
  Settings,
  Sparkles,
  Database,
  CheckCircle2,
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Reviews', icon: UploadCloud },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'history', label: 'Processing History', icon: Activity },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function Sidebar({ activeSection, onSectionChange, hasData }) {
  return (
    <aside className="w-64 bg-[#0f172a] text-slate-300 flex flex-col min-h-screen border-r border-slate-800 shrink-0 select-none">
      {/* Brand Header */}
      <div className="px-6 py-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-600 to-blue-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold text-white tracking-tight">ReviewLens</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Review Intelligence</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 px-3 py-6 space-y-6 overflow-y-auto">
        <div>
          <p className="px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-2">
            Main Menu
          </p>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              const isLocked = (item.id === 'products' || item.id === 'history') && !hasData;

              return (
                <button
                  key={item.id}
                  onClick={() => !isLocked && onSectionChange(item.id)}
                  disabled={isLocked}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                      : isLocked
                      ? 'text-slate-400 hover:text-slate-400 cursor-not-allowed opacity-50'
                      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {isLocked && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      Upload first
                    </span>
                  )}
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* System Capabilities Pill */}
        <div className="px-3 pt-2">
          <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/60 text-xs space-y-2">
            <div className="flex items-center justify-between text-slate-300 font-medium">
              <span className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-emerald-400" />
                SQLite Cache
              </span>
              <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Deduplication by SHA-256 hash. Zero redundant AI cost.
            </p>
          </div>
        </div>
      </div>

      {/* Footer / Engine Status */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-slate-300 font-medium">Gemini Flash</span>
          </div>
          <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3 h-3 text-slate-400" />
            v1.0
          </span>
        </div>
      </div>
    </aside>
  );
}
