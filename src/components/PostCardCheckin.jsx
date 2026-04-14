export default function PostCardCheckin({ post }) {
  const hasCoords = post.location_lat != null && post.location_lng != null;

  return (
    <div>
      <div className="flex items-center gap-2 bg-blue-50 rounded-xl px-4 py-3 border border-blue-100">
        {/* Pin icon */}
        <svg className="w-5 h-5 text-blue-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 010-5 2.5 2.5 0 010 5z" />
        </svg>
        <div className="flex-1 min-w-0">
          <span className="font-medium text-gray-800 text-[15px]">
            {post.location_name || 'Checked in'}
          </span>
          {hasCoords && (
            <a
              href={`https://www.google.com/maps?q=${post.location_lat},${post.location_lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-xs text-blue-500 hover:underline mt-0.5"
            >
              View on map
            </a>
          )}
        </div>
      </div>

      {post.body && (
        <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap break-words mt-2">
          {post.body}
        </p>
      )}
    </div>
  );
}
