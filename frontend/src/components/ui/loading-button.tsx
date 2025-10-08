import * as React from "react"
import { Button, ButtonProps } from "@/components/ui/button"
import { LoadingButton as LoadingIndicator } from "@/components/ui/loading"
import { cn } from "@/lib/utils"

export interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
  loadingVariant?: "spin" | "pulse" | "bounce" | "breathe" | "orbit" | "wave"
}

const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({
    children,
    loading = false,
    loadingText,
    loadingVariant = "spin",
    disabled,
    className,
    ...props
  }, ref) => {
    const isDisabled = disabled || loading

    return (
      <Button
        ref={ref}
        disabled={isDisabled}
        className={cn("relative", className)}
        {...props}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <LoadingIndicator
              variant={loadingVariant}
              size="sm"
            />
            {loadingText || "Loading..."}
          </div>
        ) : (
          children
        )}
      </Button>
    )
  }
)

LoadingButton.displayName = "LoadingButton"

export { LoadingButton }