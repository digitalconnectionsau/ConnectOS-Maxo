'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Building2, Users, Phone, MessageSquare, Menu, X, Mail, Printer, FolderOpen, Settings } from 'lucide-react';

interface SidebarProps {
  contactsCount?: number;
  callsCount?: number;
  messagesCount?: number;
  emailsCount?: number;
  faxCount?: number;
  fileTransferCount?: number;
}

export default function Sidebar({ 
  contactsCount = 0, 
  callsCount = 0, 
  messagesCount = 0,
  emailsCount = 0,
  faxCount = 0,
  fileTransferCount = 0
}: SidebarProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Building2,
      count: null,
      path: '/dashboard'
    },
    {
      id: 'contacts',
      label: 'Contacts',
      icon: Users,
      count: contactsCount,
      path: '/contacts'
    },
    {
      id: 'calling',
      label: 'Calling',
      icon: Phone,
      count: callsCount,
      path: '/calling'
    },
    {
      id: 'emails',
      label: 'Emails',
      icon: Mail,
      count: emailsCount,
      path: '/emails'
    },
    {
      id: 'sms',
      label: 'SMS',
      icon: MessageSquare,
      count: messagesCount,
      path: '/sms'
    },
    {
      id: 'fax',
      label: 'Fax',
      icon: Printer,
      count: faxCount,
      path: '/fax'
    },
    {
      id: 'file-transfer',
      label: 'File Transfer',
      icon: FolderOpen,
      count: fileTransferCount,
      path: '/file-transfer'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      count: null,
      path: '/settings'
    }
  ];

  return (
    <div 
      className={`${sidebarCollapsed ? 'w-20' : 'w-64 shadow-xl'} h-full transition-all duration-300 ease-in-out flex-shrink-0 fixed left-0 top-16 z-50`}
      style={{ backgroundColor: '#007E76', height: 'calc(100vh - 4rem)' }}
    >
      {/* Sidebar Header with Toggle */}
      <div className={`flex items-center mb-6 px-4 py-2 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
        {!sidebarCollapsed && (
          <h2 className="text-lg font-semibold text-white">Menu</h2>
        )}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors group"
        >
          {sidebarCollapsed ? (
            <Menu className="h-5 w-5 text-white group-hover:text-teal-800" />
          ) : (
            <X className="h-5 w-5 text-white group-hover:text-teal-800" />
          )}
        </button>
      </div>

      <nav className="space-y-2 px-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.id}
              href={item.path}
              className={`w-full flex items-center text-left rounded-xl transition-all duration-200 font-medium group ${
                sidebarCollapsed 
                  ? 'p-3 justify-center' 
                  : 'px-4 py-3.5'
              } ${
                isActive 
                  ? 'bg-white bg-opacity-20 text-teal-800' 
                  : 'text-white text-opacity-80 hover:bg-white hover:bg-opacity-10 hover:text-teal-800'
              }`}
              title={sidebarCollapsed ? item.label : ''}
            >
              <div className={`flex items-center justify-center flex-shrink-0 ${
                sidebarCollapsed 
                  ? (isActive 
                      ? 'w-10 h-6 bg-white bg-opacity-20 rounded-lg' 
                      : 'w-10 h-6 group-hover:bg-white group-hover:bg-opacity-20 rounded-lg'
                    )
                  : ''
              }`}>
                <item.icon 
                  className={`h-5 w-5 flex-shrink-0 ${
                    sidebarCollapsed 
                      ? (isActive 
                          ? 'text-teal-800' 
                          : 'text-white group-hover:text-teal-800'
                        )
                      : 'mr-3'
                  }`} 
                />
              </div>
              {!sidebarCollapsed && (
                <>
                  {item.label}
                  {item.count !== null && item.count > 0 && (
                    <span className="ml-auto bg-white bg-opacity-30 text-white px-2.5 py-1 rounded-lg text-sm font-medium">
                      {item.count}
                    </span>
                  )}
                </>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}