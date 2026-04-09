import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { usePages } from '../contexts/PagesContext';
import Editor from '../components/Editor';

export default function PageView() {
  const { id } = useParams();
  const { pages, activePage, setActivePageById, updatePage } = usePages();
  const [title, setTitle] = useState('');
  const titleRef = useRef(null);

  useEffect(() => {
    if (id) {
      setActivePageById(id);
    }
  }, [id, setActivePageById]);

  useEffect(() => {
    if (activePage) {
      setTitle(activePage.title || '');
    }
  }, [activePage]);

  const handleTitleBlur = () => {
    if (activePage && title !== activePage.title) {
      updatePage(activePage.id, { title: title || 'Untitled' });
    }
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      titleRef.current?.blur();
    }
  };

  const handleContentUpdate = (content) => {
    if (activePage) {
      updatePage(activePage.id, { content });
    }
  };

  if (!activePage) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400">
        <div className="text-center">
          <p className="text-lg">Select a page or create a new one</p>
          <p className="text-sm mt-1">Use the sidebar to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-[720px] mx-auto px-16 py-12">
        {/* Page title */}
        <input
          ref={titleRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          onKeyDown={handleTitleKeyDown}
          placeholder="Untitled"
          className="w-full text-4xl font-bold text-gray-900 placeholder-gray-300 border-none outline-none bg-transparent mb-4"
          style={{ fontSize: '36px' }}
        />

        {/* Editor */}
        <Editor
          content={activePage.content}
          onUpdate={handleContentUpdate}
        />
      </div>
    </div>
  );
}
