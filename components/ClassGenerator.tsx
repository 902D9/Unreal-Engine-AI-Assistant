import React, { useState } from 'react';
import { generateCppClass } from '../services/geminiService';
import { ClassGenParams } from '../types';
import { FileCode, Loader2, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ClassGenerator: React.FC = () => {
  const [params, setParams] = useState<ClassGenParams>({
    className: 'MyActor',
    parentClass: 'AActor',
    features: ''
  });
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedCode('');
    try {
      const code = await generateCppClass(params);
      setGeneratedCode(code);
    } catch (error) {
      console.error(error);
      setGeneratedCode('Error generating code. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="p-6 border-b border-ue-border bg-ue-panel">
        <h2 className="text-xl font-bold text-white flex items-center">
          <FileCode className="mr-2 text-ue-accent" />
          C++ Class Generator
        </h2>
        <p className="text-gray-400 text-sm mt-1">Define your class parameters and let AI write the boilerplate.</p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Input Panel */}
        <div className="w-full md:w-1/3 p-6 overflow-y-auto border-r border-ue-border bg-ue-bg">
          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Class Name</label>
              <input
                type="text"
                value={params.className}
                onChange={(e) => setParams({ ...params, className: e.target.value })}
                className="w-full bg-ue-panel border border-ue-border text-white rounded p-2 focus:border-ue-accent focus:outline-none"
                placeholder="e.g. ExplosiveBarrel"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Parent Class</label>
              <select
                value={params.parentClass}
                onChange={(e) => setParams({ ...params, parentClass: e.target.value })}
                className="w-full bg-ue-panel border border-ue-border text-white rounded p-2 focus:border-ue-accent focus:outline-none"
              >
                <option value="AActor">AActor</option>
                <option value="APawn">APawn</option>
                <option value="ACharacter">ACharacter</option>
                <option value="UActorComponent">UActorComponent</option>
                <option value="AGameModeBase">AGameModeBase</option>
                <option value="UObject">UObject</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Desired Features & Logic</label>
              <textarea
                value={params.features}
                onChange={(e) => setParams({ ...params, features: e.target.value })}
                className="w-full bg-ue-panel border border-ue-border text-white rounded p-2 h-32 focus:border-ue-accent focus:outline-none resize-none"
                placeholder="Describe what this class should do. E.g., 'It should have a health component, explode on death, and replicate movement.'"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ue-accent hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
              {loading ? 'Thinking...' : 'Generate Code'}
            </button>
          </form>
        </div>

        {/* Output Panel */}
        <div className="flex-1 bg-[#0f0f0f] overflow-y-auto p-0 relative">
          {generatedCode ? (
            <div className="p-6">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-[#0f0f0f] py-2 z-10">
                 <h3 className="text-gray-300 text-sm font-mono">Output</h3>
                 <button 
                  onClick={handleCopy}
                  className="text-xs flex items-center bg-ue-panel border border-ue-border px-3 py-1 rounded hover:bg-ue-border transition"
                 >
                   {copied ? <Check size={14} className="mr-1 text-green-500"/> : <Copy size={14} className="mr-1"/>}
                   {copied ? 'Copied' : 'Copy Code'}
                 </button>
              </div>
              <div className="prose prose-invert max-w-none">
                 <ReactMarkdown
                    components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline ? (
                        <div className="relative my-4 border border-ue-border rounded bg-ue-bg">
                           {match && <div className="px-3 py-1 text-xs text-gray-500 border-b border-ue-border font-mono">{match[1]}</div>}
                           <pre className="p-4 overflow-x-auto m-0 bg-[#0f0f0f]">
                            <code className={className} {...props}>
                              {children}
                            </code>
                          </pre>
                        </div>
                      ) : (
                        <code className="bg-gray-800 px-1 py-0.5 rounded text-xs" {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                 >{generatedCode}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 p-10 text-center">
              <FileCode size={48} className="mb-4 opacity-20" />
              <p>Generated C++ header and source code will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClassGenerator;