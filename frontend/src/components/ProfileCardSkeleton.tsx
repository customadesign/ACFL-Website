import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface ProfileCardSkeletonProps {
  type?: 'stats' | 'form';
}

const StatsCardSkeleton = () => (
  <Card className="bg-card border-border">
    <CardContent className="p-6">
      <div className="flex items-center animate-pulse">
        <div className="p-2 bg-muted rounded-lg">
          <div className="w-6 h-6 bg-muted-foreground/20 rounded"></div>
        </div>
        <div className="ml-4 space-y-2">
          <div className="h-4 bg-muted rounded w-24"></div>
          <div className="h-6 bg-muted rounded w-12"></div>
        </div>
      </div>
    </CardContent>
  </Card>
);

const FormSkeleton = () => (
  <Card className="bg-card border-border">
    <CardContent className="p-6 space-y-6 animate-pulse">
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-6 bg-muted rounded w-40"></div>
          <div className="h-4 bg-muted rounded w-64"></div>
        </div>
        <div className="h-10 bg-muted rounded w-32"></div>
      </div>

      {/* Form sections */}
      <div className="space-y-8">
        {/* Availability toggle */}
        <div className="p-4 bg-muted/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-5 bg-muted rounded w-32"></div>
              <div className="h-4 bg-muted rounded w-48"></div>
            </div>
            <div className="h-6 bg-muted rounded-full w-12"></div>
          </div>
        </div>

        {/* Form fields section */}
        <div className="space-y-6">
          <div className="h-6 bg-muted rounded w-48"></div>
          
          {/* Grid of form fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }, (_, index) => (
              <div key={index} className="space-y-2">
                <div className="h-4 bg-muted rounded w-24"></div>
                <div className="h-10 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>

          {/* Bio field */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-16"></div>
            <div className="h-24 bg-muted rounded w-full"></div>
          </div>

          {/* Specialties section */}
          <div className="space-y-4">
            <div className="h-5 bg-muted rounded w-32"></div>
            <div className="border border-muted rounded-md p-3">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Array.from({ length: 9 }, (_, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Languages section */}
          <div className="space-y-4">
            <div className="h-5 bg-muted rounded w-28"></div>
            <div className="border border-muted rounded-md p-3">
              <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                {Array.from({ length: 8 }, (_, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="h-4 w-4 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function ProfileCardSkeleton({ type = 'form' }: ProfileCardSkeletonProps) {
  if (type === 'stats') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {Array.from({ length: 4 }, (_, index) => (
          <StatsCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return <FormSkeleton />;
}