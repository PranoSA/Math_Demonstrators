//layout.tsx for next.js

import Link from 'next/link';

export const metadata = {
  title: 'Softmax_Visualizer',
  description: 'By PranoSA',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children} </>;
}
