import { useEffect, useState, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import CodeBlock from '@tiptap/extension-code-block';
import SlashCommandMenu from './SlashCommandMenu';

export default function Editor({ content, onUpdate }) {
  const [slashMenu, setSlashMenu] = useState(null);
  const debounceRef = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false,
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Type '/' for commands...",
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlock,
    ],
    content: content || '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[60vh]',
      },
      handleKeyDown: (view, event) => {
        if (event.key === '/' && !slashMenu) {
          // Get cursor position to place the menu
          const { from } = view.state.selection;
          const coords = view.coordsAtPos(from);
          // Defer to let the '/' character be inserted first
          setTimeout(() => {
            setSlashMenu({
              top: coords.bottom + 4,
              left: coords.left,
            });
          }, 0);
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        onUpdate(editor.getJSON());
      }, 2000);
    },
  });

  // Update editor content when switching pages
  useEffect(() => {
    if (editor && content !== undefined) {
      const currentContent = JSON.stringify(editor.getJSON());
      const newContent = JSON.stringify(content);
      if (currentContent !== newContent) {
        editor.commands.setContent(content || '');
      }
    }
  }, [content, editor]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleCloseSlashMenu = useCallback(() => {
    setSlashMenu(null);
  }, []);

  return (
    <div className="relative">
      <EditorContent editor={editor} />
      {slashMenu && editor && (
        <SlashCommandMenu
          editor={editor}
          position={slashMenu}
          onClose={handleCloseSlashMenu}
        />
      )}
    </div>
  );
}
