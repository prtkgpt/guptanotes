export default function PostCardImage({ post }) {
  return (
    <div>
      {post.media_url && (
        <div className="rounded-xl overflow-hidden border border-gray-100 mb-2">
          <img
            src={post.media_url}
            alt={post.body || 'Image'}
            className="w-full max-h-[500px] object-cover"
            loading="lazy"
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
