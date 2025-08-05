import React from 'react';

interface CoachPageWrapperProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export default function CoachPageWrapper({ children, title, description }: CoachPageWrapperProps) {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          <p className="text-gray-600 mt-2">{description}</p>
        </div>
        
        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}