import { assertResourceName } from '@/resourceName';
assertResourceName();

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: 'zloma_apartments' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
