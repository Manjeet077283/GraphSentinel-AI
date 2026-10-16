import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BotMessageSquare,
  Send,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  ShieldCheck,
  AlertOctagon,
  Server,
  Activity,
  Layers,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { api } from '../services/api';
import { ChatMessage, ChatResponse } from '../types';

interface ExtendedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  responseMeta?: ChatResponse;
}

const EXAMPLE_PROMPTS = [
  'Why is the Payment API failing?',
  'Which services may be affected by incident INC-001?',
  'Trace dependencies downstream from the authentication service.',
  'Show evidence supporting incident INC-001.',
  'Find similar historical incidents and what remediation worked previously.',
  'Summarize critical open incidents.',
  'What should the on-call engineer investigate next?'
];

export const ChatPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const focusedIncident = searchParams.get('incident');
  const focusedService = searchParams.get('service');

  const [messages, setMessages] = useState<ExtendedMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Welcome to GraphSentinel AI Investigation Agent 🛡️
I am your graph-powered DevOps incident response assistant. I use **FalkorDB** to perform multi-hop dependency tracing, query telemetry evidence, and retrieve proven remediations from historical incident memory.

**How can I assist your incident investigation today?**`
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Handle focused query param on mount
  useEffect(() => {
    if (focusedIncident) {
      setInput(`Investigate active incident ${focusedIncident} and show evidence and affected downstream services.`);
    } else if (focusedService) {
      setInput(`Why is service ${focusedService} degraded and what depends on it?`);
    }
  }, [focusedIncident, focusedService]);

  const handleSend = async (messageText?: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg: ExtendedMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend.trim()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history: ChatMessage[] = messages.map((m) => ({
        role: m.role,
        content: m.content
      }));

      const res = await api.sendChat({
        message: userMsg.content,
        conversation_history: history,
        focused_incident_id: focusedIncident || undefined,
        focused_service_id: focusedService || undefined
      });

      const assistantMsg: ExtendedMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        responseMeta: res
      };

      setMessages((prev) => [...prev, assistantMsg]);
      setLoading(false);
    } catch (err: any) {
      const errorMsg: ExtendedMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ **Investigation Request Failed:** ${err.message}\n\nPlease verify FalkorDB database connectivity or retry.`
      };
      setMessages((prev) => [...prev, errorMsg]);
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleResetConversation = () => {
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `Conversation reset. Ask any question about services, incidents, evidence, or downstream impact.`
      }
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BotMessageSquare className="w-5 h-5 text-cyan-400" />
            <span className="text-xs font-mono font-medium text-cyan-400 uppercase tracking-wider">
              Graph-Grounded SRE Copilot
            </span>
          </div>
          <h1 className="text-xl font-bold text-white font-mono">AI Incident Investigation Chat</h1>
        </div>

        <button
          onClick={handleResetConversation}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 hover:text-white transition-colors font-mono"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Chat
        </button>
      </div>

      {/* Suggested Prompts Carousel */}
      <div className="shrink-0 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-[11px] font-mono text-slate-400 shrink-0">Suggestions:</span>
        {EXAMPLE_PROMPTS.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(prompt)}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs text-slate-300 hover:text-cyan-300 transition-colors shrink-0 text-left font-mono"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 space-y-6 pr-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-2`}
          >
            {/* Role Header */}
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 px-1">
              {m.role === 'user' ? (
                <span>On-Call SRE</span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-cyan-400 font-semibold">GraphSentinel Agent</span>
                  {m.responseMeta && (
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.2 rounded border font-mono ${
                        m.responseMeta.mode === 'gemini_ai'
                          ? 'bg-blue-950 text-blue-300 border-blue-800'
                          : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                      }`}
                    >
                      {m.responseMeta.mode === 'gemini_ai' ? 'Gemini 2.5 + Graph' : 'Deterministic Graph Fallback'}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Message Bubble */}
            <div
              className={`p-4 rounded-2xl max-w-3xl text-xs leading-relaxed space-y-3 font-mono ${
                m.role === 'user'
                  ? 'bg-cyan-600 text-white rounded-tr-none shadow-md shadow-cyan-950/40'
                  : 'bg-slate-950 border border-slate-800/90 text-slate-200 rounded-tl-none shadow-xl'
              }`}
            >
              <div className="whitespace-pre-wrap">{m.content}</div>

              {/* Structured Reference Chips & Meta for Assistant */}
              {m.responseMeta && (
                <div className="border-t border-slate-850 pt-3 space-y-2.5">
                  {/* Referenced Incident & Service Chips */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">References:</span>
                    {m.responseMeta.referenced_incident_ids.map((id) => (
                      <Link
                        key={id}
                        to={`/incidents/${id}`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800 hover:bg-rose-900 transition-colors text-[10px]"
                      >
                        <AlertOctagon className="w-3 h-3" />
                        <span>{id}</span>
                      </Link>
                    ))}

                    {m.responseMeta.referenced_service_ids.map((id) => (
                      <Link
                        key={id}
                        to={`/services`}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800 hover:bg-cyan-900 transition-colors text-[10px]"
                      >
                        <Server className="w-3 h-3" />
                        <span>{id}</span>
                      </Link>
                    ))}

                    {m.responseMeta.referenced_evidence_ids.map((id) => (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800 text-[10px]"
                      >
                        <Activity className="w-3 h-3" />
                        <span>{id}</span>
                      </span>
                    ))}
                  </div>

                  {/* Actions: Copy Button */}
                  <div className="flex justify-end pt-1">
                    <button
                      onClick={() => handleCopy(m.id, m.content)}
                      className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy Response</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800 max-w-md">
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0 mt-0.5" />
            <div className="text-xs font-mono text-slate-300 space-y-1">
              <div className="font-semibold text-cyan-400">Querying FalkorDB Graph...</div>
              <p className="text-slate-400 text-[11px]">Tracing dependency paths & synthesizing telemetry facts.</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="shrink-0 p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about incidents, services, evidence telemetry, or downstream impact (Enter to send, Shift+Enter for new line)..."
            className="flex-1 bg-transparent text-slate-200 text-xs font-mono focus:outline-none resize-none p-2 placeholder-slate-500"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:hover:bg-cyan-600 text-white transition-colors shadow-lg shadow-cyan-950/50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 px-2 pt-2 border-t border-slate-800/80">
          <span>Enter ↵ to send • Shift+Enter for new line</span>
          <span className="text-cyan-400 font-medium">100% Grounded in FalkorDB Graph</span>
        </div>
      </div>
    </div>
  );
};
