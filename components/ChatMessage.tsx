import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Sender, Message } from '../types';
import { User, Bot, ExternalLink } from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isAI = message.sender === Sender.AI;

  return (
    <div className={`flex w-full mb-6 ${isAI ? 'justify-start' : 'justify-end'}`}>
      <div className={`flex max-w-[90%] md:max-w-[80%] ${isAI ? 'flex-row' : 'flex-row-reverse'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 h-8 w-8 rounded flex items-center justify-center mt-1 ${
          isAI ? 'bg-ue-accent text-white mr-3' : 'bg-gray-600 text-white ml-3'
        }`}>
          {isAI ? <Bot size={18} /> : <User size={18} />}
        </div>

        {/* Message Content */}
        <div className={`flex flex-col ${isAI ? 'items-start' : 'items-end'}`}>
          <div className={`p-4 rounded-lg text-sm leading-relaxed shadow-sm ${
            isAI 
              ? 'bg-ue-panel border border-ue-border text-gray-200' 
              : 'bg-ue-accent text-white'
          }`}>
            {isAI ? (
               <div className="markdown-content">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline && match ? (
                        <div className="relative my-2 rounded overflow-hidden border border-gray-700">
                          <div className="bg-[#1e1e1e] px-3 py-1 text-xs text-gray-400 font-mono border-b border-gray-700 flex justify-between">
                             <span>{match[1]}</span>
                          </div>
                          <pre className="bg-[#0f0f0f] p-3 overflow-x-auto m-0">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      ) : (
                        <code className="bg-gray-800 px-1 py-0.5 rounded text-xs font-mono" {...props}>
                          {children}
                        </code>
                      );
                    },
                    p: ({children}) => <p className="mb-2 last:mb-0">{children}</p>,
                    ul: ({children}) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
                    ol: ({children}) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
                    h1: ({children}) => <h1 className="text-lg font-bold mb-2 text-white">{children}</h1>,
                    h2: ({children}) => <h2 className="text-base font-bold mb-2 text-white">{children}</h2>,
                    a: ({children, href}) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">{children}</a>
                  }}
                >
                  {message.text}
                </ReactMarkdown>
               </div>
            ) : (
              <div className="whitespace-pre-wrap">{message.text}</div>
            )}
          </div>

          {/* Grounding Sources */}
          {message.groundingSources && message.groundingSources.length > 0 && (
             <div className="mt-2 flex flex-wrap gap-2">
                {message.groundingSources.map((source, idx) => (
                   <a 
                    key={idx} 
                    href={source.uri} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center text-xs text-gray-400 bg-ue-panel border border-ue-border px-2 py-1 rounded hover:text-ue-accent hover:border-ue-accent transition-colors"
                   >
                      <ExternalLink size={10} className="mr-1" />
                      {source.title || 'Source'}
                   </a>
                ))}
             </div>
          )}
          
          <div className="mt-1 text-xs text-gray-500">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;