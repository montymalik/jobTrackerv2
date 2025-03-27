// app/components/resume/tiptap/RichTextEditor.tsx
import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import ListItem from '@tiptap/extension-list-item';
import Text from '@tiptap/extension-text';
import Color from '@tiptap/extension-color';
import TextStyle from '@tiptap/extension-text-style';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
// We'll implement custom indentation without the extension

interface RichTextEditorProps {
  content: string;
  onUpdate: (html: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ content, onUpdate }) => {
  const [isMounted, setIsMounted] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc mt-2 pl-5',
        },
      }),
      OrderedList,
      ListItem,
      TextStyle,
      Color,
      Text,
      Placeholder.configure({
        placeholder: 'Add content here...',
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    content,
    editable: true,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onUpdate(html);
    },
  });

  // Handle HTML content updates
  useEffect(() => {
    if (editor && content && !isMounted) {
      editor.commands.setContent(content);
      setIsMounted(true);
    }
  }, [content, editor, isMounted]);

  // Re-set content when it changes completely (e.g., switching sections)
  useEffect(() => {
    if (editor && isMounted) {
      const currentContent = editor.getHTML();
      if (currentContent !== content) {
        editor.commands.setContent(content);
      }
    }
  }, [content, editor, isMounted]);

  if (!editor) {
    return null;
  }

  return (
    <div className="tiptap-editor">
      {/* Toolbar */}
      <div className="flex flex-wrap p-2 bg-gray-700 border-b border-gray-600 rounded-t-md text-white space-x-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded ${editor.isActive('bold') ? 'bg-gray-900' : 'hover:bg-gray-600'}`}
          title="Bold"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          </svg>
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded ${editor.isActive('italic') ? 'bg-gray-900' : 'hover:bg-gray-600'}`}
          title="Italic"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="4" x2="10" y2="4"></line>
            <line x1="14" y1="20" x2="5" y2="20"></line>
            <line x1="15" y1="4" x2="9" y2="20"></line>
          </svg>
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1 rounded ${editor.isActive('underline') ? 'bg-gray-900' : 'hover:bg-gray-600'}`}
          title="Underline"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
            <line x1="4" y1="21" x2="20" y2="21"></line>
          </svg>
        </button>
        
        <span className="border-r border-gray-600 h-6 mx-1"></span>
        
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={`p-1 rounded ${editor.isActive('heading', { level: 3 }) ? 'bg-gray-900' : 'hover:bg-gray-600'}`}
          title="Heading"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 4v16M18 4v16M6 12h12"></path>
          </svg>
        </button>
        
        <button
          onClick={() => editor.chain().focus().setParagraph().run()}
          className={`p-1 rounded ${editor.isActive('paragraph') ? 'bg-gray-900' : 'hover:bg-gray-600'}`}
          title="Paragraph"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 4H6a2 2 0 0 0-2 2v12c0 1.1.9 2 2 2h12a2 2 0 0 0 2-2v-6"></path>
            <path d="M18 4h-6v12"></path>
          </svg>
        </button>
        
        <span className="border-r border-gray-600 h-6 mx-1"></span>
        
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1 rounded ${editor.isActive('bulletList') ? 'bg-gray-900' : 'hover:bg-gray-600'}`}
          title="Bullet List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="8" y1="6" x2="21" y2="6"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="18" x2="21" y2="18"></line>
            <line x1="3" y1="6" x2="3.01" y2="6"></line>
            <line x1="3" y1="12" x2="3.01" y2="12"></line>
            <line x1="3" y1="18" x2="3.01" y2="18"></line>
          </svg>
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1 rounded ${editor.isActive('orderedList') ? 'bg-gray-900' : 'hover:bg-gray-600'}`}
          title="Numbered List"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="10" y1="6" x2="21" y2="6"></line>
            <line x1="10" y1="12" x2="21" y2="12"></line>
            <line x1="10" y1="18" x2="21" y2="18"></line>
            <path d="M4 6h1v4"></path>
            <path d="M4 10h2"></path>
            <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path>
          </svg>
        </button>
        
        <button
          onClick={() => {
            // Instead of using the extension, we can use list item attributes to increase padding
            // This is a simple approach; a more robust solution would be a custom extension
            editor.chain().focus().updateAttributes('listItem', {
              class: 'ml-5'
            }).run();
          }}
          className="p-1 rounded hover:bg-gray-600"
          title="Indent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="8" x2="21" y2="8"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="16" x2="21" y2="16"></line>
            <line x1="3" y1="12" x2="3" y2="16"></line>
            <polyline points="6,14 3,16 6,18"></polyline>
          </svg>
        </button>
        
        <button
          onClick={() => {
            // Remove the margin class
            editor.chain().focus().updateAttributes('listItem', {
              class: ''
            }).run();
          }}
          className="p-1 rounded hover:bg-gray-600"
          title="Outdent"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="8" x2="21" y2="8"></line>
            <line x1="8" y1="12" x2="21" y2="12"></line>
            <line x1="8" y1="16" x2="21" y2="16"></line>
            <line x1="3" y1="12" x2="3" y2="16"></line>
            <polyline points="6,14 3,12 6,10"></polyline>
          </svg>
        </button>
        
        <span className="border-r border-gray-600 h-6 mx-1"></span>
        
        <button
          onClick={() => {
            const url = window.prompt('Enter the link URL:');
            if (url) {
              editor.chain().focus().setLink({ href: url }).run();
            }
          }}
          className={`p-1 rounded ${editor.isActive('link') ? 'bg-gray-900' : 'hover:bg-gray-600'}`}
          title="Link"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </button>
        
        <div className="relative group">
          <button
            className="p-1 rounded hover:bg-gray-600"
            title="Text Color"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 3L5 21M19 3l-4 18M5 12h14"></path>
            </svg>
          </button>
          <div className="absolute hidden group-hover:flex flex-wrap bg-gray-800 p-1 rounded shadow-lg z-10 top-full left-0 w-32">
            {['#ffffff', '#d1d5db', '#9ca3af', '#6b7280', '#4b5563', '#374151', '#1f2937'].map((color) => (
              <button
                key={color}
                onClick={() => editor.chain().focus().setColor(color).run()}
                className="w-6 h-6 m-1 rounded"
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
          </div>
        </div>
        
        <span className="border-r border-gray-600 h-6 mx-1"></span>
        
        <button
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1 rounded hover:bg-gray-600"
          title="Undo"
          disabled={!editor.can().undo()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 10h10a8 8 0 0 1 8 8v2M3 10l6 6M3 10l6-6"></path>
          </svg>
        </button>
        
        <button
          onClick={() => editor.chain().focus().redo().run()}
          className="p-1 rounded hover:bg-gray-600"
          title="Redo"
          disabled={!editor.can().redo()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10H11a8 8 0 0 0-8 8v2M21 10l-6 6M21 10l-6-6"></path>
          </svg>
        </button>
      </div>
      
      {/* Editor Content */}
      <div className="p-4 min-h-64 max-h-96 overflow-y-auto text-white bg-gray-800">
        <EditorContent editor={editor} />
      </div>
      
      {/* Bubble Menu for quick formatting */}
      <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className="bg-gray-700 rounded shadow-lg p-1 flex">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1 rounded ${editor.isActive('bold') ? 'bg-gray-900' : 'hover:bg-gray-600'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
            <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1 rounded ${editor.isActive('italic') ? 'bg-gray-900' : 'hover:bg-gray-600'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="4" x2="10" y2="4"></line>
            <line x1="14" y1="20" x2="5" y2="20"></line>
            <line x1="15" y1="4" x2="9" y2="20"></line>
          </svg>
        </button>
        <button
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1 rounded ${editor.isActive('underline') ? 'bg-gray-900' : 'hover:bg-gray-600'}`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
            <line x1="4" y1="21" x2="20" y2="21"></line>
          </svg>
        </button>
      </BubbleMenu>
    </div>
  );
};

export default RichTextEditor;
