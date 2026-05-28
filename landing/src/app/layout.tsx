import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'code-weather — Project Health Dashboard',
  description:
    'Run one command. Get a beautiful weather report for your codebase. See your project\'s health forecast.',
  openGraph: {
    title: 'code-weather — Project Health Dashboard',
    description: 'Run one command. Get a beautiful weather report for your codebase.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-[Inter,sans-serif] antialiased">{children}</body>
    </html>
  );
}
