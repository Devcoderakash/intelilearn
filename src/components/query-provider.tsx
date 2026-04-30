
'use client';

// Removed @tanstack/react-query to ensure build stability without installation room
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  );
}
