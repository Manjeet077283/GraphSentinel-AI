import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History,
  MessageSquare,
  Trash2,
  ExternalLink,
  Calendar,
  Clock,
  Sparkles,
  Bot,
  User,
  ShieldAlert,
  Search,
  RefreshCw,
  X,
  Languages
} from 'lucide-react';
import { api } from '../services/api';
import { ConversationSummary, ConversationDetail } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { FormattedMessage } from '../components/FormattedMessage';


export const InvestigationHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Transcript viewer modal
  const [selectedConversation, setSelectedConversation] = useState<ConversationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const fetchConversations = async () => {
    setLoading(true);
    try {
      const res = await api.getConversations();
      setConversations(res);
    } catch (err: any) {
      console.error('Failed to load conversation history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenTranscript = async (conversationId: string) => {
    setLoadingDetail(true);
    try {
      const detail = await api.getConversation(conversationId);
      setSelectedConversation(detail);
    } catch (err: any) {
      alert(err.message || 'Failed to load conversation details.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleDeleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this investigation conversation?')) {
      return;
    }
    try {
      await api.deleteConversation(conversationId);
      setConversations(conversations.filter((c) => c.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete conversation.');
    }
  };

  const handleResumeInChat = (conversationId: string) => {
    navigate(`/chat?conversation_id=${conversationId}`);
  };

  const filteredConversations = conversations.filter(
    (c) =>
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.preview.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <History className="w-6 h-6 text-indigo-600" />
            AI Investigation History & Transcripts
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review past incident investigation dialogues, generated solution plans, and graph evidence queries. Reopen and continue conversations anytime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/chat')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Bot className="w-3.5 h-3.5" />
            New Investigation
          </button>
          <button
            onClick={fetchConversations}
            className="p-2 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 shadow-xs"
            title="Refresh"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-md">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search past conversations by keyword or incident..."
          className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-slate-900"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
      </div>

      {/* Conversations Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading investigation history...</div>
      ) : filteredConversations.length === 0 ? (
        <div className="py-16 text-center text-slate-400 border border-dashed border-slate-200 rounded-xl bg-white p-8">
          <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-slate-700">No Investigation Sessions Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? 'No conversations match your search filter.'
              : 'Start a session with the AI Investigation Agent to trace causes, explore graph dependencies, and formulate solutions.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConversations.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{c.title}</h3>
                  <span className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                    <MessageSquare className="w-2.5 h-2.5" />
                    {c.message_count} {c.message_count === 1 ? 'msg' : 'msgs'}
                  </span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  {c.preview || 'No messages recorded.'}
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(c.updated_at).toLocaleDateString()}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleOpenTranscript(c.id)}
                    className="px-2.5 py-1 text-slate-700 hover:text-indigo-600 font-semibold transition-colors"
                  >
                    View Transcript
                  </button>
                  <button
                    type="button"
                    onClick={() => handleResumeInChat(c.id)}
                    className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                    title="Resume in Chat"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteConversation(c.id)}
                    className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete Conversation"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Transcript Detail Modal */}
      {selectedConversation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-600" />
                  {selectedConversation.title}
                </h3>
                <p className="text-xs text-slate-500">
                  Started: {new Date(selectedConversation.created_at).toLocaleString()} • {selectedConversation.messages.length} messages
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleResumeInChat(selectedConversation.id)}
                  className="flex items-center gap-1.5 px-3 py-1 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Resume Chat
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedConversation(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages Transcript */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4 bg-slate-50/50">
              {selectedConversation.messages.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400">
                  No messages stored in this session.
                </div>
              ) : (
                selectedConversation.messages.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-start gap-3 text-xs ${
                      m.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {m.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}

                    <div
                      className={`max-w-xl p-4 rounded-xl border leading-relaxed shadow-xs ${
                        m.role === 'user'
                          ? 'bg-indigo-600 text-white border-indigo-700'
                          : 'bg-white text-slate-800 border-slate-200'
                      }`}
                    >
                      {m.role === 'user' ? (
                        <div className="whitespace-pre-wrap font-sans text-sm">{m.content}</div>
                      ) : (
                        <FormattedMessage content={m.content} />
                      )}


                      <div
                        className={`mt-2 pt-2 border-t text-[10px] flex items-center justify-between ${
                          m.role === 'user'
                            ? 'border-indigo-500/50 text-indigo-100'
                            : 'border-slate-100 text-slate-400'
                        }`}
                      >
                        <span>{new Date(m.created_at).toLocaleTimeString()}</span>
                        {m.confidence && (
                          <span className="font-semibold uppercase">
                            Confidence: {m.confidence}
                          </span>
                        )}
                        {m.mode && (
                          <span className="font-mono">
                            {m.mode}
                          </span>
                        )}
                      </div>
                    </div>

                    {m.role === 'user' && (
                      <div className="w-7 h-7 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-200 flex justify-end bg-slate-50">
              <button
                type="button"
                onClick={() => setSelectedConversation(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors"
              >
                Close Transcript
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
