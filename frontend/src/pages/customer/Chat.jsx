import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Send, ArrowLeft, MessageCircle, Check, CheckCheck, Search, Users, UserRound } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { io } from 'socket.io-client';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import useAuthStore from '../../context/authStore';
import { socketURL } from '../../utils/socket';

function timeAgo(date) {
  if (!date) return '';
  const now = new Date();
  const d = new Date(date);
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

function roleLabel(role) {
  if (role === 'customer') return 'Buyer';
  if (role === 'seller') return 'Seller';
  if (role === 'admin') return 'Admin';
  return 'User';
}

function canChatWith(currentUser, person) {
  return !(currentUser?.role === 'customer' && person?.role === 'customer');
}

function getUserId(person) {
  return person?._id?.toString?.() || person?._id || person?.toString?.() || person;
}

function getConversationPerson(conversation, currentUser) {
  const sender = conversation?.lastMessage?.sender;
  const receiver = conversation?.lastMessage?.receiver;
  const currentUserId = getUserId(currentUser);
  const senderId = getUserId(sender);

  return senderId === currentUserId ? receiver : sender;
}

function Avatar({ person, online }) {
  return (
    <div className="relative flex-shrink-0">
      {person?.avatar ? (
        <img src={person.avatar} alt={person.name || 'User'} className="w-10 h-10 rounded-full object-cover bg-gray-100 dark:bg-gray-800" />
      ) : (
        <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400">
          {person?.name?.charAt(0).toUpperCase() || '?'}
        </div>
      )}
      {online && <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-900 rounded-full" />}
    </div>
  );
}

export default function Chat() {
  const { receiverId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const chatBasePath = user?.role === 'admin' ? '/admin/chat' : user?.role === 'seller' ? '/seller/chat' : '/chat';

  const [conversations, setConversations] = useState([]);
  const [people, setPeople] = useState([]);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [receiver, setReceiver] = useState(null);
  const [typing, setTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [searchQ, setSearchQ] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimerRef = useRef(null);
  const inputRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/chat/conversations');
      setConversations(data.conversations || []);
    } catch {}
  }, []);

  const fetchPeople = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchQ.trim()) params.set('search', searchQ.trim());
      if (roleFilter) params.set('role', roleFilter);
      const { data } = await api.get(`/chat/users${params.toString() ? `?${params}` : ''}`);
      setPeople(data.users || []);
    } catch {
      toast.error('Could not load people');
    }
  }, [searchQ, roleFilter]);

  useEffect(() => {
    if (!user) return;
    const socket = io(socketURL, { path: '/socket.io', transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.emit('join', user._id);

    socket.on('newMessage', (msg) => {
      const senderId = msg.sender?._id || msg.sender;
      const receiverMsgId = msg.receiver?._id || msg.receiver;
      if (senderId === receiverId || receiverMsgId === receiverId || senderId === user._id) {
        setMessages(prev => prev.some(m => m._id === msg._id) ? prev : [...prev, msg]);
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
      fetchConversations();
    });

    socket.on('typing', ({ senderId }) => {
      if (senderId === receiverId) setTyping(true);
    });

    socket.on('stopTyping', ({ senderId }) => {
      if (senderId === receiverId) setTyping(false);
    });

    socket.on('userOnline', (uid) => setOnlineUsers(p => new Set([...p, uid.toString()])));
    socket.on('userOffline', (uid) => setOnlineUsers(p => { const n = new Set(p); n.delete(uid.toString()); return n; }));

    return () => {
      socket.off();
      socket.disconnect();
    };
  }, [user, receiverId, fetchConversations]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (user?.role === 'customer' && roleFilter === 'customer') {
      setRoleFilter('');
    }
  }, [roleFilter, user?.role]);

  useEffect(() => {
    const timer = setTimeout(fetchPeople, 250);
    return () => clearTimeout(timer);
  }, [fetchPeople]);

  useEffect(() => {
    if (!receiverId || !user) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const [messageRes, userRes] = await Promise.all([
          api.get(`/chat/${receiverId}`),
          api.get(`/chat/users/${receiverId}`),
        ]);
        const msgs = messageRes.data.messages || [];
        setMessages(msgs);
        setReceiver(userRes.data.user);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Could not load messages');
        if (err.response?.status === 403) navigate(chatBasePath);
      } finally {
        setLoading(false);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          inputRef.current?.focus();
        }, 100);
      }
    };

    fetchMessages();
    socketRef.current?.emit('joinChat', { userId: user._id, receiverId });
  }, [receiverId, user]);

  const conversationPeopleIds = useMemo(() => {
    return new Set(conversations.map(c => {
      const other = getConversationPerson(c, user);
      return getUserId(other);
    }).filter(Boolean));
  }, [conversations, user?._id]);

  const filteredConvos = conversations.filter(c => {
    const other = getConversationPerson(c, user);
    return canChatWith(user, other) && (
      !roleFilter ||
      other?.role === roleFilter ||
      other?.roles?.includes?.(roleFilter)
    ) && (
      !searchQ ||
      other?.name?.toLowerCase().includes(searchQ.toLowerCase()) ||
      other?.role?.toLowerCase().includes(searchQ.toLowerCase())
    );
  });

  const roleTabs = user?.role === 'customer'
    ? [['', 'All'], ['seller', 'Sellers'], ['admin', 'Admins']]
    : [['', 'All'], ['customer', 'Buyers'], ['seller', 'Sellers'], ['admin', 'Admins']];

  const startablePeople = people.filter(person => !conversationPeopleIds.has(person._id) && canChatWith(user, person));

  const openChat = (person) => {
    const personId = getUserId(person);
    if (!personId) {
      toast.error('Could not open this conversation');
      fetchConversations();
      return;
    }
    if (!canChatWith(user, person)) {
      toast.error('Buyers cannot message other buyers');
      return;
    }
    setReceiver(person);
    navigate(`${chatBasePath}/${personId}`);
  };

  const handleSend = async () => {
    const msg = text.trim();
    if (!msg || sending || !receiverId) return;
    setSending(true);
    setText('');

    try {
      await api.post('/chat', { receiverId, text: msg });
      socketRef.current?.emit('stopTyping', { senderId: user._id, receiverId });
      fetchConversations();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send message');
      setText(msg);
    }
    setSending(false);
  };

  const handleTyping = (e) => {
    setText(e.target.value);
    if (!receiverId) return;
    socketRef.current?.emit('typing', { senderId: user._id, receiverId });
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socketRef.current?.emit('stopTyping', { senderId: user._id, receiverId });
    }, 1500);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!user) return (
    <div className="text-center py-20">
      <p className="text-gray-500 dark:text-gray-400">Please <Link to="/login" className="text-indigo-600 underline">log in</Link> to use chat.</p>
    </div>
  );

  return (
    <div className="flex h-[calc(100vh-8rem)] bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-800 shadow-sm">
      <div className={`${receiverId ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-96 border-r border-gray-200 dark:border-gray-800 flex-shrink-0`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="font-black text-lg text-gray-900 dark:text-white flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-indigo-500" /> Messages
          </h2>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <input value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Search people or conversations..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-1 mt-3 p-1 rounded-xl bg-gray-100 dark:bg-gray-800">
            {roleTabs.map(([value, label]) => (
              <button
                key={value || 'all'}
                type="button"
                onClick={() => setRoleFilter(value)}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  roleFilter === value
                    ? 'bg-white dark:bg-gray-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {filteredConvos.length > 0 && (
            <div className="py-2">
              <p className="px-4 py-2 text-[11px] font-black uppercase tracking-wider text-gray-400">Conversations</p>
              {filteredConvos.map(c => {
                const other = getConversationPerson(c, user);
                const otherId = getUserId(other);
                const isOnline = other && (onlineUsers.has(otherId) || other.isOnline);
                const isActive = receiverId === otherId;
                return (
                  <button key={c._id} onClick={() => openChat(other)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''}`}>
                    <Avatar person={other} online={isOnline} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{other?.name || 'Unknown'}</p>
                        <p className="text-xs text-gray-400 flex-shrink-0">{timeAgo(c.lastMessage?.createdAt)}</p>
                      </div>
                      <p className="text-[11px] font-medium text-indigo-500 dark:text-indigo-300">{roleLabel(other?.role)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{c.lastMessage?.text}</p>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="flex-shrink-0 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                        {c.unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="py-2 border-t border-gray-100 dark:border-gray-800">
            <p className="px-4 py-2 text-[11px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> People
            </p>
            {startablePeople.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm px-4">
                <UserRound className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No people found.</p>
              </div>
            ) : (
              startablePeople.map(person => {
                const isOnline = onlineUsers.has(person._id?.toString()) || person.isOnline;
                const isActive = receiverId === person._id;
                return (
                  <button key={person._id} onClick={() => openChat(person)}
                    className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left ${isActive ? 'bg-indigo-50 dark:bg-indigo-950/30' : ''}`}>
                    <Avatar person={person} online={isOnline} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{person.name}</p>
                      <p className="text-[11px] font-medium text-indigo-500 dark:text-indigo-300">{roleLabel(person.role)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{person.email}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      </div>

      {receiverId ? (
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <button onClick={() => navigate(chatBasePath)} className="md:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <Avatar person={receiver} online={onlineUsers.has(receiverId) || receiver?.isOnline} />
            <div>
              <p className="font-bold text-sm text-gray-900 dark:text-white">{receiver?.name || 'Loading...'}</p>
              <p className="text-xs text-gray-400">
                {typing ? <span className="text-indigo-500 animate-pulse">typing...</span> : (onlineUsers.has(receiverId) || receiver?.isOnline) ? <span className="text-green-500">Online</span> : roleLabel(receiver?.role)}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-950">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12 text-gray-400 text-sm">
                <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No messages yet. Say hello!</p>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {messages.map(msg => {
                  const isMine = getUserId(msg.sender) === getUserId(user);
                  return (
                    <motion.div key={msg._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs sm:max-w-sm ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                        {msg.property && (
                          <div className="text-xs bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full font-medium">
                            Re: {msg.property.name}
                          </div>
                        )}
                        <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                          isMine
                            ? 'bg-indigo-600 text-white rounded-br-sm'
                            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-700'
                        }`}>
                          {msg.text}
                        </div>
                        <div className={`flex items-center gap-1 text-xs text-gray-400 ${isMine ? 'justify-end' : ''}`}>
                          {timeAgo(msg.createdAt)}
                          {isMine && (msg.isRead
                            ? <CheckCheck className="w-3.5 h-3.5 text-indigo-400" />
                            : <Check className="w-3.5 h-3.5" />
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            )}

            {typing && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-1 shadow-sm border border-gray-100 dark:border-gray-700">
                  {[0, 1, 2].map(i => (
                    <motion.div key={i} className="w-2 h-2 bg-gray-400 rounded-full"
                      animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-3 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl px-3 py-2 gap-2">
                <input
                  ref={inputRef}
                  value={text}
                  onChange={handleTyping}
                  onKeyDown={handleKey}
                  placeholder={`Message ${receiver?.name || 'user'}...`}
                  className="flex-1 bg-transparent text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 outline-none"
                />
              </div>
              <button onClick={handleSend} disabled={!text.trim() || sending}
                className="w-10 h-10 bg-indigo-600 disabled:bg-gray-300 dark:disabled:bg-gray-700 text-white rounded-xl flex items-center justify-center transition-all hover:bg-indigo-700 active:scale-95">
                {sending
                  ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Send className="w-4 h-4" />
                }
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-1 items-center justify-center">
          <div className="text-center text-gray-400">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-20" />
            <p className="font-semibold text-gray-500 dark:text-gray-400">Select a conversation</p>
            <p className="text-sm mt-1">or choose any buyer, seller, or admin from the people list</p>
          </div>
        </div>
      )}
    </div>
  );
}
