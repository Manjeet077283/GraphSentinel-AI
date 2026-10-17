import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BotMessageSquare,
  Send,
  RefreshCw,
  Copy,
  Check,
  Sparkles,
  AlertOctagon,
  Server,
  Activity,
  RotateCcw,
  Languages,
  ArrowRight,
  History,
  CheckCircle2,
  Terminal,
  HelpCircle,
  Database,
  Flame,
  User as UserIcon,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { ChatMessage, ChatResponse } from '../types';
import { useLanguage, SupportedLanguage } from '../context/LanguageContext';
import { FormattedMessage } from '../components/FormattedMessage';

interface ExtendedMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  responseMeta?: ChatResponse;
  translatedContent?: string;
  translating?: boolean;
}

interface PromptChip {
  label: string;
  prompt: string;
  icon: React.ReactNode;
}

const CATEGORIZED_PROMPTS: PromptChip[] = [
  {
    label: 'Payment Failure Root Cause',
    prompt: 'Why is the Payment API failing and what is the root cause?',
    icon: <Flame className="w-3.5 h-3.5 text-rose-500" />
  },
  {
    label: 'INC-001 Impact & Blast Radius',
    prompt: 'Which services may be affected downstream by incident INC-001?',
    icon: <AlertOctagon className="w-3.5 h-3.5 text-amber-500" />
  },
  {
    label: 'Step-by-Step Fix for INC-001',
    prompt: 'Give me a step-by-step recommended solution for incident INC-001.',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
  },
  {
    label: 'Explain in Hinglish',
    prompt: 'Explain incident INC-001 in conversational Hinglish with steps.',
    icon: <Languages className="w-3.5 h-3.5 text-indigo-500" />
  },
  {
    label: 'Active Critical Incidents',
    prompt: 'Summarize all active critical open incidents from the graph.',
    icon: <Activity className="w-3.5 h-3.5 text-purple-500" />
  },
  {
    label: 'Linux Diagnostic Runbook',
    prompt: 'How do I check memory usage, CPU load, and socket states in Linux?',
    icon: <Terminal className="w-3.5 h-3.5 text-slate-600" />
  }
];

export const ChatPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const focusedIncident = searchParams.get('incident');
  const focusedService = searchParams.get('service');
  const resumeConversationId = searchParams.get('conversation_id');

  const { language: globalLang } = useLanguage();
  const [chatLanguage, setChatLanguage] = useState<'auto' | SupportedLanguage>('auto');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(resumeConversationId);

  const [messages, setMessages] = useState<ExtendedMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `### Welcome to GraphSentinel AI Investigation Agent 🛡️
I am your graph-grounded SRE incident intelligence copilot, connected directly to **FalkorDB Cloud**.

**Here is what I can do for your incident triage:**
- **Root-Cause Analysis:** Diagnose failures across services (e.g. *Why is the Payment API failing?*)
- **Cascade Blast Radius:** Map multi-hop downstream dependencies in the topology
- **Step-by-Step Remediation:** Formulate actionable fixes with safety validation checks
- **DevOps & Platform Runbooks:** Practical Linux, networking, Kubernetes, and database guidance

*Click any prompt chip below or type your question to start.*`
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

  // Load resumed conversation if query parameter present
  useEffect(() => {
    if (resumeConversationId) {
      api.getConversation(resumeConversationId)
        .then((detail) => {
          setActiveConversationId(detail.id);
          const loaded: ExtendedMessage[] = detail.messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
          }));
          if (loaded.length > 0) {
            setMessages(loaded);
          }
        })
        .catch((err) => console.error('Failed to resume conversation:', err));
    }
  }, [resumeConversationId]);

  // Handle focused query param on mount
  useEffect(() => {
    if (focusedIncident) {
      setInput(`Investigate incident ${focusedIncident}: explain problem, root cause, evidence, affected services, and step-by-step fix.`);
    } else if (focusedService) {
      setInput(`Why is service ${focusedService} degraded and what dependent services may be impacted?`);
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

      // Determine effective language: if 'auto', fallback to globalLang or undefined
      const effectiveLang = chatLanguage === 'auto' ? (globalLang !== 'en' ? globalLang : undefined) : chatLanguage;

      const res = await api.sendChat({
        message: userMsg.content,
        conversation_history: history,
        focused_incident_id: focusedIncident || undefined,
        focused_service_id: focusedService || undefined,
        language: effectiveLang,
        conversation_id: activeConversationId || undefined
      });

      const assistantMsg: ExtendedMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        responseMeta: res
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      const errorMsg: ExtendedMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `### ⚠️ Investigation Request Failed\n\n${err.message || 'Error communicating with backend.'}\n\nPlease verify FalkorDB database connectivity and try again.`
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
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

  const handleTranslateMessage = async (msgId: string, text: string, targetLang: 'en' | 'hi' | 'hinglish') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, translating: true } : m))
    );

    try {
      const res = await api.translateText({
        text,
        target_language: targetLang
      });

      setMessages((prev) =>
        prev.map((m) =>
          m.id === msgId
            ? { ...m, translating: false, translatedContent: res.translated_text }
            : m
        )
      );
    } catch (err: any) {
      alert(`Translation failed: ${err.message}`);
      setMessages((prev) =>
        prev.map((m) => (m.id === msgId ? { ...m, translating: false } : m))
      );
    }
  };

  const handleResetConversation = () => {
    setActiveConversationId(null);
    setSearchParams({});
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        content: `### 🔄 Active Session Reset\n\nI am ready for a new investigation. You can ask any question regarding incidents, cascade impacts, services, or platform runbooks.`
      }
    ]);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-8 flex flex-col h-[calc(100vh-8.5rem)]">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Graph-Grounded SRE Copilot
            </span>
            {activeConversationId && (
              <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full font-medium">
                Active Session
              </span>
            )}
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            AI Investigation Agent
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs shadow-2xs hover:border-slate-300 transition-colors">
            <Languages className="w-3.5 h-3.5 text-indigo-600" />
            <select
              value={chatLanguage}
              onChange={(e) => setChatLanguage(e.target.value as any)}
              className="bg-transparent border-none text-slate-700 text-xs font-medium focus:outline-hidden cursor-pointer"
              aria-label="Select AI Response Language"
            >
              <option value="auto">Language: Auto</option>
              <option value="en">English</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="hinglish">Hinglish</option>
            </select>
          </div>

          {/* History Link */}
          <Link
            to="/history"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-2xs"
            title="View saved investigation history"
          >
            <History className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
          </Link>

          {/* Reset Chat Button */}
          <button
            onClick={handleResetConversation}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            title="Start a new investigation session"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
        </div>
      </div>

      {/* Suggested Prompts Carousel / Chips */}
      <div className="shrink-0 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <span className="text-xs font-semibold text-slate-500 shrink-0 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-500" />
          Topics:
        </span>
        {CATEGORIZED_PROMPTS.map((item, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(item.prompt)}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-indigo-50/70 border border-slate-200 hover:border-indigo-300 text-xs text-slate-700 hover:text-indigo-700 transition-colors shrink-0 font-medium shadow-2xs cursor-pointer disabled:opacity-50"
            title={item.prompt}
          >
            {item.icon}
            <span>{item.label}</span>
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-6">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
          >
            {/* Role Header */}
            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 px-1">
              {m.role === 'user' ? (
                <div className="flex items-center gap-1.5 text-slate-600">
                  <UserIcon className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="font-semibold">You (Investigating SRE)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                    <BotMessageSquare className="w-3 h-3" />
                  </div>
                  <span className="text-indigo-900 font-bold">GraphSentinel Copilot</span>
                  {m.responseMeta && (
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                        m.responseMeta.mode === 'gemini_ai'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {m.responseMeta.mode === 'gemini_ai' ? 'Gemini 3.8 Flash + FalkorDB' : 'Deterministic Graph Engine'}
                    </span>
                  )}
                  {m.responseMeta?.confidence && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                      CONFIDENCE: {m.responseMeta.confidence}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Message Bubble Card */}
            <div
              className={`p-4 sm:p-5 rounded-2xl max-w-3xl text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-indigo-600 text-white rounded-tr-none shadow-sm'
                  : 'bg-slate-50/80 border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs space-y-4'
              }`}
            >
              {/* Formatted Markdown Body */}
              {m.role === 'user' ? (
                <div className="whitespace-pre-wrap">{m.content}</div>
              ) : (
                <FormattedMessage content={m.content} />
              )}

              {/* Translated Content Display if present */}
              {m.translatedContent && (
                <div className="p-3.5 bg-white border border-indigo-200 rounded-xl text-slate-800 text-xs space-y-1.5 shadow-2xs">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-700 text-xs">
                    <Languages className="w-3.5 h-3.5 text-indigo-600" />
                    Translated Answer:
                  </div>
                  <FormattedMessage content={m.translatedContent} />
                </div>
              )}

              {/* Structured Reference Chips & Meta for Assistant */}
              {m.responseMeta && (
                <div className="border-t border-slate-200 pt-3.5 space-y-3">
                  {/* Referenced Incident & Service Chips */}
                  {(m.responseMeta.referenced_incident_ids.length > 0 ||
                    m.responseMeta.referenced_service_ids.length > 0 ||
                    m.responseMeta.referenced_evidence_ids.length > 0) && (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
                        Graph Nodes:
                      </span>
                      {m.responseMeta.referenced_incident_ids.map((id) => (
                        <Link
                          key={id}
                          to={`/incidents/${id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors text-xs font-mono font-medium shadow-2xs"
                        >
                          <AlertOctagon className="w-3 h-3 text-rose-500" />
                          <span>{id}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-60 ml-0.5" />
                        </Link>
                      ))}

                      {m.responseMeta.referenced_service_ids.map((id) => (
                        <Link
                          key={id}
                          to={`/services`}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition-colors text-xs font-mono font-medium shadow-2xs"
                        >
                          <Server className="w-3 h-3 text-indigo-500" />
                          <span>{id}</span>
                        </Link>
                      ))}

                      {m.responseMeta.referenced_evidence_ids.map((id) => (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-xs font-mono font-medium shadow-2xs"
                        >
                          <Activity className="w-3 h-3 text-amber-600" />
                          <span>{id}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Confirmed Observations */}
                  {m.responseMeta.confirmed_observations && m.responseMeta.confirmed_observations.length > 0 && (
                    <div className="text-xs bg-white p-3 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                      <span className="font-bold text-slate-800 flex items-center gap-1.5 text-xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Confirmed Telemetry Facts:
                      </span>
                      <ul className="space-y-1 pl-4 list-disc text-slate-600 text-xs">
                        {m.responseMeta.confirmed_observations.map((obs, idx) => (
                          <li key={idx} className="leading-relaxed">{obs}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Recommended Next Steps */}
                  {m.responseMeta.suggested_next_steps && m.responseMeta.suggested_next_steps.length > 0 && (
                    <div className="text-xs bg-indigo-50/60 p-3 rounded-xl border border-indigo-100 space-y-1.5">
                      <span className="font-bold text-indigo-950 flex items-center gap-1.5 text-xs">
                        <ArrowRight className="w-3.5 h-3.5 text-indigo-600" />
                        Recommended Next Steps for On-Call:
                      </span>
                      <ol className="space-y-1 pl-4 list-decimal text-indigo-900 text-xs marker:font-semibold">
                        {m.responseMeta.suggested_next_steps.map((st, idx) => (
                          <li key={idx} className="leading-relaxed">{st}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  {/* Actions: Copy & Translate */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                    {/* Translate Dropdown/Pills */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Languages className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="hidden sm:inline">Translate:</span>
                      <button
                        type="button"
                        onClick={() => handleTranslateMessage(m.id, m.content, 'en')}
                        disabled={m.translating}
                        className="px-2 py-0.5 rounded border border-slate-200 hover:bg-white text-[11px] font-medium text-slate-700 cursor-pointer disabled:opacity-50"
                      >
                        English
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTranslateMessage(m.id, m.content, 'hi')}
                        disabled={m.translating}
                        className="px-2 py-0.5 rounded border border-slate-200 hover:bg-white text-[11px] font-medium text-slate-700 cursor-pointer disabled:opacity-50"
                      >
                        हिन्दी
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTranslateMessage(m.id, m.content, 'hinglish')}
                        disabled={m.translating}
                        className="px-2 py-0.5 rounded border border-slate-200 hover:bg-white text-[11px] font-medium text-slate-700 cursor-pointer disabled:opacity-50"
                      >
                        Hinglish
                      </button>
                    </div>

                    <button
                      onClick={() => handleCopy(m.id, m.content)}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors font-medium px-2 py-1 rounded hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer"
                      title="Copy response markdown text"
                    >
                      {copiedId === m.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-semibold">Copied</span>
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
          <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 max-w-md">
            <RefreshCw className="w-4 h-4 text-indigo-600 animate-spin shrink-0 mt-0.5" />
            <div className="text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900">Querying FalkorDB Graph & Reasoning...</div>
              <p className="text-slate-500">Traversing service relationships & synthesizing grounded telemetry facts.</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="shrink-0 p-3 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-2">
        <div className="flex items-end gap-2">
          <textarea
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question about incidents, affected services, evidence, or next steps (Enter to send, Shift+Enter for new line)..."
            className="flex-1 bg-transparent text-slate-800 text-sm focus:outline-hidden resize-none p-2 placeholder-slate-400"
            aria-label="Incident Investigation Prompt Input"
          />

          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 text-white transition-colors shadow-sm shrink-0 cursor-pointer"
            title="Send investigation prompt (Enter)"
            aria-label="Send investigation prompt"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 px-2 pt-1 border-t border-slate-100">
          <span>Press <strong>Enter</strong> to send • <strong>Shift+Enter</strong> for newline</span>
          <span className="text-indigo-600 font-medium flex items-center gap-1">
            <Database className="w-3 h-3" />
            100% Grounded in FalkorDB Cloud Graph Data
          </span>
        </div>
      </div>
    </div>
  );
};
