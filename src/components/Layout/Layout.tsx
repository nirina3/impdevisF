import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import { Menu, X } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-neutral-50 to-neutral-100 relative app-container mobile-scroll-fix">
      {/* Sidebar */}
      <div className="hidden lg:flex lg:w-72 xl:w-80 lg:flex-shrink-0 lg:relative">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" style={{ zIndex: 9999 }}>
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300" 
            onClick={() => setSidebarOpen(false)} 
          />
          <div className="fixed inset-y-0 left-0 flex w-full max-w-xs sm:max-w-sm md:max-w-md">
            <div className="relative flex w-full flex-col bg-white shadow-xl mobile-scroll-fix">
              <div className="absolute top-0 right-0 -mr-12 pt-4 sm:pt-2">
                <button
                  type="button"
                  className="ml-1 flex h-12 w-12 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white bg-gray-600 hover:bg-gray-700 transition-colors touch-target"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto mobile-scroll-fix touch-scroll-container">
                <Sidebar onClose={() => setSidebarOpen(false)} />
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen mobile-flex-fix layout-main">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        
        <main className="flex-1 p-0 sm:p-4 lg:p-6 xl:p-8 space-y-4 sm:space-y-6 page-container mobile-scroll-fix touch-page-container page-wrapper">
          <div className="animate-fade-in content-container page-content-mobile">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;