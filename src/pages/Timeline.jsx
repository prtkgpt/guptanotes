import { useMemo } from 'react';
import { usePosts } from '../contexts/PostsContext';
import PostComposer from '../components/PostComposer';
import PostCard from '../components/PostCard';

function getDateKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateHeader(dateKey) {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const now = new Date();
  const today = getDateKey(now.toISOString());
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getDateKey(yesterday.toISOString());

  if (dateKey === today) return 'Today';
  if (dateKey === yesterdayKey) return 'Yesterday';

  const diffDays = Math.floor((now - date) / 86400000);
  if (diffDays < 7) {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  }

  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export default function Timeline() {
  const { posts, loading, hasMore, loadMore } = usePosts();

  // Group posts by date
  const grouped = useMemo(() => {
    const groups = [];
    let currentKey = null;
    let currentPosts = [];

    for (const post of posts) {
      const key = getDateKey(post.created_at);
      if (key !== currentKey) {
        if (currentKey !== null) {
          groups.push({ dateKey: currentKey, label: formatDateHeader(currentKey), posts: currentPosts });
        }
        currentKey = key;
        currentPosts = [post];
      } else {
        currentPosts.push(post);
      }
    }
    if (currentKey !== null) {
      groups.push({ dateKey: currentKey, label: formatDateHeader(currentKey), posts: currentPosts });
    }

    return groups;
  }, [posts]);

  const totalCount = posts.length;

  return (
    <main className="max-w-[600px] mx-auto px-4 py-6">
      <PostComposer />

      {loading && posts.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="text-gray-400 text-sm">Loading your timeline...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="text-4xl mb-3 grayscale opacity-40">&#128173;</div>
          <p className="text-gray-500 text-base font-medium">Your timeline is empty</p>
          <p className="text-gray-400 text-sm mt-1">
            Capture a thought, snap a photo, or record a voice note
          </p>
        </div>
      ) : (
        <>
          {/* Post count */}
          <div className="mt-6 mb-2 px-1">
            <span className="text-xs text-gray-400 font-medium">
              {totalCount} {totalCount === 1 ? 'thought' : 'thoughts'}
            </span>
          </div>

          {/* Grouped timeline */}
          {grouped.map((group) => (
            <section key={group.dateKey} className="mb-2">
              {/* Date header */}
              <div className="sticky top-14 z-10 bg-white/90 backdrop-blur-sm py-2 border-b border-gray-100">
                <h2 className="text-sm font-semibold text-gray-900">{group.label}</h2>
              </div>

              {/* Posts in this date group */}
              <div className="divide-y divide-gray-50 md:border-l md:border-gray-100 md:ml-1 md:pl-6">
                {group.posts.map((post) => (
                  <PostCard key={post.id} post={post} />
                ))}
              </div>
            </section>
          ))}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center py-8">
              <button
                onClick={loadMore}
                className="text-sm text-gray-400 hover:text-gray-600 font-medium px-4 py-2 rounded-full border border-gray-200 hover:border-gray-300 transition-colors"
              >
                Load older thoughts
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
