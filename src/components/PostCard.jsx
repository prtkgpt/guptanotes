import { useState, useEffect, useRef } from 'react';
import { usePosts } from '../contexts/PostsContext';
import PostCardText from './PostCardText';
import PostCardImage from './PostCardImage';
import PostCardVideo from './PostCardVideo';
import PostCardVoice from './PostCardVoice';
import PostCardCheckin from './PostCardCheckin';
import DeleteConfirmDialog from './DeleteConfirmDialog';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatRelative(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return null; // use absolute time
}

const TYPE_LABELS = {
  text: null,
  image: 'Photo',
  video: 'Video',
  voice: 'Voice note',
  checkin: 'Check-in',
};

const TYPE_ICONS = {
  image: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
    </svg>
  ),
  video: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  voice: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
    </svg>
  ),
  checkin: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
    </svg>
  ),
};

const TYPE_COMPONENTS = {
  text: PostCardText,
  image: PostCardImage,
  video: PostCardVideo,
  voice: PostCardVoice,
  checkin: PostCardCheckin,
};

export default function PostCard({ post }) {
  const { deletePost } = usePosts();
  const [showMenu, setShowMenu] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const menuRef = useRef(null);

  const TypeComponent = TYPE_COMPONENTS[post.type] || PostCardText;
  const typeLabel = TYPE_LABELS[post.type];
  const typeIcon = TYPE_ICONS[post.type];
  const relative = formatRelative(post.created_at);
  const time = formatTime(post.created_at);
  const date = new Date(post.created_at);
  const dayName = DAYS[date.getDay()];
  const fullDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  // Close menu on outside click
  useEffect(() => {
    if (!showMenu) return;
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  return (
    <article className="py-4 group relative">
      {/* Timeline dot */}
      <div className="absolute left-0 top-6 w-2 h-2 rounded-full bg-gray-300 group-hover:bg-black transition-colors -translate-x-[calc(50%+16px)] hidden md:block" />

      {/* Header: timestamp + type badge + menu */}
      <div className="flex items-start justify-between mb-2.5">
        <div className="flex flex-col gap-0.5">
          {/* Primary time */}
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-medium text-gray-900">
              {time}
            </span>
            {relative && (
              <span className="text-[12px] text-gray-400">
                {relative}
              </span>
            )}
          </div>
          {/* Secondary: day + full date */}
          <span className="text-[12px] text-gray-400">
            {dayName}, {fullDate}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Type badge */}
          {typeLabel && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-2 py-0.5">
              {typeIcon}
              {typeLabel}
            </span>
          )}

          {/* More menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-gray-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-all"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0zm6 0a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px] z-10">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowDelete(true);
                  }}
                  className="w-full text-left px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post content */}
      <TypeComponent post={post} />

      {/* Delete confirmation */}
      {showDelete && (
        <DeleteConfirmDialog
          onConfirm={() => {
            deletePost(post.id);
            setShowDelete(false);
          }}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </article>
  );
}
