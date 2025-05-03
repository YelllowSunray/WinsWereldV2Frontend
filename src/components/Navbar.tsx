'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'bg-blue-700' : 'hover:bg-blue-600';
  };

  return (
    <nav className="bg-blue-600 text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/" className="text-xl font-bold">
            Winswereld
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-4">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/dashboard')}`}
            >
              Dashboard
            </Link>
            <Link
              href="/inventory"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/inventory')}`}
            >
              Inventory
            </Link>
            <Link
              href="/store"
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/store')}`}
            >
              Store
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
} 