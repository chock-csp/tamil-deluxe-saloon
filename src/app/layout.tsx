import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tamil Deluxe Saloon (தமிழ் டீ கடை & சலூன் 90s/2000s Hits)',
  description:
    'Nostalgic 24/7 Tamil Radio inspired by saloon.wtf. Enjoy curated 90s & 2000s Kollywood cassette hits, Barber shop melodies, and tea kadai classics with daily automated playlist rotation.',
  keywords: [
    'Tamil Radio',
    'Tamil Saloon',
    '90s Tamil Songs',
    '2000s Tamil Songs',
    'Ilaiyaraaja Hits',
    'AR Rahman Melodies',
    'Deva Gaana',
    'Harris Jayaraj Hits',
    'Yuvan Shankar Raja Songs',
    'Tamil Deluxe Saloon',
    'Tea Kadai Songs',
  ],
  applicationName: 'Tamil Deluxe Saloon',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tamil Saloon',
  },
  other: {
    // Helps some Android browsers treat the page as a media app
    'mobile-web-app-capable': 'yes',
  },
  openGraph: {
    title: 'Tamil Deluxe Saloon - தமிழ் டீ கடை & சலூன் 90s/2000s Hits 💈☕',
    description:
      'Live 24/7 Nostalgic Tamil Barber Shop & Tea Kadai Radio with 10 daily rotating playlists.',
    url: 'https://tamil-deluxe-saloon.vercel.app',
    siteName: 'Tamil Deluxe Saloon',
    images: [
      {
        url: 'https://tamil-deluxe-saloon.vercel.app/images/minimalist_desktop.png',
        width: 2302,
        height: 1856,
        alt: 'Tamil tea kadai radio',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tamil Deluxe Saloon (தமிழ் டீ கடை & சலூன் 90s/2000s Hits)',
    description: 'Nostalgic 24/7 Tamil Barber Shop & Tea Shop Radio',
    images: ['https://tamil-deluxe-saloon.vercel.app/images/minimalist_desktop.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ta" className="h-full antialiased dark">
      <body className="min-h-full flex flex-col bg-[#efe6d4] text-amber-100 font-sans">
        {children}
      </body>
    </html>
  );
}
