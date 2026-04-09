import { useState, useEffect, useCallback, useRef } from 'react';

const COMMANDS = [
  { label: 'Paragraph', description: 'Plain text', icon: 'T', command: 'paragraph' },
  { label: 'Heading 1', description: 'Large heading', icon: 'H1', command: 'heading1' },
  { label: 'Heading 2', description: 'Medium heading', icon: 'H2', command: 'heading2' },
  { label: 'Heading 3', description: 'Small heading', icon: 'H3', command: 'heading3' },
  { label: 'Bullet List', description: 'Unordered list', icon: '•', command: 'bulletList' },
  { label: 'Numbered List', description: 'Ordered list', icon: '1.', command: 'orderedList' },
  { label: 'To-do List', description: 'Checkboxes', icon: '☐', command: 'taskList' },
  { label: 'Divider', description: 'Horizontal line', icon: '—', command: 'horizontalRule' },
  { label: 'Code Block', description: 'Code snippet', icon: '</>', command: 'codeBlock' },
];

export default function SlashCommandMenu({ editor, position, onClose }) {
  const [filter, setFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const menuRef = useRef(null);

  const filtered = COMMANDS.filter(
    (cmd) =>
      cmd.label.toLowerCase().includes(filter.toLowerCase()) ||
      cmd.description.toLowerCase().includes(filter.toLowerCase())
  );

  const executeCommand = useCallback(
    (command) => {
      if (!editor) return;

      // Delete the slash and any filter text
      const { from } = editor.state.selection;
      const textBefore = editor.state.doc.textBetween(
        Math.max(0, from - filter.length - 1),
        from,
        '\n'
      );
      const slashPos = from - filter.length - 1;
      editor.chain().focus().deleteRange({ from: slashPos, to: from }).run();

      switch (command) {
        case 'paragraph':
          editor.chain().focus().setParagraph().run();
          break;
        case 'heading1':
          editor.chain().focus().toggleHeading({ level: 1 }).run();
          break;
        case 'heading2':
          editor.chain().focus().toggleHeading({ level: 2 }).run();
          break;
        case 'heading3':
          editor.chain().focus().toggleHeading({ level: 3 }).run();
          break;
        case 'bulletList':
          editor.chain().focus().toggleBulletList().run();
          break;
        case 'orderedList':
          editor.chain().focus().toggleOrderedList().run();
          break;
        case 'taskList':
          editor.chain().focus().toggleTaskList().run();
          break;
        case 'horizontalRule':
          editor.chain().focus().setHorizontalRule().run();
          break;
        case 'codeBlock':
          editor.chain().focus().toggleCodeBlock().run();
          break;
      }

      onClose();
    },
    [editor, filter, onClose]
  );

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIndex]) {
          executeCommand(filtered[selectedIndex].command);
        }
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Backspace') {
        if (filter.length === 0) {
          onClose();
        } else {
          setFilter((prev) => prev.slice(0, -1));
        }
      } else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
        setFilter((prev) => prev + e.key);
        setSelectedIndex(0);
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [filter, selectedIndex, filtered, executeCommand, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [filter]);

  if (filtered.length === 0) {
    onClose();
    return null;
  }

  return (
    <div
      ref={menuRef}
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-72 max-h-80 overflow-y-auto"
      style={{ top: position.top, left: position.left }}
    >
      <div className="px-3 py-1.5 text-xs text-gray-400 uppercase tracking-wide">
        Basic blocks
      </div>
      {filtered.map((cmd, i) => (
        <button
          key={cmd.command}
          onClick={() => executeCommand(cmd.command)}
          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
            i === selectedIndex ? 'bg-gray-100' : 'hover:bg-gray-50'
          }`}
        >
          <span className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded border border-gray-200 text-sm font-mono text-gray-600">
            {cmd.icon}
          </span>
          <div>
            <div className="text-sm text-gray-800">{cmd.label}</div>
            <div className="text-xs text-gray-400">{cmd.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
