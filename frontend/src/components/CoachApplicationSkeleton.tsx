import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface CoachApplicationSkeletonProps {
  count?: number;
}

const SingleCoachApplicationSkeleton = () => (
  <Card className="animate-pulse bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
    <CardContent className="p-4 sm:p-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:items-start lg:space-y-0">
        <div className="flex-1 min-w-0">
          {/* Header with name and status */}
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-3 mb-3">
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded-full w-20 flex-shrink-0"></div>
          </div>
          
          {/* Details grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3">
            <div className="space-y-2">
              {/* Email */}
              <div className="flex items-center space-x-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
              </div>
              {/* Phone */}
              <div className="flex items-center space-x-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-12"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
              {/* Experience */}
              <div className="flex items-center space-x-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
              </div>
            </div>
            <div className="space-y-2">
              {/* ACT Training */}
              <div className="flex items-center space-x-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-36"></div>
              </div>
              {/* Languages */}
              <div className="flex items-center space-x-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-18"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-28"></div>
              </div>
              {/* Submitted */}
              <div className="flex items-center space-x-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
              </div>
            </div>
          </div>
          
          {/* Expertise */}
          <div className="flex items-center space-x-2">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-16"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64"></div>
          </div>
        </div>
        
        {/* Action buttons */}
        <div className="flex flex-row space-x-2 lg:flex-col lg:space-x-0 lg:space-y-2 lg:ml-4 flex-shrink-0">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20 flex-1 lg:flex-none"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20 flex-1 lg:flex-none"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-20 flex-1 lg:flex-none"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function CoachApplicationSkeleton({ count = 5 }: CoachApplicationSkeletonProps) {
  return (
    <div className="space-y-4 sm:space-y-6 p-4 sm:p-6">
      {/* Header skeleton */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div>
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2"></div>
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-80"></div>
        </div>
        
        <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
        </div>
      </div>

      {/* Applications list skeleton */}
      <div className="grid gap-3 sm:gap-4">
        {Array.from({ length: count }, (_, index) => (
          <SingleCoachApplicationSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}