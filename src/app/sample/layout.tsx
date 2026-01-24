import {
  Cormorant_Garamond,
  DM_Sans,
  Space_Mono,
  Libre_Baskerville,
  Source_Sans_3,
} from 'next/font/google';

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
});

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

const libreBaskerville = Libre_Baskerville({
  subsets: ['latin'],
  weight: ['400', '700'],
  style: ['normal', 'italic'],
  variable: '--font-libre-baskerville',
  display: 'swap',
});

const sourceSans3 = Source_Sans_3({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-source-sans',
  display: 'swap',
});

export default function SampleLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`${cormorantGaramond.variable} ${dmSans.variable} ${spaceMono.variable} ${libreBaskerville.variable} ${sourceSans3.variable}`}
    >
      {children}
    </div>
  );
}
