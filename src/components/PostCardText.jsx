import { useState } from 'react';

const COLLAPSE_THRESHOLD = 280;

export default function PostCardText({ post }) {
  const [expanded, setExpanded] = useState(false);
  const body = post.body || '';
  const isLong = body.length > COLLAPSE_THRESHOLD;

  return (
    <div>
      <p className="text-gray-800 text-[15px] leading-relaxed whitespace-pre-wrap break-words">
        {isLong && !expanded ? body.slice(0, COLLAPSE_THRESHOLD) + '...' : body}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-sm text-blue-500 hover:text-blue-600 mt-1 font-medium"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}
