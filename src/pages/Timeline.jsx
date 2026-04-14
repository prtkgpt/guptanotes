import { usePosts } from '../contexts/PostsContext';
import PostComposer from '../components/PostComposer';
import PostCard from '../components/PostCard';

export default function Timeline() {
  const { posts, loading, hasMore, loadMore } = usePosts();

  return (
    <main className="max-w-[600px] mx-auto px-4 py-6">
      <PostComposer />

      {loading && posts.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="text-gray-400 text-sm">Loading...</div>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center py-20 text-center">
          <div className="text-gray-300 text-5xl mb-4">&#9998;</div>
          <p className="text-gray-500 text-lg">No posts yet</p>
          <p className="text-gray-400 text-sm mt-1">
            Share your first thought, photo, or voice note
          </p>
        </div>
      ) : (
        <>
          <div className="mt-6 space-y-0 divide-y divide-gray-100">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center py-8">
              <button
                onClick={loadMore}
                className="text-sm text-gray-500 hover:text-gray-700 font-medium transition-colors"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
