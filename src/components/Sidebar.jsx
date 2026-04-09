import { useMemo, useState } from 'react';
import { usePages } from '../contexts/PagesContext';
import { useAuth } from '../contexts/AuthContext';
import PageTreeItem from './PageTreeItem';

export default function Sidebar() {
  const { pages, createPage } = usePages();
  const { signOut, user } = useAuth();

  const rootPages = useMemo(
    () => pages.filter((p) => !p.parent_id).sort((a, b) => a.position - b.position),
    [pages]
  );

  return (
    <aside className="w-60 h-screen flex flex-col bg-[#f7f7f5] border-r border-gray-200 flex-shrink-0">
      {/* Header */}
      <div className="px-3 py-4 flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-800 truncate">
          GuptaNotes
        </span>
      </div>

      {/* Page tree */}
      <nav className="flex-1 overflow-y-auto px-1">
        {rootPages.map((page) => (
          <PageTreeItem key={page.id} page={page} depth={0} />
        ))}
        {rootPages.length === 0 && (
          <p className="px-3 py-2 text-xs text-gray-400">No pages yet</p>
        )}
      </nav>

      {/* Bottom actions */}
      <div className="p-2 border-t border-gray-200 space-y-1">
        <button
          onClick={() => createPage(null)}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-200 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Page
        </button>
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Log out
        </button>
      </div>
    </aside>
  );
}
