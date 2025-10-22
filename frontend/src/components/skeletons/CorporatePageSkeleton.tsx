import { Skeleton, SkeletonText, SkeletonHeading, SkeletonCard, SkeletonButton } from "@/components/Skeleton"

export function CorporatePageSkeleton() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* Hero Skeleton */}
      <section className="py-24 md:py-32 lg:py-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-8">
            {/* Title Skeleton */}
            <Skeleton className="h-16 md:h-20 lg:h-24 w-3/4 mx-auto" />

            {/* Description Skeleton */}
            <div className="max-w-4xl mx-auto space-y-3">
              <SkeletonText className="h-6" />
              <SkeletonText className="h-6 w-5/6 mx-auto" />
            </div>

            {/* Buttons Skeleton */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Skeleton className="h-14 w-48" />
              <Skeleton className="h-14 w-48" />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Skeleton */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 md:gap-16 text-center">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-16 w-32 mx-auto" />
                <SkeletonText className="w-40 mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section Skeleton */}
      <section className="py-20 md:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <Skeleton className="h-12 w-2/3 mx-auto" />
            <SkeletonText className="w-3/4 mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Programs Section Skeleton */}
      <section className="py-20 md:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
            <Skeleton className="h-12 w-2/3 mx-auto" />
            <SkeletonText className="w-3/4 mx-auto" />
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-lg p-8 space-y-6">
                <SkeletonHeading />
                <div className="space-y-2">
                  <SkeletonText />
                  <SkeletonText className="w-5/6" />
                </div>
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="flex items-center gap-3">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <SkeletonText className="flex-1" />
                    </div>
                  ))}
                </div>
                <SkeletonButton className="w-full h-12" />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
