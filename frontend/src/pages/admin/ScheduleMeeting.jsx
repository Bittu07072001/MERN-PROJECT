import { useEffect, useMemo, useState } from 'react';
import { Copy, ExternalLink, Link as LinkIcon, Plus, Trash2, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';

const audienceOptions = [
  { value: 'all', label: 'Admin, Buyer & Seller' },
  { value: 'admin-seller', label: 'Admin & Seller' },
  { value: 'buyer-seller', label: 'Buyer & Seller' },
];

const createRoomName = (title) => {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40) || 'meeting';
  return `homeconnect-${slug}-${Date.now().toString(36)}`;
};

const copyText = async (text) => {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.top = '-9999px';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();

  try {
    return document.execCommand('copy');
  } finally {
    document.body.removeChild(textarea);
  }
};

export default function ScheduleMeeting() {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [audience, setAudience] = useState('all');
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [autoUpdatingId, setAutoUpdatingId] = useState(null);

  const origin = useMemo(() => window.location.origin, []);

  const fetchMeetings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/meetings');
      setMeetings((data.meetings || []).map(meeting => ({
        ...meeting,
        link: buildUrl(meeting.roomName, meeting.audience),
      })));
    } catch {
      toast.error('Could not load meetings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMeetings(); }, []);

  const buildUrl = (roomName, meetingAudience = audience) =>
    `${origin}/meeting/${encodeURIComponent(roomName)}?audience=${encodeURIComponent(meetingAudience)}`;

  const copyLink = async (link) => {
    try {
      const copied = await copyText(link);
      if (!copied) throw new Error('Copy command failed');
      toast.success('Meeting link copied');
    } catch {
      toast.error('Could not copy link');
    }
  };

  const handleSchedule = async (e) => {
    e.preventDefault();
    if (!title.trim()) return toast.error('Enter a meeting title');
    if (!date || !time) return toast.error('Select date and time');

    const roomName = createRoomName(title);
    const payload = {
      title: title.trim(),
      roomName,
      date,
      time,
      audience,
    };

    try {
      const { data } = await api.post('/meetings', payload);
      const meeting = { ...data.meeting, link: buildUrl(data.meeting.roomName, data.meeting.audience) };
      setMeetings([meeting, ...meetings].slice(0, 20));
      setTitle('');
      setDate('');
      setTime('');
      setAudience('all');
      copyLink(meeting.link);
      toast.success('Meeting scheduled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not schedule meeting');
    }
  };

  const handleDelete = async (meeting) => {
    if (!meeting?._id) return toast.error('Could not delete this meeting');
    if (!window.confirm(`Delete meeting "${meeting.title}"?`)) return;

    setDeletingId(meeting._id);
    try {
      await api.delete(`/meetings/${meeting._id}`);
      setMeetings(current => current.filter(item => item._id !== meeting._id));
      toast.success('Meeting deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete meeting');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAutoApprove = async (meeting) => {
    if (!meeting?._id) return toast.error('Could not update this meeting');

    const enabled = !meeting.autoApproveJoinRequests;
    setAutoUpdatingId(meeting._id);
    try {
      const { data } = await api.patch(`/meetings/${meeting._id}/auto-approve`, { enabled });
      const updated = {
        ...data.meeting,
        link: buildUrl(data.meeting.roomName, data.meeting.audience),
      };
      setMeetings(current => current.map(item => item._id === meeting._id ? updated : item));
      toast.success(enabled ? 'Auto join enabled' : 'Auto join disabled');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not update auto join');
    } finally {
      setAutoUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Schedule Meeting</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create Jitsi meeting links for buyers, sellers and admins.
          </p>
        </div>
        <span className="badge-primary">
          <Video className="w-3.5 h-3.5" /> Admin only
        </span>
      </div>

      <form onSubmit={handleSchedule} className="card p-5 space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="space-y-1.5">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Meeting title</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input"
              placeholder="Property discussion"
            />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Participants</span>
            <select value={audience} onChange={(e) => setAudience(e.target.value)} className="input">
              {audienceOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Date</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
          </label>

          <label className="space-y-1.5">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Time</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="input" />
          </label>
        </div>

        <button type="submit" className="btn-primary">
          <Plus className="w-4 h-4" /> Schedule Meeting
        </button>
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-gray-900 dark:text-white">Recent meeting links</h2>
          <span className="text-xs text-gray-400">{meetings.length} saved</span>
        </div>

        {loading ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading meetings...</p>
          </div>
        ) : meetings.length === 0 ? (
          <div className="card p-10 text-center">
            <Video className="w-12 h-12 text-gray-300 dark:text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No meetings scheduled yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map(meeting => (
              <div key={meeting._id || meeting.roomName} className="card p-4 flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-gray-900 dark:text-white truncate">{meeting.title}</h3>
                    <span className="badge-success">
                      {audienceOptions.find(option => option.value === meeting.audience)?.label}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {meeting.date} at {meeting.time}
                  </p>
                  <p className="text-xs text-primary-600 dark:text-primary-400 mt-2 truncate flex items-center gap-1">
                    <LinkIcon className="w-3 h-3 flex-shrink-0" /> {meeting.link}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => copyLink(meeting.link)} className="btn-secondary text-xs px-3 py-2">
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAutoApprove(meeting)}
                    disabled={autoUpdatingId === meeting._id}
                    className={`text-xs px-3 py-2 rounded-xl font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
                      meeting.autoApproveJoinRequests
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                    Auto Join {meeting.autoApproveJoinRequests ? 'On' : 'Off'}
                  </button>
                  <a href={meeting.link} target="_blank" rel="noreferrer" className="btn-primary text-xs px-3 py-2">
                    <ExternalLink className="w-3.5 h-3.5" /> Join
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(meeting)}
                    disabled={deletingId === meeting._id}
                    className="icon-btn text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950 disabled:opacity-60 disabled:cursor-not-allowed"
                    title="Delete meeting">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
