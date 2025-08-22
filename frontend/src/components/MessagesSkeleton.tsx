import React from 'react';

export default function MessagesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Conversations List Skeleton */}
      <div className="border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 overflow-hidden h-[70vh] flex flex-col">
        <div className="p-3 border-b dark:border-gray-700">
          <div className="h-5 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-3 border-b dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-2 animate-pulse"></div>
                  <div className="h-3 w-36 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                </div>
                <div className="h-5 w-5 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages Area Skeleton */}
      <div className="md:col-span-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 flex flex-col overflow-hidden h-[70vh]">
        <div className="p-3 border-b dark:border-gray-700">
          <div className="h-5 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
          {/* Received message skeleton */}
          <div className="max-w-[75%]">
            <div className="px-3 py-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
              <div className="h-4 w-48 bg-gray-200 dark:bg-gray-600 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>
            <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-1 animate-pulse"></div>
          </div>

          {/* Sent message skeleton */}
          <div className="max-w-[75%] ml-auto">
            <div className="px-3 py-2 rounded-lg bg-blue-600 shadow-sm">
              <div className="h-4 w-48 bg-blue-500 rounded animate-pulse mb-1"></div>
              <div className="h-4 w-32 bg-blue-500 rounded animate-pulse"></div>
            </div>
            <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-1 ml-auto animate-pulse"></div>
          </div>

          {/* Another received message */}
          <div className="max-w-[75%]">
            <div className="px-3 py-2 rounded-lg bg-white dark:bg-gray-700 shadow-sm">
              <div className="h-4 w-64 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
            </div>
            <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-1 animate-pulse"></div>
          </div>

          {/* Another sent message */}
          <div className="max-w-[75%] ml-auto">
            <div className="px-3 py-2 rounded-lg bg-blue-600 shadow-sm">
              <div className="h-4 w-40 bg-blue-500 rounded animate-pulse"></div>
            </div>
            <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-1 ml-auto animate-pulse"></div>
          </div>
        </div>
        
        {/* Input area skeleton */}
        <div className="p-3 border-t dark:border-gray-700">
          <div className="flex gap-2">
            <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="flex-1 h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}