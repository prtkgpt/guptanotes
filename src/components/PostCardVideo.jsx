export default function PostCardVideo({ post }) {
  return (
    <div>
      {post.media_url && (
        <div className="rounded-xl overflow-hidden border border-gray-100 mb-2">
          <video
            src={post.media_url}
            controls
            preload="metadata"
            poster={post.thumbnail_url || undefined}
            className="w-full max-h-[500px]"
          />
        </div>
      )}
      {post.body && (
        <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
          {post.body}
        </p>
      )}
    </div>
  );
}
