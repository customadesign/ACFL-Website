import * as React from "react"
import { motion } from "framer-motion"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import Image from "next/image"

const loadingVariants = cva(
  "flex items-center justify-center",
  {
    variants: {
      variant: {
        spin: "animate-spin",
        pulse: "animate-pulse",
        bounce: "",
        breathe: "",
        orbit: "",
        wave: "",
      },
      size: {
        sm: "w-6 h-6",
        default: "w-8 h-8",
        lg: "w-12 h-12",
        xl: "w-16 h-16",
        "2xl": "w-24 h-24",
      },
    },
    defaultVariants: {
      variant: "spin",
      size: "default",
    },
  }
)

export interface LoadingProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof loadingVariants> {
  text?: string
  showText?: boolean
  logoSrc?: string
}

// Animation variants for Framer Motion
// Note: These will automatically respect user's reduce-motion preferences
const spinAnimation = {
  animate: {
    rotate: 360,
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "linear",
  },
}

const pulseAnimation = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [1, 0.8, 1],
  },
  transition: {
    duration: 1.5,
    repeat: Infinity,
    ease: "easeInOut",
  },
}

const bounceAnimation = {
  animate: {
    y: [0, -10, 0],
    scale: [1, 1.05, 1],
  },
  transition: {
    duration: 1.2,
    repeat: Infinity,
    ease: "easeInOut",
  },
}

const breatheAnimation = {
  animate: {
    scale: [1, 1.15, 1],
    rotate: [0, 5, -5, 0],
  },
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut",
  },
}

const orbitAnimation = {
  animate: {
    rotate: 360,
  },
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "linear",
  },
}

const waveAnimation = {
  animate: {
    rotate: [0, 10, -10, 0],
    scale: [1, 1.05, 0.95, 1],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut",
  },
}

// Reduced motion alternatives
const staticAnimation = {
  animate: {
    opacity: [0.7, 1, 0.7],
  },
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut",
  },
}

const getAnimationProps = (variant: string) => {
  // Check if user prefers reduced motion
  const prefersReducedMotion = typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  if (prefersReducedMotion) {
    return staticAnimation
  }

  switch (variant) {
    case "spin":
      return spinAnimation
    case "pulse":
      return pulseAnimation
    case "bounce":
      return bounceAnimation
    case "breathe":
      return breatheAnimation
    case "orbit":
      return orbitAnimation
    case "wave":
      return waveAnimation
    default:
      return spinAnimation
  }
}

const Loading = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({
    className,
    variant = "spin",
    size = "default",
    text = "Loading...",
    showText = true,
    logoSrc,
    ...props
  }, ref) => {
    const animationProps = getAnimationProps(variant || "spin")
    const logoPath = logoSrc || "/src/assets/act-coaching-logo.png"

    // Get size in pixels for the Image component
    const getSizeInPixels = (size: string) => {
      switch (size) {
        case "sm": return 24
        case "default": return 32
        case "lg": return 48
        case "xl": return 64
        case "2xl": return 96
        default: return 32
      }
    }

    const imageSize = getSizeInPixels(size || "default")

    return (
      <div
        className={cn("flex flex-col items-center justify-center gap-3", className)}
        ref={ref}
        {...props}
      >
        <motion.div
          className={cn(loadingVariants({ variant: null, size }))}
          {...animationProps}
          aria-label={showText ? undefined : text}
          role="status"
          aria-live="polite"
        >
          <Image
            src={logoPath}
            alt=""
            width={imageSize}
            height={imageSize}
            className="select-none"
            priority
            aria-hidden="true"
          />
        </motion.div>

        {showText && (
          <motion.p
            className="text-sm text-muted-foreground font-medium sr-only sm:not-sr-only"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            aria-live="polite"
            id="loading-text"
          >
            {text}
          </motion.p>
        )}

        {/* Screen reader only text for accessibility */}
        <span className="sr-only" aria-live="assertive">
          {text}
        </span>
      </div>
    )
  }
)

Loading.displayName = "Loading"

// Specialized loading components for different use cases
export const LoadingSpinner = React.forwardRef<HTMLDivElement, Omit<LoadingProps, 'variant'>>(
  (props, ref) => <Loading ref={ref} variant="spin" {...props} />
)

export const LoadingPulse = React.forwardRef<HTMLDivElement, Omit<LoadingProps, 'variant'>>(
  (props, ref) => <Loading ref={ref} variant="pulse" {...props} />
)

export const LoadingBounce = React.forwardRef<HTMLDivElement, Omit<LoadingProps, 'variant'>>(
  (props, ref) => <Loading ref={ref} variant="bounce" {...props} />
)

export const LoadingBreathe = React.forwardRef<HTMLDivElement, Omit<LoadingProps, 'variant'>>(
  (props, ref) => <Loading ref={ref} variant="breathe" {...props} />
)

export const LoadingOrbit = React.forwardRef<HTMLDivElement, Omit<LoadingProps, 'variant'>>(
  (props, ref) => <Loading ref={ref} variant="orbit" {...props} />
)

export const LoadingWave = React.forwardRef<HTMLDivElement, Omit<LoadingProps, 'variant'>>(
  (props, ref) => <Loading ref={ref} variant="wave" {...props} />
)

// Full-screen loading overlay
export const LoadingOverlay = React.forwardRef<HTMLDivElement, LoadingProps>(
  ({ className, ...props }, ref) => (
    <div
      className={cn(
        "fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center",
        className
      )}
      ref={ref}
    >
      <Loading {...props} />
    </div>
  )
)

LoadingOverlay.displayName = "LoadingOverlay"

// Inline loading for buttons
export const LoadingButton = React.forwardRef<HTMLDivElement, Omit<LoadingProps, 'showText'>>(
  ({ size = "sm", ...props }, ref) => (
    <Loading ref={ref} size={size} showText={false} {...props} />
  )
)

LoadingButton.displayName = "LoadingButton"

export { Loading, loadingVariants }