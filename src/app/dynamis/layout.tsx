import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Dynamis Island — A little space for everything', description: 'Your calm, local-first workspace for ideas, inspiration, and everything in between.', icons: { icon: '/dynamis.svg' } };
export default function Layout({children}: {children: React.ReactNode}) { return children; }
