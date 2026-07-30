import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'SubTrackr — Subscription Manager',
  description: 'Track all your subscriptions in one beautiful dashboard.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <AuthProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: 'rgba(13, 13, 22, 0.95)',
                color: '#f1f5f9',
                border: '1px solid rgba(99,102,241,0.25)',
                borderRadius: '10px',
                fontSize: '13.5px',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
              },
              success: { iconTheme: { primary: '#818cf8', secondary: '#0a0a0f' } },
              error:   { iconTheme: { primary: '#f87171', secondary: '#0a0a0f' } },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
