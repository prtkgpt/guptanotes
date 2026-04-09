import { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePages } from '../contexts/PagesContext';
import ContextMenu from './ContextMenu';

export default function PageTreeItem({ page, depth }) {
  const { pages, activePage, deletePage, createPage, movePage } = usePages();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const itemRef = useRef(null);

  const children = useMemo(
    () => pages.filter((p) => p.parent_id === page.id).sort((a, b) => a.position - b.position),
    [pages, page.id]
  );

  const hasChildren = children.length > 0;
  const isActive = activePage?.id === page.id;

  const handleClick = () => {
    navigate(`/page/${page.id}`);
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', page.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== page.id) {
      movePage(draggedId, page.id);
      setExpanded(true);
    }
  };

  return (
    <div>
      <div
        ref={itemRef}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          group flex items-center gap-0.5 px-1 py-1 rounded cursor-pointer text-sm select-none
          ${isActive ? 'bg-gray-200 text-gray-900' : 'text-gray-600 hover:bg-gray-100'}
          ${dragOver ? 'ring-2 ring-blue-400 bg-blue-50' : ''}
        `}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {/* Expand toggle */}
        <button
          onClick={handleToggle}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-300 flex-shrink-0"
        >
          {hasChildren ? (
            <svg
              className={`w-3 h-3 text-gray-400 transition-transform ${expanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <span className="w-3 h-3" />
          )}
        </button>

        {/* Page icon */}
        <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
        </svg>

        {/* Title */}
        <span className="truncate flex-1 ml-1">
          {page.title || 'Untitled'}
        </span>

        {/* Quick add child */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            createPage(page.id);
            setExpanded(true);
          }}
          className="w-5 h-5 items-center justify-center rounded hover:bg-gray-300 flex-shrink-0 hidden group-hover:flex"
        >
          <svg className="w-3 h-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Children */}
      {expanded && hasChildren && (
        <div>
          {children.map((child) => (
            <PageTreeItem key={child.id} page={child} depth={depth + 1} />
          ))}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              label: 'Add sub-page',
              action: () => {
                createPage(page.id);
                setExpanded(true);
              },
            },
            {
              label: 'Delete',
              action: () => deletePage(page.id),
              danger: true,
            },
          ]}
        />
      )}
    </div>
  );
}
