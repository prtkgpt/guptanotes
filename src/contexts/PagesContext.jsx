import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

const PagesContext = createContext(null);

export function PagesProvider({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [pages, setPages] = useState([]);
  const [activePage, setActivePage] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchPages = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('pages')
      .select('*')
      .eq('user_id', user.id)
      .order('position', { ascending: true });

    if (!error) setPages(data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const createPage = async (parentId = null) => {
    if (!user) return;
    const maxPos = pages
      .filter(p => p.parent_id === parentId)
      .reduce((max, p) => Math.max(max, p.position), -1);

    const { data, error } = await supabase
      .from('pages')
      .insert({
        user_id: user.id,
        parent_id: parentId,
        title: 'Untitled',
        content: null,
        position: maxPos + 1,
      })
      .select()
      .single();

    if (!error && data) {
      setPages(prev => [...prev, data]);
      setActivePage(data);
      navigate(`/page/${data.id}`);
    }
    return data;
  };

  const updatePage = async (id, updates) => {
    const { data, error } = await supabase
      .from('pages')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (!error && data) {
      setPages(prev => prev.map(p => (p.id === id ? data : p)));
      if (activePage?.id === id) setActivePage(data);
    }
  };

  const deletePage = async (id) => {
    const children = pages.filter(p => p.parent_id === id);
    for (const child of children) {
      await deletePage(child.id);
    }

    await supabase.from('pages').delete().eq('id', id);
    setPages(prev => prev.filter(p => p.id !== id));

    if (activePage?.id === id) {
      const remaining = pages.filter(p => p.id !== id && !children.some(c => c.id === p.id));
      if (remaining.length > 0) {
        setActivePage(remaining[0]);
        navigate(`/page/${remaining[0].id}`);
      } else {
        setActivePage(null);
        navigate('/');
      }
    }
  };

  const movePage = async (pageId, newParentId) => {
    if (pageId === newParentId) return;
    // Prevent moving a page into its own descendant
    let current = newParentId;
    while (current) {
      if (current === pageId) return;
      const parent = pages.find(p => p.id === current);
      current = parent?.parent_id;
    }

    await updatePage(pageId, { parent_id: newParentId });
  };

  const setActivePageById = useCallback((id) => {
    const page = pages.find(p => p.id === id);
    if (page) setActivePage(page);
  }, [pages]);

  return (
    <PagesContext.Provider
      value={{
        pages,
        activePage,
        loading,
        createPage,
        updatePage,
        deletePage,
        movePage,
        setActivePageById,
        fetchPages,
      }}
    >
      {children}
    </PagesContext.Provider>
  );
}

export function usePages() {
  const context = useContext(PagesContext);
  if (!context) throw new Error('usePages must be used within PagesProvider');
  return context;
}
