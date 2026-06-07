import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../components/AuthProvider';
import SidebarAndMain from '../components/SidebarAndMain';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Admin | Es Mi Prode',
  description: 'Panel de Administración',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head />
      <body className={`${inter.className} bg-slate-50 text-slate-900 min-h-screen`}>
        <AuthProvider>
          <SidebarAndMain>
            {children}
          </SidebarAndMain>
        </AuthProvider>
      </body>
    </html>
  );
}
