import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { deleteMedia, getStoragePath } from '../lib/storage';

const PostsContext = createContext(null);

const PAGE_SIZE = 20;

export function PostsProvider({ children }) {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (cursor = null) => {
    if (!user) return;

    let query = supabase
      .from('posts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (cursor) {
      query = query.lt('created_at', cursor);
    }

    const { data, error } = await query;

    if (!error) {
      if (cursor) {
        setPosts((prev) => [...prev, ...(data || [])]);
      } else {
        setPosts(data || []);
      }
      setHasMore((data || []).length === PAGE_SIZE);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const createPost = async (postData) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from('posts')
      .insert({ ...postData, user_id: user.id })
      .select()
      .single();

    if (!error && data) {
      setPosts((prev) => [data, ...prev]);
    }
    return data;
  };

  const deletePost = async (id) => {
    const post = posts.find((p) => p.id === id);

    // Delete media from storage if present
    if (post?.media_url) {
      const path = getStoragePath(post.media_url);
      if (path) await deleteMedia(path);
    }

    const { error } = await supabase.from('posts').delete().eq('id', id);
    if (!error) {
      setPosts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const loadMore = () => {
    if (posts.length === 0 || !hasMore) return;
    const lastPost = posts[posts.length - 1];
    fetchPosts(lastPost.created_at);
  };

  return (
    <PostsContext.Provider
      value={{ posts, loading, hasMore, createPost, deletePost, loadMore }}
    >
      {children}
    </PostsContext.Provider>
  );
}

export function usePosts() {
  const context = useContext(PostsContext);
  if (!context) throw new Error('usePosts must be used within PostsProvider');
  return context;
}
