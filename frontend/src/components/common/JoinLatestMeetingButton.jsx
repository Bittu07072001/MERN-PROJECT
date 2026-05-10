import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Video } from 'lucide-react';
import api from '../../utils/api';

export default function JoinLatestMeetingButton({ className = '', compact = false, onClick }) {
  const [meeting, setMeeting] = useState(null);

  useEffect(() => {
    let mounted = true;
    api.get('/meetings/latest')
      .then(({ data }) => {
        if (mounted) setMeeting(data.meeting || null);
      })
      .catch(() => {
        if (mounted) setMeeting(null);
      });
    return () => { mounted = false; };
  }, []);

  if (!meeting) return null;

  return (
    <Link
      to={meeting.link}
      onClick={onClick}
      title={meeting.title}
      className={className || 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 transition-all active:scale-95'}>
      <Video className="w-4 h-4" />
      {compact ? 'Join' : 'Join Meeting'}
    </Link>
  );
}
