'use client';

import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
}

const MountainBackground = () => (
  <div className="absolute inset-0 overflow-hidden">
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 1200 300"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Gradient Definitions */}
      <defs>
        <linearGradient id="mountainGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(0, 0, 0, 0.15)" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0.25)" />
        </linearGradient>
        <linearGradient id="mountainGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(0, 0, 0, 0.1)" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0.2)" />
        </linearGradient>
        <linearGradient id="mountainGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(0, 0, 0, 0.05)" />
          <stop offset="100%" stopColor="rgba(0, 0, 0, 0.15)" />
        </linearGradient>
      </defs>
      
      {/* Back mountain layer */}
      <path
        d="M0 300 L200 120 L350 160 L500 100 L650 140 L800 80 L950 120 L1200 60 L1200 300 Z"
        fill="url(#mountainGradient3)"
        opacity="0.4"
      />
      
      {/* Middle mountain layer */}
      <path
        d="M0 300 L150 140 L280 180 L420 120 L580 160 L720 100 L880 140 L1000 80 L1200 100 L1200 300 Z"
        fill="url(#mountainGradient2)"
        opacity="0.6"
      />
      
      {/* Front mountain layer */}
      <path
        d="M0 300 L120 180 L250 220 L380 160 L520 200 L660 140 L800 180 L920 120 L1200 140 L1200 300 Z"
        fill="url(#mountainGradient1)"
        opacity="0.8"
      />
      
      {/* Additional subtle decorative elements */}
      <circle cx="900" cy="50" r="1.5" fill="rgba(255, 255, 255, 0.2)" />
      <circle cx="950" cy="30" r="1" fill="rgba(255, 255, 255, 0.15)" />
      <circle cx="1000" cy="60" r="0.8" fill="rgba(255, 255, 255, 0.1)" />
    </svg>
  </div>
);

export default function PageHeader({ title, subtitle, breadcrumbs = [] }: PageHeaderProps) {
  return (
    <div className="relative bg-gradient-to-br from-[#007E76] via-[#008B82] to-[#009688] rounded-b-2xl shadow-lg border-b border-teal-800/20 overflow-hidden">
      {/* Mountain Background */}
      <MountainBackground />
      
      {/* Content */}
      <div className="relative z-10 px-8 py-6">
        {/* Breadcrumbs */}
        {breadcrumbs.length > 0 && (
          <nav className="mb-2" aria-label="Breadcrumb">
            <div className="flex items-center space-x-2 text-sm">
              {breadcrumbs.map((item, index) => (
                <div key={index} className="flex items-center">
                  {index > 0 && (
                    <ChevronRight className="h-4 w-4 text-white/60 mx-2" />
                  )}
                  {item.href ? (
                    <a
                      href={item.href}
                      className="text-white/80 hover:text-white transition-colors duration-200 font-medium"
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span className="text-white/90 font-medium">
                      {item.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </nav>
        )}
        
        {/* Title */}
        <div className="flex items-baseline">
          <h1 className="text-3xl font-bold text-white drop-shadow-sm">
            {title}
          </h1>
        </div>
        
        {/* Subtitle */}
        {subtitle && (
          <p className="mt-2 text-white/90 font-medium drop-shadow-sm">
            {subtitle}
          </p>
        )}
      </div>
      
      {/* Subtle overlay for better text contrast */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/5 to-black/10 pointer-events-none" />
    </div>
  );
}