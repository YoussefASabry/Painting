import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://hala-salah-elhosary.com'),
  title: 'Hala Salah — Original Paintings & Fine Art Gallery',
  description: 'Original paintings for sale. Contemporary fine art gallery featuring landscapes, portraits, abstracts and more.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <div className="bg-stars" />
        <div className="wrapper">
          <Navbar />
          <div className="content-clip">
            <main>{children}</main>
            <Footer />
          </div>
        </div>
      </body>
    </html>
  );
}
