import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Arash Dashboard',
  description: 'Meta Ads + Odoo CRM Dashboard',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
