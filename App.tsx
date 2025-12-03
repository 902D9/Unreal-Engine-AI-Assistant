import React, { useState, useRef, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatMessage from './components/ChatMessage';
import ClassGenerator from './components/ClassGenerator';
import { AppMode, Message, Sender, ChatSession } from './types';
import { streamChatResponse } from './services/geminiService';
import { Send, Search, Sparkles, AlertCircle } from 'lucide-react';
import { GenerateContentResponse } from '@google/genai';

const LOCAL_STORAGE_KEY = 'ue_ai_sessions_v1';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const App: React.FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.Chat);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useSearch, setUseSearch] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSessions(parsed);
        if (parsed.length > 0) {
          setCurrentSessionId(parsed[0].id);
          setMode(parsed[0].mode);
        } else {
          createNewSession(AppMode.Chat);
        }
      } catch (e) {
        console.error("Failed to load sessions", e);
        createNewSession(AppMode.Chat);
      }
    } else {
      createNewSession(AppMode.Chat);
    }
  }, []);

  // Save to LocalStorage whenever sessions change
  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
    }
  }, [sessions]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [sessions, currentSessionId]);

  // Derived state: Current Messages
  const currentSession = sessions.find(s => s.id === currentSessionId);
  const messages = currentSession?.messages || [];

  const createNewSession = (targetMode: AppMode = AppMode.Chat) => {
    const newSession: ChatSession = {
      id: generateId(),
      title: 'New Chat',
      mode: targetMode,
      lastModified: Date.now(),
      messages: [
        {
          id: 'welcome',
          sender: Sender.AI,
          text: targetMode === AppMode.BlueprintHelper 
            ? "I am ready to assist with Blueprint Logic. Describe what you want to achieve."
            : "Welcome, Developer. I am your Unreal Engine AI Assistant. How can I assist you today?",
          timestamp: Date.now()
        }
      ]
    };
    
    setSessions(prev => [newSession, ...prev]);
    setCurrentSessionId(newSession.id);
    setMode(targetMode);
  };

  const handleDeleteSession = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);
    
    // If we deleted the active session, switch to another one or create new
    if (currentSessionId === sessionId) {
      if (newSessions.length > 0) {
        setCurrentSessionId(newSessions[0].id);
        setMode(newSessions[0].mode);
      } else {
        createNewSession(AppMode.Chat);
      }
    }
    
    // If empty, clear local storage
    if (newSessions.length === 0) {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  };

  const handleSelectSession = (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSessionId(sessionId);
      setMode(session.mode);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isLoading || !currentSessionId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: Sender.User,
      text: inputText,
      timestamp: Date.now()
    };

    // Optimistically update UI with user message
    setSessions(prev => prev.map(s => {
      if (s.id === currentSessionId) {
        // If this is the first user message (after welcome), update title
        const isFirstUserMessage = s.messages.length === 1 && s.messages[0].sender === Sender.AI;
        const newTitle = isFirstUserMessage ? inputText.slice(0, 30) + (inputText.length > 30 ? '...' : '') : s.title;

        return {
          ...s,
          title: newTitle,
          messages: [...s.messages, userMessage],
          lastModified: Date.now()
        };
      }
      return s;
    }));

    setInputText('');
    setIsLoading(true);

    const history = messages.map(m => ({
      role: m.sender === Sender.User ? 'user' : 'model',
      parts: [{ text: m.text }]
    }));
    // Add current message to history for the API call
    history.push({ role: 'user', parts: [{ text: userMessage.text }] });

    try {
      const responseStream = await streamChatResponse(history, userMessage.text, useSearch);
      
      const aiMessageId = (Date.now() + 1).toString();
      let accumulatedText = "";
      let groundingSources: any[] = [];

      // Add placeholder AI message
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, {
              id: aiMessageId,
              sender: Sender.AI,
              text: '',
              timestamp: Date.now()
            }]
          };
        }
        return s;
      }));

      for await (const chunk of responseStream) {
        const c = chunk as GenerateContentResponse;
        if (c.candidates && c.candidates.length > 0) {
           const candidate = c.candidates[0];
           
           if (candidate.groundingMetadata?.groundingChunks) {
             const chunks = candidate.groundingMetadata.groundingChunks;
             chunks.forEach(chunk => {
               if (chunk.web?.uri) {
                 groundingSources.push({ title: chunk.web.title, uri: chunk.web.uri });
               }
             });
           }

           if (candidate.content?.parts) {
             for (const part of candidate.content.parts) {
               if (part.text) {
                 accumulatedText += part.text;
               }
             }
           }
        }
        
        // Update the message in the specific session
        setSessions(prev => prev.map(s => {
          if (s.id === currentSessionId) {
            const updatedMessages = s.messages.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, text: accumulatedText, groundingSources: groundingSources.length > 0 ? groundingSources : undefined } 
                : msg
            );
            return { ...s, messages: updatedMessages };
          }
          return s;
        }));
      }

    } catch (error) {
      console.error("Error sending message:", error);
      setSessions(prev => prev.map(s => {
        if (s.id === currentSessionId) {
          return {
            ...s,
            messages: [...s.messages, {
              id: Date.now().toString(),
              sender: Sender.AI,
              text: "I encountered an error processing your request. Please check your network connection or API key.",
              isError: true,
              timestamp: Date.now()
            }]
          };
        }
        return s;
      }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderContent = () => {
    switch (mode) {
      case AppMode.Chat:
      case AppMode.BlueprintHelper: 
        return (
          <div className="flex flex-col h-full relative">
            {/* Top Toolbar */}
            <div className="h-12 bg-ue-panel border-b border-ue-border flex items-center px-4 justify-between shrink-0">
               <div className="flex items-center space-x-2 text-sm text-gray-400">
                  <span className="font-bold text-gray-200">
                    {mode === AppMode.Chat ? 'General Assistant' : 'Blueprint Helper'}
                  </span>
                  <span>/</span>
                  <span className="text-xs">Context: {useSearch ? 'Online Docs' : 'Internal Knowledge'}</span>
                  {currentSession && <span className="text-xs bg-ue-bg px-2 py-0.5 rounded border border-ue-border truncate max-w-[200px]">{currentSession.title}</span>}
               </div>
               
               <div className="flex items-center space-x-2">
                 <button 
                  onClick={() => setUseSearch(!useSearch)}
                  className={`flex items-center px-3 py-1 rounded text-xs font-medium transition-colors ${useSearch ? 'bg-ue-accent text-white' : 'bg-ue-bg text-gray-400 hover:text-white'}`}
                  title="Enable Google Search Grounding for latest documentation"
                 >
                   <Search size={14} className="mr-1.5" />
                   Search Grounding
                 </button>
               </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-ue-bg">
              <div className="max-w-4xl mx-auto">
                {messages.map((msg) => (
                  <ChatMessage key={msg.id} message={msg} />
                ))}
                {isLoading && (
                  <div className="flex justify-start mb-6">
                     <div className="flex items-center space-x-2 text-gray-500 bg-ue-panel px-4 py-3 rounded-lg border border-ue-border">
                        <Sparkles size={16} className="animate-pulse text-ue-accent" />
                        <span className="text-sm">Thinking...</span>
                     </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-ue-panel border-t border-ue-border">
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  <textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={mode === AppMode.BlueprintHelper ? "Describe the Blueprint logic you need..." : "Ask about C++, Blueprints, or UE5 API..."}
                    className="w-full bg-[#0f0f0f] text-white border border-ue-border rounded-lg pl-4 pr-12 py-3 focus:outline-none focus:border-ue-accent transition-colors resize-none h-24"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputText.trim() || isLoading}
                    className="absolute right-3 bottom-3 p-2 text-gray-400 hover:text-ue-accent disabled:opacity-50 disabled:hover:text-gray-400 transition-colors"
                  >
                    <Send size={20} />
                  </button>
                </div>
                <div className="text-center mt-2 flex justify-between px-1">
                   <span className="text-[10px] text-gray-600">SHIFT+ENTER for new line</span>
                   <span className="text-[10px] text-gray-600">AI can make mistakes. Verify code.</span>
                </div>
              </div>
            </div>
          </div>
        );
      case AppMode.ClassGenerator:
        return <ClassGenerator />;
      default:
        return <div>Mode not implemented</div>;
    }
  };

  // Check for API Key on mount
  if (!process.env.API_KEY) {
    return (
      <div className="h-screen w-screen bg-ue-bg flex items-center justify-center text-white">
        <div className="bg-ue-panel p-8 rounded-lg border border-red-500/50 max-w-md text-center">
          <AlertCircle className="mx-auto text-red-500 mb-4" size={48} />
          <h1 className="text-2xl font-bold mb-2">Missing API Key</h1>
          <p className="text-gray-400">Please provide a valid Google Gemini API Key in the environment variables to use this application.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-ue-bg text-ue-text overflow-hidden font-sans">
      <Sidebar 
        currentMode={mode} 
        setMode={(m) => {
          // When switching mode via sidebar, if the current session doesn't match the new mode, 
          // create a new one or find the latest one of that mode. 
          // For simplicity, we just change the mode for now, or start fresh if user wants specific tool.
          if (m === AppMode.ClassGenerator) {
            setMode(m);
          } else {
             // Check if we have a session of this mode
             const existing = sessions.find(s => s.mode === m);
             if (existing) {
               setCurrentSessionId(existing.id);
             } else {
               createNewSession(m);
             }
             setMode(m);
          }
        }}
        sessions={sessions}
        currentSessionId={currentSessionId}
        onNewChat={() => createNewSession(mode === AppMode.ClassGenerator ? AppMode.Chat : mode)}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
      />
      <main className="flex-1 flex flex-col min-w-0">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;