'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopNavBar from './TopNavBar';

export default function ConditionalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Pages that should not show the sidebar/top bar
  const noLayoutPages = ['/login', '/register', '/forgot-password'];
  const showLayout = !noLayoutPages.includes(pathname);

  if (!showLayout) {
    // Return children without any layout for login/auth pages
    return <>{children}</>;
  }

  // Return children with top bar and sidebar for app pages
  return (
    <div className="h-screen bg-gray-50 flex flex-col" style={{ overscrollBehavior: 'none' }}>
      {/* Top Navigation Bar */}
      <TopNavBar />
      
      {/* Main Content Area with Sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 ml-20 overflow-auto bg-gradient-to-br from-[#E5F5F2] to-[#F9F9F9]" style={{ overscrollBehavior: 'none' }}>
          <div className="px-6 pb-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}