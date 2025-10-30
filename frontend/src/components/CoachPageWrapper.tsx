import React from 'react';

interface CoachPageWrapperProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export default function CoachPageWrapper({ children, title, description }: CoachPageWrapperProps) {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{title}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1.5">{description}</p>
        </div>
        
        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}