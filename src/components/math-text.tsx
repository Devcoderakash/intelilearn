'use client';

import { useEffect, useRef, useState } from 'react';

export function MathText({ content, children, className = '' }: { content?: string; children?: React.ReactNode; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const handleMath = () => {
      const element = containerRef.current;
      if (!element) return;

      // 1. Try MathJax (Premium Vector Rendering)
      if ((window as any).MathJax && (window as any).MathJax.typesetPromise) {
        (window as any).MathJax.typesetPromise([element]).catch((err: any) => {
          console.warn("MathJax failed, triggering CodeCogs fallback:", err);
          setUseFallback(true);
        });
      } else {
        // Fallback to KaTeX if loaded (Fast Secondary)
        if ((window as any).renderMathInElement) {
          try {
            (window as any).renderMathInElement(element, {
              delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
              ],
              throwOnError: false
            });
          } catch (e) {
            setUseFallback(true);
          }
        } else {
          // If no local engines, wait then trigger CodeCogs
          setTimeout(() => {
             if (!element.querySelector('.mjx-container')) setUseFallback(true);
          }, 2000);
        }
      }
    };

    handleMath();

    const observer = new MutationObserver(handleMath);
    if (containerRef.current) {
        observer.observe(containerRef.current, { childList: true, subtree: true, characterData: true });
    }
    return () => observer.disconnect();
  }, [content, children]);

  // Stage 3: CodeCogs Fallback Injection (Image-based SVG rendering)
  // This manually parses the text to find $$ blocks and replaces with images
  const processForCodeCogs = (text: string) => {
    if (!useFallback) return text;
    
    // Regex to find $$ ... $$ and replace with CodeCogs SVG
    return text.replace(/\$\$\s*([\s\S]*?)\s*\$\$/g, (match, formula) => {
      const encoded = encodeURIComponent(formula.trim().replace(/\\\\/g, '\\'));
      return `<div class="my-6 text-center"><img src="https://latex.codecogs.com/svg.latex?\\Large\\color{white}${encoded}" alt="${formula}" class="mx-auto bg-transparent" /></div>`;
    });
  };

  const finalContent = typeof content === 'string' ? processForCodeCogs(content) : null;

  return (
    <div 
      ref={containerRef} 
      className={`math-resilience-box ${className} ${useFallback ? 'math-fallback-active' : ''}`}
      {...(finalContent 
        ? { dangerouslySetInnerHTML: { __html: finalContent } } 
        : { children: content || children }
      )}
    />
  );
}
