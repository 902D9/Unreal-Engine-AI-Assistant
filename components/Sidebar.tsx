import React from 'react';
import { MessageSquare, FileCode, GitBranch, Settings, Plus, Trash2, MessageCircle } from 'lucide-react';
import { AppMode, ChatSession } from '../types';

interface SidebarProps {
  currentMode: AppMode;
  setMode: (mode: AppMode) => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onNewChat: () => void;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string, e: React.MouseEvent) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  currentMode, 
  setMode, 
  sessions, 
  currentSessionId, 
  onNewChat, 
  onSelectSession, 
  onDeleteSession 
}) => {
  const navItems = [
    { mode: AppMode.Chat, icon: MessageSquare, label: "Chat Assistant" },
    { mode: AppMode.ClassGenerator, icon: FileCode, label: "C++ Generator" },
    { mode: AppMode.BlueprintHelper, icon: GitBranch, label: "Blueprint Guide" },
  ];

  // Filter sessions to only show those relevant to chat interfaces
  const chatSessions = sessions.sort((a, b) => b.lastModified - a.lastModified);

  return (
    <div className="w-16 md:w-64 bg-ue-header border-r border-ue-border flex flex-col h-full shrink-0 transition-all duration-300">
      {/* Header */}
      <div className="p-4 flex items-center justify-center md:justify-start border-b border-ue-border">
        <div className="w-8 h-8 bg-ue-text rounded-full flex items-center justify-center shrink-0">
          <span className="text-ue-bg font-bold text-xs">UE</span>
        </div>
        <span className="ml-3 font-bold text-lg hidden md:block text-ue-text tracking-tight">Unreal Dev</span>
      </div>

      {/* Main Navigation */}
      <nav className="flex-none py-4 border-b border-ue-border">
        <div className="px-4 mb-2 hidden md:block text-xs font-bold text-gray-500 uppercase tracking-wider">
          Tools
        </div>
        {navItems.map((item) => (
          <button
            key={item.mode}
            onClick={() => setMode(item.mode)}
            className={`w-full flex items-center px-4 py-2 mb-1 transition-colors ${
              currentMode === item.mode
                ? 'bg-ue-accent text-white border-l-4 border-white'
                : 'text-gray-400 hover:bg-ue-border hover:text-white border-l-4 border-transparent'
            }`}
          >
            <item.icon size={18} className="shrink-0" />
            <span className="ml-3 hidden md:block text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* History / Sessions */}
      <div className="flex-1 overflow-y-auto py-4 flex flex-col">
        <div className="px-4 mb-2 flex items-center justify-between">
           <span className="hidden md:block text-xs font-bold text-gray-500 uppercase tracking-wider">History</span>
           <button 
             onClick={onNewChat}
             className="p-1 rounded bg-ue-panel hover:bg-ue-accent text-white transition-colors"
             title="New Chat"
           >
             <Plus size={14} />
           </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {chatSessions.length === 0 ? (
            <div className="px-4 py-4 text-center hidden md:block">
              <p className="text-xs text-gray-600">No recent chats</p>
            </div>
          ) : (
            chatSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={`w-full flex items-center group px-4 py-2 mb-1 transition-colors relative ${
                  currentSessionId === session.id
                    ? 'bg-ue-panel text-white'
                    : 'text-gray-400 hover:bg-[#1f1f1f] hover:text-gray-300'
                }`}
              >
                <MessageCircle size={16} className="shrink-0 opacity-70" />
                <span className="ml-3 hidden md:block text-xs truncate text-left flex-1 pr-6">
                  {session.title}
                </span>
                <div 
                  className="hidden md:group-hover:flex absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-red-400 rounded"
                  onClick={(e) => onDeleteSession(session.id, e)}
                >
                  <Trash2 size={12} />
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Footer / Settings */}
      <div className="p-4 border-t border-ue-border bg-ue-header">
        <button className="flex items-center text-gray-500 hover:text-white w-full px-2 py-2">
          <Settings size={20} />
          <span className="ml-3 hidden md:block text-xs">Settings</span>
        </button>
         <div className="mt-2 px-2 hidden md:block">
            <p className="text-[10px] text-gray-600">Engine Version: 5.4</p>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;