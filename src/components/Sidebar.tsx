'use client';

import {
  LayoutDashboard,
  Upload,
  Package,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  hasData: boolean;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'upload', label: 'Upload Reviews', icon: Upload },
  { id: 'products', label: 'Products', icon: Package },
];

export default function Sidebar({ activeSection, onSectionChange, hasData }: SidebarProps) {
  return (
    <aside className="w-64 bg-[#1e293b] text-white flex flex-col min-h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#334155]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-[#7c3aed]" />
          <span className="text-lg font-bold tracking-tight">ReviewLens</span>
        </div>
        <p className="text-xs text-[#94a3b8] mt-1">AI Review Intelligence</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            const isDisabled =
              (item.id === 'products') && !hasData;

            return (
              <li key={item.id}>
                <button
                  onClick={() => !isDisabled && onSectionChange(item.id)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-[#3b82f6]/20 text-[#60a5fa]'
                      : isDisabled
                      ? 'text-[#475569] cursor-not-allowed'
                      : 'text-[#94a3b8] hover:bg-[#334155] hover:text-white'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5" />
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-[#334155]">
        <p className="text-xs text-[#64748b]">
          Powered by Google Gemini
        </p>
      </div>
    </aside>
  );
}
