import React, { useRef, useEffect } from 'react';
import { Editor } from '@tinymce/tinymce-react';

interface LTREditorProps {
  initialValue?: string;
  onEditorChange: (content: string) => void;
  height?: number;
}

export function LTREditor({ initialValue = '', onEditorChange, height = 300 }: LTREditorProps) {
  const editorRef = useRef<any>(null);
  
  // Apply LTR settings to editor content carefully preserving cursor
  const applyLTRSettings = (editor: any) => {
    if (!editor || !editor.getBody()) return;
    
    // Store selection
    const bookmark = editor.selection.getBookmark(2, true);
    
    // Force LTR on editor body
    const body = editor.getBody();
    body.setAttribute('dir', 'ltr');
    body.style.direction = 'ltr';
    body.style.textAlign = 'left';
    
    // Restore selection
    editor.selection.moveToBookmark(bookmark);
  };
  
  return (
    <Editor
      onInit={(_, editor) => {
        editorRef.current = editor;
        // Initial settings after load
        setTimeout(() => {
          editor.execCommand('mceDirectionLTR');
          applyLTRSettings(editor);
          // Focus editor
          editor.focus();
        }, 100);
      }}
      initialValue={initialValue}
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      init={{
        height,
        menubar: false,
        language: 'en',
        plugins: [
          'link', 'lists', 'autoresize', 'autolink', 'charmap',
          'visualblocks', 'code', 'fullscreen',
          'help', 'wordcount'
        ],
        toolbar:
          'undo redo | blocks | ' +
          'bold italic forecolor | alignleft aligncenter ' +
          'alignright alignjustify | bullist numlist outdent indent | ' +
          'link | removeformat | help',
        content_style: `
          body { 
            font-family: Inter, sans-serif; 
            font-size: 14px; 
            direction: ltr !important; 
            text-align: left !important; 
          }
        `,
        branding: false,
        base_url: '/tinymce',
        auto_focus: true,
        setup: (editor) => {
          // Use a custom object to store selection state
          const editorState: any = {};
          
          // Store selection before content change
          editor.on('BeforeSetContent', () => {
            if (editor.selection) {
              editorState.bookmark = editor.selection.getBookmark(2, true);
            }
          });
          
          // Restore selection after content change
          editor.on('SetContent', () => {
            if (editor.selection && editorState.bookmark) {
              editor.selection.moveToBookmark(editorState.bookmark);
              editorState.bookmark = null;
            }
            
            // Apply LTR to body without changing content
            const body = editor.getBody();
            body.setAttribute('dir', 'ltr');
            body.style.direction = 'ltr';
          });
          
          // Set basic LTR direction on init
          editor.on('init', () => {
            editor.execCommand('mceDirectionLTR');
            setTimeout(() => editor.focus(), 100);
          });
          
          // Safety check on keydown to ensure proper cursor direction
          editor.on('keydown', (e) => {
            // Only apply when necessary to avoid interfering with normal typing
            if (e.keyCode === 13) { // Enter key
              setTimeout(() => {
                const bookmark = editor.selection.getBookmark(2, true);
                editor.execCommand('mceDirectionLTR');
                editor.selection.moveToBookmark(bookmark);
              }, 10);
            }
          });
        },
        // Force paragraph as root block
        forced_root_block: 'p',
        forced_root_block_attrs: {
          'dir': 'ltr',
          'style': 'direction: ltr; text-align: left;'
        },
        directionality: 'ltr'
      }}
      onEditorChange={(content) => {
        onEditorChange(content);
      }}
    />
  );
}

export { LTREditor as default }; 
