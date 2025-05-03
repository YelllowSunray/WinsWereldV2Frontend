import './globals.css';
import Navbar from './components/Navbar';

export const metadata = {
  title: 'Winswereld',
  description: 'Winswereld World Shop',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Navbar />
        <main>
          {children}
        </main>
      </body>
    </html>
  );
} 