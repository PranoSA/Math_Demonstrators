//layout.tsx for next.js

import Link from 'next/link';

export const metadata = {
  title: 'Base64 Visualizer',
  description: 'By PranoSA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children} </>;
}
