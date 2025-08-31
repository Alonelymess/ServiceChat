// components/MarkdownRenderer.tsx

import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  children: string;
}

export function MarkdownRenderer({ children }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
    >
      {children}
    </ReactMarkdown>
  );
}