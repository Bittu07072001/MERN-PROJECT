import { useState, useEffect } from 'react';
import { Sparkles, Bot, MapPin, BarChart3, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import api from '../../utils/api';

const TYPE_ICONS = {
  chat: <Bot className="w-4 h-4" />,
  recommendation: <Sparkles className="w-4 h-4" />,
  price_estimate: <BarChart3 className="w-4 h-4" />,
  location_suggestion: <MapPin className="w-4 h-4" />,
};

const TYPE_COLORS = {
  chat: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  recommendation: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  price_estimate: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  location_suggestion: 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300',
};

export default function AdminAILogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const LIMIT = 20;

  useEffect(() => {
    fetchLogs();
  }, [filter, page]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: LIMIT });
      if (filter) params.set('type', filter);
      const { data } = await api.get(`/admin/ai-logs?${params}`);
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setStats(data.stats || null);
    } catch {}
    finally { setLoading(false); }
  };

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-500" /> AI Usage Logs
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Monitor Groq AI interactions across the platform</p>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Requests', value: stats.total || 0, icon: <Bot className="w-5 h-5 text-indigo-500" />, bg: 'bg-indigo-50 dark:bg-indigo-950' },
            { label: 'Chat Sessions', value: stats.chat || 0, icon: <Bot className="w-5 h-5 text-purple-500" />, bg: 'bg-purple-50 dark:bg-purple-950' },
            { label: 'Recommendations', value: stats.recommendation || 0, icon: <Sparkles className="w-5 h-5 text-green-500" />, bg: 'bg-green-50 dark:bg-green-950' },
            { label: 'Tokens Used', value: (stats.totalTokens || 0).toLocaleString(), icon: <BarChart3 className="w-5 h-5 text-orange-500" />, bg: 'bg-orange-50 dark:bg-orange-950' },
          ].map((s, i) => (
            <div key={i} className="card p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>{s.icon}</div>
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{s.label}</p>
                <p className="text-xl font-black text-gray-900 dark:text-white">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Filter className="w-4 h-4 text-gray-400" />
        <div className="flex gap-2 flex-wrap">
          {['', 'chat', 'recommendation', 'location_suggestion', 'price_estimate'].map(t => (
            <button key={t} onClick={() => { setFilter(t); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-full font-semibold transition-colors ${filter === t ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'}`}>
              {t || 'All Types'}
            </button>
          ))}
        </div>
      </div>

      {/* Logs table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />)}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Sparkles className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="font-semibold">No AI logs yet</p>
            <p className="text-sm mt-1">AI interactions will appear here once users start using Groq AI features</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {logs.map(log => (
              <div key={log._id}>
                <button onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                  className="w-full flex items-start gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${TYPE_COLORS[log.type] || 'bg-gray-100 dark:bg-gray-800'}`}>
                    {TYPE_ICONS[log.type] || <Bot className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[log.type] || ''}`}>
                        {log.type?.replace('_', ' ')}
                      </span>
                      {log.user?.name && <span className="text-xs text-gray-500 dark:text-gray-400">by {log.user.name}</span>}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(log.createdAt).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 truncate">{log.prompt}</p>
                    <div className="flex items-center gap-3 mt-1">
                      {log.success
                        ? <span className="flex items-center gap-1 text-xs text-green-600"><CheckCircle className="w-3 h-3" /> Success</span>
                        : <span className="flex items-center gap-1 text-xs text-red-500"><XCircle className="w-3 h-3" /> Failed</span>
                      }
                      {log.tokensUsed > 0 && <span className="text-xs text-gray-400">{log.tokensUsed} tokens</span>}
                      {log.durationMs > 0 && <span className="text-xs text-gray-400">{log.durationMs}ms</span>}
                    </div>
                  </div>
                </button>

                {expanded === log._id && (
                  <div className="px-4 pb-4 space-y-3">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Prompt</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{log.prompt}</p>
                    </div>
                    {log.response && (
                      <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-3">
                        <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-1">AI Response</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-6">{log.response}</p>
                      </div>
                    )}
                    {log.error && (
                      <div className="bg-red-50 dark:bg-red-950/30 rounded-xl p-3">
                        <p className="text-xs font-semibold text-red-600 dark:text-red-400 uppercase tracking-wide mb-1">Error</p>
                        <p className="text-sm text-red-600 dark:text-red-400">{log.error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">← Prev</button>
          <span className="flex items-center text-sm text-gray-500 dark:text-gray-400 px-3">Page {page} of {pages}</span>
          <button disabled={page >= pages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-sm py-2 px-4 disabled:opacity-40">Next →</button>
        </div>
      )}
    </div>
  );
}
