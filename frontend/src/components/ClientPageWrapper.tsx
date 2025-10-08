import React from 'react';

interface ClientPageWrapperProps {
  children: React.ReactNode;
  title: string;
  description: string;
}

export default function ClientPageWrapper({ children, title, description }: ClientPageWrapperProps) {
  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">{title}</h1>
          <p className="text-muted-foreground mt-2">{description}</p>
        </div>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}