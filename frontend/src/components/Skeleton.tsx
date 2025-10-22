import { cn } from "@/lib/utils"

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-gray-200 dark:bg-gray-700",
        className
      )}
    />
  )
}

// Common skeleton patterns
export function SkeletonText({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-4 w-full", className)} />
}

export function SkeletonHeading({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-8 w-3/4", className)} />
}

export function SkeletonCard({ className }: SkeletonProps) {
  return (
    <div className={cn("rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-4", className)}>
      <SkeletonHeading />
      <SkeletonText />
      <SkeletonText className="w-5/6" />
      <SkeletonText className="w-4/6" />
    </div>
  )
}

export function SkeletonAvatar({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-12 w-12 rounded-full", className)} />
}

export function SkeletonButton({ className }: SkeletonProps) {
  return <Skeleton className={cn("h-10 w-24 rounded-md", className)} />
}
