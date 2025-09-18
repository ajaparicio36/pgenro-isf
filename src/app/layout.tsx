import type { Metadata } from 'next';
import { Roboto } from 'next/font/google';
import './globals.css';
import { CompanyProvider } from '@/contexts/CompanyContext';
import { Toaster } from '@/components/ui/sonner';

const roboto = Roboto({
  variable: '--font-roboto',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Geotraizer',
  description: 'Blaze through geotagging tasks with ease!',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.className} antialiased`}>
        <CompanyProvider>
          <main className="min-h-screen bg-background p-2">{children}</main>
          <Toaster />
        </CompanyProvider>
      </body>
    </html>
  );
}
