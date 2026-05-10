import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { JitsiMeeting } from '@jitsi/react-sdk';
import { CheckCircle, Clock, ExternalLink, Loader, Lock, XCircle, Video } from 'lucide-react';
import useAuthStore from './context/authStore';
import api from './utils/api';

const AUDIENCE_LABELS = {
  all: 'Admin, buyer and seller',
  'admin-seller': 'Admin and seller',
  'buyer-seller': 'Buyer and seller',
};

const exitPathFor = (role) => role === 'admin' ? '/admin/schedule-meeting' : role === 'seller' ? '/seller' : '/';

function MeetingHeader({ room, audience, user }) {
  return (
    <header className="h-14 px-4 sm:px-6 flex items-center justify-between border-b border-white/10 bg-gray-950">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-primary-600 flex items-center justify-center flex-shrink-0">
          <Video className="w-4.5 h-4.5" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-bold truncate">{room}</h1>
          <p className="text-[11px] text-gray-400">{AUDIENCE_LABELS[audience] || AUDIENCE_LABELS.all}</p>
        </div>
      </div>
      <Link to={exitPathFor(user?.role)}
        className="text-xs font-semibold text-gray-300 hover:text-white px-3 py-2 rounded-xl hover:bg-white/10">
        Exit
      </Link>
    </header>
  );
}

function ApprovalPanel({ room, requesterLabel = 'participant' }) {
  const [requests, setRequests] = useState([]);
  const [updating, setUpdating] = useState(null);
  const [autoApprove, setAutoApprove] = useState(false);
  const [autoUpdating, setAutoUpdating] = useState(false);

  const fetchRequests = async () => {
    try {
      const { data } = await api.get(`/meetings/room/${encodeURIComponent(room)}/join-requests`);
      setRequests(data.requests || []);
      setAutoApprove(Boolean(data.autoApproveJoinRequests));
    } catch {
      setRequests([]);
    }
  };

  useEffect(() => {
    fetchRequests();
    const timer = setInterval(fetchRequests, 4000);
    return () => clearInterval(timer);
  }, [room]);

  const decide = async (userId, status) => {
    setUpdating(userId);
    try {
      await api.patch(`/meetings/room/${encodeURIComponent(room)}/join-requests/${userId}`, { status });
      await fetchRequests();
    } finally {
      setUpdating(null);
    }
  };

  const toggleAutoApprove = async () => {
    const enabled = !autoApprove;
    setAutoUpdating(true);
    try {
      const { data } = await api.patch(`/meetings/room/${encodeURIComponent(room)}/auto-approve`, { enabled });
      setAutoApprove(Boolean(data.autoApproveJoinRequests));
      await fetchRequests();
    } finally {
      setAutoUpdating(false);
    }
  };

  const autoJoinButton = (
    <button
      type="button"
      onClick={toggleAutoApprove}
      disabled={autoUpdating}
      className={`text-xs font-bold px-3 py-2 rounded-xl transition-all disabled:opacity-60 ${
        autoApprove
          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
          : 'bg-white/10 hover:bg-white/15 text-gray-100'
      }`}>
      Auto Join {autoApprove ? 'On' : 'Off'}
    </button>
  );

  if (requests.length === 0) {
    return (
      <div className="border-b border-white/10 bg-gray-900 px-4 sm:px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-gray-400 flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            No {requesterLabel}s are waiting for approval.
          </p>
          {autoJoinButton}
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-amber-400/30 bg-amber-400/10 px-4 sm:px-6 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <p className="text-sm font-bold text-amber-100">{requests.length} {requesterLabel} request{requests.length === 1 ? '' : 's'} waiting</p>
        {autoJoinButton}
        {requests.map(req => (
          <div key={req.user?._id} className="flex items-center gap-2 bg-gray-950/80 border border-white/10 rounded-xl px-3 py-2">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{req.user?.name || requesterLabel}</p>
              <p className="text-[11px] text-gray-400 truncate">{req.user?.email}</p>
            </div>
            <button
              type="button"
              onClick={() => decide(req.user._id, 'approved')}
              disabled={updating === req.user?._id}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold disabled:opacity-60">
              <CheckCircle className="w-3.5 h-3.5" /> Allow
            </button>
            <button
              type="button"
              onClick={() => decide(req.user._id, 'rejected')}
              disabled={updating === req.user?._id}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-60">
              <XCircle className="w-3.5 h-3.5" /> Deny
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function WaitingRoom({ room, audience, user, approverLabel, onApproved }) {
  const [status, setStatus] = useState('loading');

  const requestAccess = async () => {
    try {
      const { data } = await api.post(`/meetings/room/${encodeURIComponent(room)}/join-request`);
      setStatus(data.status || 'pending');
      if (data.approved) onApproved();
    } catch {
      setStatus('error');
    }
  };

  const checkStatus = async () => {
    try {
      const { data } = await api.get(`/meetings/room/${encodeURIComponent(room)}/join-status`);
      setStatus(data.status || 'none');
      if (data.approved) onApproved();
    } catch {
      setStatus('error');
    }
  };

  useEffect(() => {
    requestAccess();
    const timer = setInterval(checkStatus, 3500);
    return () => clearInterval(timer);
  }, [room]);

  return (
    <div className="h-screen overflow-hidden bg-gray-950 text-white flex flex-col">
      <MeetingHeader room={room} audience={audience} user={user} />
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-gray-900 border border-white/10 rounded-2xl p-6 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 mx-auto flex items-center justify-center mb-4">
            {status === 'rejected'
              ? <XCircle className="w-7 h-7 text-rose-300" />
              : status === 'error'
                ? <Lock className="w-7 h-7 text-rose-300" />
                : <Clock className="w-7 h-7 text-amber-300" />}
          </div>
          <h2 className="text-xl font-black">
            {status === 'rejected' ? 'Request denied' : status === 'error' ? 'Could not request access' : `Waiting for ${approverLabel} approval`}
          </h2>
          <p className="text-sm text-gray-300 mt-3 leading-6">
            {status === 'rejected'
              ? `The ${approverLabel} did not allow this join request. You can ask them to approve again.`
              : status === 'error'
                ? 'Please refresh the page and try again.'
                : `Your join request has been sent. You will enter the meeting automatically after the ${approverLabel} allows you.`}
          </p>
          {['loading', 'pending', 'none'].includes(status) && (
            <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-amber-200">
              <Loader className="w-4 h-4 animate-spin" />
              Checking approval status...
            </div>
          )}
          {status === 'rejected' && (
            <button type="button" onClick={requestAccess}
              className="mt-5 inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-3 rounded-xl transition-all active:scale-95">
              Request Again
            </button>
          )}
        </div>
      </main>
    </div>
  );
}

function DirectMeetingAccess({ room, audience, user, secureMeetingUrl, reason = 'buyer' }) {
  const isSecurityFallback = reason === 'security';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(secureMeetingUrl);
    } catch {}
  };

  return (
    <div className="h-screen overflow-hidden bg-gray-950 text-white flex flex-col">
      <MeetingHeader room={room} audience={audience} user={user} />
      <main className="flex-1 min-h-0 flex items-center justify-center p-6 bg-gray-950">
        <div className="max-w-lg w-full bg-gray-900 border border-white/10 rounded-2xl p-6 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-primary-500/10 mx-auto flex items-center justify-center mb-4">
            {reason === 'security'
              ? <Lock className="w-7 h-7 text-amber-300" />
              : <Video className="w-7 h-7 text-primary-300" />}
          </div>
          <h2 className="text-xl font-black">Open video meeting</h2>
          <p className="text-sm text-gray-300 mt-3 leading-6">
            {isSecurityFallback
              ? 'Open the room directly on Jitsi so camera, microphone, and screen sharing can run from a secure HTTPS page.'
              : 'The buyer room will open directly on Jitsi so camera, microphone, and screen sharing work without the embedded meeting warning.'}
          </p>
          <a
            href={secureMeetingUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold px-5 py-3 rounded-xl transition-all active:scale-95">
            <ExternalLink className="w-4 h-4" />
            Join Video Meeting
          </a>
          <button
            type="button"
            onClick={copyLink}
            className="mt-3 block mx-auto text-xs font-semibold text-gray-400 hover:text-white transition-colors">
            Copy meeting link
          </button>
          <p className="text-xs text-gray-500 mt-4 break-all">{secureMeetingUrl}</p>
        </div>
      </main>
    </div>
  );
}

export default function Meeting() {
  const { roomName } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const [joinApproved, setJoinApproved] = useState(false);

  const audience = searchParams.get('audience') || 'all';
  const allowedRoles = audience === 'admin-seller'
    ? ['admin', 'seller']
    : audience === 'buyer-seller'
      ? ['customer', 'seller']
      : ['admin', 'seller', 'customer'];

  const canJoin = user && allowedRoles.includes(user.role);
  const decodedRoom = useMemo(() => decodeURIComponent(roomName || ''), [roomName]);
  const displayName = user?.name || user?.email || 'HomeConnect Guest';
  const secureMeetingUrl = `https://meet.jit.si/${encodeURIComponent(decodedRoom)}`;
  const canUseEmbeddedWebRTC = window.isSecureContext;
  const shouldOpenDirectly = user?.role === 'customer' || !canUseEmbeddedWebRTC;
  const needsSellerApproval = audience === 'buyer-seller' && user?.role === 'customer';
  const needsAdminApproval = audience === 'admin-seller' && user?.role === 'seller';
  const needsAdminApprovalForGroup = audience === 'all' && ['customer', 'seller'].includes(user?.role);
  const needsApproval = needsSellerApproval || needsAdminApproval || needsAdminApprovalForGroup;
  const approverLabel = needsSellerApproval ? 'seller' : 'admin';

  if (!canJoin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#080c14] flex items-center justify-center p-6">
        <div className="card max-w-md w-full p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 mx-auto flex items-center justify-center mb-4">
            <Lock className="w-6 h-6 text-rose-600" />
          </div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Meeting access restricted</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            This meeting is for {AUDIENCE_LABELS[audience] || AUDIENCE_LABELS.all}. Please use an account with the allowed role.
          </p>
          <Link to="/" className="btn-primary mt-5">Go Home</Link>
        </div>
      </div>
    );
  }

  if (needsApproval && !joinApproved) {
    return <WaitingRoom room={decodedRoom} audience={audience} user={user} approverLabel={approverLabel} onApproved={() => setJoinApproved(true)} />;
  }

  if (shouldOpenDirectly) {
    return (
      <DirectMeetingAccess
        room={decodedRoom}
        audience={audience}
        user={user}
        secureMeetingUrl={secureMeetingUrl}
        reason={canUseEmbeddedWebRTC ? 'buyer' : 'security'}
      />
    );
  }

  return (
    <div className="h-screen overflow-hidden bg-gray-950 text-white flex flex-col">
      <MeetingHeader room={decodedRoom} audience={audience} user={user} />
      {audience === 'all' && user?.role === 'admin' && <ApprovalPanel room={decodedRoom} requesterLabel="participant" />}
      {audience === 'buyer-seller' && user?.role === 'seller' && <ApprovalPanel room={decodedRoom} requesterLabel="buyer" />}
      {audience === 'admin-seller' && user?.role === 'admin' && <ApprovalPanel room={decodedRoom} requesterLabel="seller" />}

      <main className="flex-1 min-h-0 overflow-hidden bg-black">
        <div className="h-full w-full [&>div]:h-full [&>div]:w-full [&_iframe]:!h-full [&_iframe]:!w-full [&_iframe]:!border-0">
          <JitsiMeeting
            domain="meet.jit.si"
            roomName={decodedRoom}
            userInfo={{ displayName, email: user?.email }}
            configOverwrite={{
              prejoinPageEnabled: false,
              disableDeepLinking: true,
              startWithAudioMuted: true,
              startWithVideoMuted: true,
            }}
            interfaceConfigOverwrite={{
              SHOW_JITSI_WATERMARK: false,
              SHOW_WATERMARK_FOR_GUESTS: false,
            }}
            getIFrameRef={(jitsiContainer) => {
              jitsiContainer.style.height = '100%';
              jitsiContainer.style.width = '100%';
              jitsiContainer.style.minHeight = '0';

              requestAnimationFrame(() => {
                const iframe = jitsiContainer.querySelector('iframe');
                if (!iframe) return;
                iframe.style.height = '100%';
                iframe.style.width = '100%';
                iframe.style.border = '0';
              });
            }}
          />
        </div>
      </main>
    </div>
  );
}
