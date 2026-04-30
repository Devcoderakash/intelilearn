
import type {Metadata, Viewport} from 'next';
import './globals.css';
import '../styles/responsive.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'IntelliLearn | The AI-Powered Intelligence Platform',
  description: 'Master your learning journey with AI-powered video analysis, interview coaching, practice tests, and personalized study planners. Your all-in-one intelligence workspace.',
  keywords: ['AI learning', 'study tools', 'interview practice', 'video analysis', 'student productivity', 'intellilearn'],
  authors: [{ name: 'IntelliLearn Team' }],
  openGraph: {
    title: 'IntelliLearn | Master Your Intelligence',
    description: 'The definitive AI workspace for learners.',
    url: 'https://intellilearn.vercel.app',
    siteName: 'IntelliLearn',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1200',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IntelliLearn | AI-Powered Learning',
    description: 'Transform your learning with the power of AI.',
    images: ['https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1200'],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

import QueryProvider from '@/components/query-provider';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;900&family=Alegreya:ital,wght@0,400;0,700;0,900;1,400&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nAnM7sE9Y9KEnGamsE56zUo7BeSPrvly7L+601M7N/eP0fS0783F" crossOrigin="anonymous" />
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js" integrity="sha384-7zkInBa71SYvp9Dnhgl7B86E+7t2T/KqKToV8/13c/yK0B6v0zJ0" crossOrigin="anonymous"></script>
        <script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js" integrity="sha384-43gviWU0YVjaDtb/Ghz35EBrKsIfWCGLV7PtPc6GNCVBuT3XDTL" crossOrigin="anonymous"></script>
        <script src="https://polyfill.io/v3/polyfill.min.js?features=es6"></script>
        <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.MathJax = {
                tex: {
                  inlineMath: [['$', '$'], ['\\\\(', '\\\\)']],
                  displayMath: [['$$', '$$'], ['\\\\[', '\\\\]']],
                  processEscapes: true
                },
                options: {
                  ignoreHtmlClass: 'tex2jax_ignore',
                  processHtmlClass: 'tex2jax_process'
                }
              };
              document.addEventListener('DOMContentLoaded', function() {
                if (typeof renderMathInElement === 'function') {
                  renderMathInElement(document.body);
                }
              });
            `
          }}
        />
      </head>
      <body className="font-body antialiased bg-background text-foreground">
        <QueryProvider>
          {children}
          <Toaster />
        </QueryProvider>
      </body>
    </html>
  );
}
