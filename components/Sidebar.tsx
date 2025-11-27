import React from 'react';
import { MessageSquare, FileCode, GitBranch, Settings, Info } from 'lucide-react';
import { AppMode } from '../types';

interface SidebarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentMode, setMode }) => {
  const navItems = [
    { mode: AppMode.Chat, icon: MessageSquare, label: "Chat Assistant" },
    { mode: AppMode.ClassGenerator, icon: FileCode, label: "C++ Generator" },
    { mode: AppMode.BlueprintHelper, icon: GitBranch, label: "Blueprint Guide" },
  ];

  return (
    <div className="w-16 md:w-64 bg-ue-header border-r border-ue-border flex flex-col h-full shrink-0 transition-all duration-300">
      <div className="p-4 flex items-center justify-center md:justify-start border-b border-ue-border">
        <div className="w-8 h-8 bg-ue-text rounded-full flex items-center justify-center shrink-0">
          <span className="text-ue-bg font-bold text-xs">UE</span>
        </div>
        <span className="ml-3 font-bold text-lg hidden md:block text-ue-text tracking-tight">Unreal Dev</span>
      </div>

      <nav className="flex-1 overflow-y-auto py-4">
        {navItems.map((item) => (
          <button
            key={item.mode}
            onClick={() => setMode(item.mode)}
            className={`w-full flex items-center px-4 py-3 mb-1 transition-colors ${
              currentMode === item.mode
                ? 'bg-ue-accent text-white border-l-4 border-white'
                : 'text-gray-400 hover:bg-ue-border hover:text-white border-l-4 border-transparent'
            }`}
          >
            <item.icon size={20} className="shrink-0" />
            <span className="ml-3 hidden md:block text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-ue-border">
        <button className="flex items-center text-gray-500 hover:text-white w-full px-2 py-2">
          <Settings size={20} />
          <span className="ml-3 hidden md:block text-xs">Settings</span>
        </button>
         <div className="mt-4 px-2 hidden md:block">
            <p className="text-xs text-gray-600">Engine Version: 5.4</p>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;