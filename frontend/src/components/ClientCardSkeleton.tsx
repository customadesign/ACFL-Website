import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ClientCardSkeletonProps {
  count?: number;
}

const SingleClientCardSkeleton = () => (
  <Card className="hover:shadow-lg transition-shadow animate-pulse">
    <CardContent className="p-6">
      {/* Header section with name, email and status */}
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          {/* Client name skeleton */}
          <div className="h-5 bg-muted rounded w-32"></div>
          {/* Email skeleton */}
          <div className="h-4 bg-muted rounded w-40"></div>
          {/* Phone skeleton */}
          <div className="h-4 bg-muted rounded w-28"></div>
        </div>
        {/* Status badge skeleton */}
        <div className="h-6 bg-muted rounded-full w-16"></div>
      </div>

      {/* Stats grid skeleton */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="space-y-1">
          <div className="h-4 bg-muted rounded w-24"></div>
          <div className="h-4 bg-muted rounded w-8"></div>
        </div>
        <div className="space-y-1">
          <div className="h-4 bg-muted rounded w-20"></div>
          <div className="h-4 bg-muted rounded w-16"></div>
        </div>
        <div className="space-y-1">
          <div className="h-4 bg-muted rounded w-20"></div>
          <div className="h-4 bg-muted rounded w-16"></div>
        </div>
        <div className="space-y-1">
          <div className="h-4 bg-muted rounded w-20"></div>
          <div className="h-4 bg-muted rounded w-16"></div>
        </div>
      </div>

      {/* Areas of Focus skeleton */}
      <div className="mb-4">
        <div className="h-4 bg-muted rounded w-24 mb-2"></div>
        <div className="flex gap-1">
          <div className="h-6 bg-muted rounded-full w-20"></div>
          <div className="h-6 bg-muted rounded-full w-16"></div>
        </div>
      </div>

      {/* Notes skeleton */}
      <div className="mb-4">
        <div className="h-4 bg-muted rounded w-12 mb-2"></div>
        <div className="space-y-1">
          <div className="h-4 bg-muted rounded w-full"></div>
          <div className="h-4 bg-muted rounded w-3/4"></div>
        </div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex space-x-2">
        <div className="h-8 bg-muted rounded flex-1"></div>
        <div className="h-8 bg-muted rounded flex-1"></div>
      </div>
    </CardContent>
  </Card>
);

export default function ClientCardSkeleton({ count = 6 }: ClientCardSkeletonProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: count }, (_, index) => (
        <SingleClientCardSkeleton key={index} />
      ))}
    </div>
  );
}