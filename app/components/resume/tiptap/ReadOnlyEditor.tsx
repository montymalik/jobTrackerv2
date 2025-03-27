// app/components/resume/tiptap/ReadOnlyEditor.tsx
import React, { useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
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

interface ReadOnlyEditorProps {
  content: string;
}

const ReadOnlyEditor: React.FC<ReadOnlyEditorProps> = ({ content }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false, // Disable link clicking in read-only mode
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
        placeholder: 'No content...',
      }),
    ],
    content,
    editable: false, // This is the key - make the editor read-only
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div className="prose prose-invert prose-ul:pl-5 prose-li:pl-0 prose-li:my-1 max-w-none">
      <EditorContent editor={editor} />
    </div>
  );
};

export default ReadOnlyEditor;
