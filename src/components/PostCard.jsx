import { useState } from 'react';
import { usePosts } from '../contexts/PostsContext';
import PostCardText from './PostCardText';
import PostCardImage from './PostCardImage';
import PostCardVideo from './PostCardVideo';
import PostCardVoice from './PostCardVoice';
import PostCardCheckin from './PostCardCheckin';
import DeleteConfirmDialog from './DeleteConfirmDialog';

function formatRelativeTime(dateStr) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHr < 24) return `${diffHr}h`;
  if (diffDay < 7) return `${diffDay}d`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

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

  const TypeComponent = TYPE_COMPONENTS[post.type] || PostCardText;

  return (
    <article className="py-4 group">
      {/* Header row: type indicator + timestamp + menu */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-400">
          {formatRelativeTime(post.created_at)}
        </span>
        <div className="relative">
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

      {/* Post content — delegated to type-specific component */}
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
