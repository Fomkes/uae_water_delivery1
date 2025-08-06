'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { LogOut, Package, Upload, Download } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedIn = localStorage.getItem('admin-logged-in');
    if (!loggedIn && pathname !== '/admin/login') {
      router.push('/admin/login');
    } else {
      setIsLoggedIn(true);
    }
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem('admin-logged-in');
    localStorage.removeItem('admin-user');
    router.push('/admin/login');
  };

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (!isLoggedIn) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-md min-h-screen">
          <div className="p-6 border-b">
            <h1 className="text-xl font-bold">UAE Waters Admin</h1>
          </div>
          
          <nav className="p-4 space-y-2">
            <Link href="/admin/dashboard" className="flex items-center p-2 rounded hover:bg-gray-100">
              <Package className="h-4 w-4 mr-2" />
              Dashboard
            </Link>
            <Link href="/admin/products/parse" className="flex items-center p-2 rounded hover:bg-gray-100">
              <Upload className="h-4 w-4 mr-2" />
              Parse Products
            </Link>
            <Link href="/admin/products/export" className="flex items-center p-2 rounded hover:bg-gray-100">
              <Download className="h-4 w-4 mr-2" />
              Export Catalog
            </Link>
          </nav>

          <div className="absolute bottom-4 left-4">
            <Button onClick={handleLogout} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
