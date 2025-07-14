import { useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export const RichTextEditor = ({ 
  value, 
  onChange, 
  placeholder = "Enter content...", 
  className,
  readOnly = false 
}: RichTextEditorProps) => {
  const modules = useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'align': [] }],
        ['blockquote', 'code-block'],
        ['link', 'image'],
        ['clean']
      ],
    },
    clipboard: {
      matchVisual: false,
    }
  }), []);

  const formats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'color', 'background',
    'list', 'bullet', 'indent',
    'align',
    'blockquote', 'code-block',
    'link', 'image'
  ];

  return (
    <div className={cn("rich-text-editor border rounded-md", className)}>
      <style dangerouslySetInnerHTML={{
        __html: `
          .rich-text-editor .ql-toolbar {
            border-color: hsl(var(--border));
            border-radius: 0.375rem 0.375rem 0 0;
            background: hsl(var(--background));
            border-bottom: 1px solid hsl(var(--border));
          }
          
          .rich-text-editor .ql-container {
            border-color: hsl(var(--border));
            border-radius: 0 0 0.375rem 0.375rem;
            background: hsl(var(--background));
            color: hsl(var(--foreground));
            font-family: inherit;
          }
          
          .rich-text-editor .ql-editor {
            min-height: 200px;
            color: hsl(var(--foreground));
            line-height: 1.6;
          }
          
          .rich-text-editor .ql-editor.ql-blank::before {
            color: hsl(var(--muted-foreground));
            font-style: normal;
          }
          
          .rich-text-editor .ql-toolbar .ql-stroke {
            stroke: hsl(var(--foreground));
          }
          
          .rich-text-editor .ql-toolbar .ql-fill {
            fill: hsl(var(--foreground));
          }
          
          .rich-text-editor .ql-toolbar .ql-picker-label {
            color: hsl(var(--foreground));
          }
          
          .rich-text-editor .ql-toolbar .ql-picker-options {
            background: hsl(var(--background));
            border: 1px solid hsl(var(--border));
            border-radius: 0.375rem;
            box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            z-index: 1000;
          }
          
          .rich-text-editor .ql-toolbar .ql-picker-item:hover {
            background: hsl(var(--accent));
          }
          
          .rich-text-editor .ql-toolbar button:hover,
          .rich-text-editor .ql-toolbar button:focus {
            background: hsl(var(--accent));
            border-radius: 0.25rem;
          }
          
          .rich-text-editor .ql-toolbar button.ql-active {
            background: hsl(var(--primary));
            color: hsl(var(--primary-foreground));
            border-radius: 0.25rem;
          }
          
          .rich-text-editor .ql-toolbar button.ql-active .ql-stroke {
            stroke: hsl(var(--primary-foreground));
          }
          
          .rich-text-editor .ql-toolbar button.ql-active .ql-fill {
            fill: hsl(var(--primary-foreground));
          }
          
          .rich-text-editor .ql-editor h1,
          .rich-text-editor .ql-editor h2,
          .rich-text-editor .ql-editor h3 {
            font-weight: 600;
            margin: 1em 0 0.5em 0;
          }
          
          .rich-text-editor .ql-editor h1 {
            font-size: 1.875rem;
            line-height: 2.25rem;
          }
          
          .rich-text-editor .ql-editor h2 {
            font-size: 1.5rem;
            line-height: 2rem;
          }
          
          .rich-text-editor .ql-editor h3 {
            font-size: 1.25rem;
            line-height: 1.75rem;
          }
          
          .rich-text-editor .ql-editor p {
            margin: 0.5em 0;
          }
          
          .rich-text-editor .ql-editor blockquote {
            border-left: 4px solid hsl(var(--border));
            background: hsl(var(--muted));
            padding: 1rem;
            margin: 1rem 0;
            font-style: italic;
            border-radius: 0.375rem;
          }
          
          .rich-text-editor .ql-editor code {
            background: hsl(var(--muted));
            padding: 0.125rem 0.25rem;
            border-radius: 0.25rem;
            font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
          }
          
          .rich-text-editor .ql-editor pre {
            background: hsl(var(--muted));
            padding: 1rem;
            border-radius: 0.375rem;
            overflow-x: auto;
            margin: 1rem 0;
          }
          
          .rich-text-editor .ql-editor ul,
          .rich-text-editor .ql-editor ol {
            padding-left: 1.5rem;
            margin: 0.5rem 0;
          }
          
          .rich-text-editor .ql-editor li {
            margin: 0.25rem 0;
          }
          
          .rich-text-editor .ql-editor a {
            color: hsl(var(--primary));
            text-decoration: underline;
          }
          
          .rich-text-editor .ql-editor a:hover {
            color: hsl(var(--primary));
            opacity: 0.8;
          }
        `
      }} />
      <ReactQuill
        theme="snow"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        modules={modules}
        formats={formats}
        readOnly={readOnly}
      />
    </div>
  );
};