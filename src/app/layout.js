import '@/app/globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';

export const metadata = {
  title: 'MRK FITNESS - Radha Krishna Maram | Personal Fitness & Weight-Loss Specialist',
  description: 'Transform your body with MRK FITNESS. Personalized workout plans, custom diet plans, weekly check-ins, and 24/7 trainer support by Radha Krishna Maram.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body style={{ backgroundColor: 'var(--bg)', color: 'var(--text)', margin: 0 }} suppressHydrationWarning>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
