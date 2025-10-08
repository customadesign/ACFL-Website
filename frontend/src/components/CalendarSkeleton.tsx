import React from 'react';

const CalendarSkeleton = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-80 mb-2"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-96"></div>
      </div>

      {/* Action buttons skeleton */}
      <div className="flex flex-wrap gap-4 mb-8">
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-48"></div>
        <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded-lg w-32"></div>
      </div>

      {/* Weekly Schedule skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 mb-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40"></div>
          </div>
        </div>
        <div className="p-6">
          {/* Days of week skeleton */}
          {Array.from({ length: 7 }, (_, dayIndex) => (
            <div key={dayIndex} className="mb-6 last:mb-0">
              <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-20 mb-3"></div>
              {/* Random number of slots per day (0-3) */}
              {Array.from({ length: Math.floor(Math.random() * 4) }, (_, slotIndex) => (
                <div key={slotIndex} className="ml-4 mb-2 last:mb-0">
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-48"></div>
                        <div className="h-5 bg-gray-200 dark:bg-gray-600 rounded-full w-16"></div>
                      </div>
                      {/* Optional title skeleton */}
                      {Math.random() > 0.5 && (
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-40"></div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                      <div className="h-8 w-8 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    </div>
                  </div>
                </div>
              ))}
              {/* Show "No availability" for some days */}
              {Math.floor(Math.random() * 4) === 0 && (
                <div className="ml-4">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Blocked Time skeleton */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          </div>
        </div>
        <div className="p-6">
          {/* Random blocked slots (0-3) */}
          {Array.from({ length: Math.floor(Math.random() * 4) }, (_, index) => (
            <div key={index} className="mb-3 last:mb-0">
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="h-5 bg-red-200 dark:bg-red-800 rounded w-24"></div>
                    <div className="h-4 bg-red-200 dark:bg-red-800 rounded w-32"></div>
                  </div>
                  {/* Optional reason */}
                  {Math.random() > 0.5 && (
                    <div className="h-4 bg-red-200 dark:bg-red-800 rounded w-40"></div>
                  )}
                </div>
                <div className="h-8 w-8 bg-red-200 dark:bg-red-800 rounded"></div>
              </div>
            </div>
          ))}
          {/* Show "No blocked time" for empty state */}
          {Math.floor(Math.random() * 4) === 0 && (
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48"></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalendarSkeleton;