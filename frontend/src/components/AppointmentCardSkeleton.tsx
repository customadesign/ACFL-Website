import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface AppointmentCardSkeletonProps {
  count?: number;
}

const SingleAppointmentSkeleton = () => (
  <Card className="animate-pulse">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div className="space-y-2">
              {/* Client name skeleton */}
              <div className="h-5 bg-muted rounded w-48"></div>
              {/* Email skeleton */}
              <div className="h-4 bg-muted rounded w-36"></div>
              {/* View clients link skeleton */}
              <div className="h-3 bg-muted rounded w-32 mt-1"></div>
            </div>
            {/* Status badge skeleton */}
            <div className="h-6 bg-muted rounded-full w-20"></div>
          </div>
          
          {/* Details grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-20"></div>
              <div className="h-4 bg-muted rounded w-32"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-16"></div>
              <div className="h-4 bg-muted rounded w-24"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-24"></div>
              <div className="h-4 bg-muted rounded w-28"></div>
            </div>
          </div>

          {/* Notes skeleton (optional) */}
          <div className="mt-4 space-y-2">
            <div className="h-4 bg-muted rounded w-12"></div>
            <div className="h-4 bg-muted rounded w-full"></div>
            <div className="h-4 bg-muted rounded w-3/4"></div>
          </div>

          {/* Action buttons skeleton */}
          <div className="mt-4 flex space-x-2">
            <div className="h-8 bg-muted rounded w-20"></div>
            <div className="h-8 bg-muted rounded w-16"></div>
            <div className="h-8 bg-muted rounded w-24"></div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function AppointmentCardSkeleton({ count = 3 }: AppointmentCardSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, index) => (
        <SingleAppointmentSkeleton key={index} />
      ))}
    </div>
  );
}