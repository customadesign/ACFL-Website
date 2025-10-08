import React from 'react';

interface DashboardListSkeletonProps {
  count?: number;
  type?: 'appointment' | 'client';
}

const SingleItemSkeleton = ({ type }: { type: 'appointment' | 'client' }) => (
  <div className="flex items-center space-x-3 p-3 rounded-lg animate-pulse">
    {/* Avatar skeleton */}
    <div className={`p-2 rounded-full ${
      type === 'appointment' ? 'bg-blue-100' : 'bg-green-100'
    }`}>
      <div className="w-5 h-5 bg-muted rounded"></div>
    </div>
    
    {/* Content skeleton */}
    <div className="flex-1 space-y-2">
      {/* Name skeleton */}
      <div className="h-4 bg-muted rounded w-32"></div>
      
      {/* Time/Date skeleton */}
      <div className="h-3 bg-muted rounded w-20"></div>
      
      {/* Additional info skeleton for appointments (status badge) or clients (email) */}
      {type === 'appointment' ? (
        <div className="h-5 bg-muted rounded-full w-16 mt-1"></div>
      ) : (
        <div className="h-3 bg-muted rounded w-40"></div>
      )}
    </div>
    
    {/* Arrow skeleton */}
    <div className="w-4 h-4 bg-muted rounded"></div>
  </div>
);

export default function DashboardListSkeleton({ count = 3, type = 'appointment' }: DashboardListSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <SingleItemSkeleton key={index} type={type} />
      ))}
    </div>
  );
}