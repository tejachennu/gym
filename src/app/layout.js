import '@/app/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata = {
  title: 'MRK FITNESS COACH - Radha Krishna Maram | Personal Weight-Loss & Fitness Specialist',
  description: 'Transform your body with MRK FITNESS COACH. Personalized workout plans, custom diet plans, weekly check-ins, and 24/7 support by Radha Krishna Maram.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'MRK FITNESS COACH',
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#E00008',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', margin: 0 }} suppressHydrationWarning>
        <ThemeProvider>
          <AuthProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
