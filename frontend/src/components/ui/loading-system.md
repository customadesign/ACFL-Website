# ACT Coaching Loading System

A comprehensive loading system using the ACT coaching logo with multiple animation variants, built with React, TypeScript, Tailwind CSS, and Framer Motion.

## Components Overview

### Core Loading Component
- **`Loading`** - Main configurable loading component
- **`LoadingOverlay`** - Full-screen loading overlay
- **`LoadingButton`** - Button with integrated loading state

### Animation Variants
- **`LoadingSpinner`** - Classic spinning animation
- **`LoadingPulse`** - Gentle pulsing effect
- **`LoadingBounce`** - Playful bouncing motion
- **`LoadingBreathe`** - Calm breathing effect
- **`LoadingOrbit`** - Smooth orbital rotation
- **`LoadingWave`** - Gentle wave motion

### Hooks
- **`useLoading`** - Basic loading state management
- **`useAsyncLoading`** - Loading state for async operations
- **`useMultipleLoading`** - Multiple loading states
- **`useDebouncedLoading`** - Debounced loading for search/input

## Quick Start

```tsx
import { LoadingSpinner, LoadingButton } from '@/components/ui/loading'
import { useLoading } from '@/hooks/useLoading'

// Basic usage
function MyComponent() {
  return <LoadingSpinner text="Loading..." />
}

// With loading button
function MyForm() {
  const { isLoading, startLoading, stopLoading } = useLoading()

  const handleSubmit = async () => {
    startLoading()
    await submitData()
    stopLoading()
  }

  return (
    <LoadingButton
      loading={isLoading}
      loadingText="Submitting..."
      onClick={handleSubmit}
    >
      Submit
    </LoadingButton>
  )
}
```

## Accessibility Features

- **Screen Reader Support**: Proper ARIA labels and live regions
- **Reduced Motion**: Automatically respects `prefers-reduced-motion`
- **Keyboard Navigation**: Maintains focus management
- **Semantic HTML**: Uses proper roles and landmarks

## Animation Recommendations

### Use Cases by Animation Type

| Animation | Best For | Duration | Energy Level |
|-----------|----------|----------|--------------|
| **Spin** | General loading, quick actions | 2s | Medium |
| **Pulse** | Gentle feedback, form validation | 1.5s | Low |
| **Bounce** | Playful interactions, games | 1.2s | High |
| **Breathe** | Meditation, wellness, payment processing | 3s | Very Low |
| **Orbit** | Dashboard loading, complex operations | 4s | Medium |
| **Wave** | Communication, messaging | 2s | Medium |

### Size Guidelines

| Size | Pixels | Use Case |
|------|--------|----------|
| `sm` | 24px | Inline text, buttons |
| `default` | 32px | Cards, modals |
| `lg` | 48px | Section loading |
| `xl` | 64px | Page transitions |
| `2xl` | 96px | Full-screen overlays |

## Implementation Examples

### 1. Form Submission
```tsx
<LoadingButton
  loading={isSubmitting}
  loadingText="Creating account..."
  loadingVariant="breathe"
  onClick={handleSignUp}
>
  Sign Up
</LoadingButton>
```

### 2. Data Fetching
```tsx
{isLoading ? (
  <LoadingSpinner
    variant="orbit"
    text="Loading your dashboard..."
    size="lg"
  />
) : (
  <DataTable data={data} />
)}
```

### 3. Payment Processing
```tsx
<LoadingButton
  loading={isProcessing}
  loadingText="Processing payment..."
  loadingVariant="pulse"
  disabled={!isValid}
>
  Pay $99.00
</LoadingButton>
```

### 4. Full Screen Loading
```tsx
{isInitialLoad && (
  <LoadingOverlay
    variant="breathe"
    size="xl"
    text="Preparing your session..."
  />
)}
```

## API Reference

### Loading Props
```tsx
interface LoadingProps {
  variant?: "spin" | "pulse" | "bounce" | "breathe" | "orbit" | "wave"
  size?: "sm" | "default" | "lg" | "xl" | "2xl"
  text?: string
  showText?: boolean
  logoSrc?: string
  className?: string
}
```

### LoadingButton Props
```tsx
interface LoadingButtonProps extends ButtonProps {
  loading?: boolean
  loadingText?: string
  loadingVariant?: LoadingVariant
}
```

### useLoading Hook
```tsx
interface LoadingState {
  isLoading: boolean
  error: string | null
  startLoading: () => void
  stopLoading: () => void
  setError: (error: string | null) => void
  reset: () => void
}
```

## Theming & Customization

The loading components inherit from your existing design system:

- Uses Tailwind CSS utilities
- Respects light/dark theme
- Follows existing color palette
- Maintains consistent spacing

### Custom Logo
```tsx
<Loading logoSrc="/custom-logo.png" />
```

### Custom Styling
```tsx
<Loading
  className="custom-loading-styles"
  variant="spin"
  size="lg"
/>
```

## Performance Considerations

1. **Logo Optimization**: Uses Next.js Image component with priority loading
2. **Animation Performance**: Leverages Framer Motion's optimized animations
3. **Bundle Size**: Tree-shakeable exports
4. **Accessibility**: Automatic reduced-motion detection

## Browser Support

- Modern browsers with CSS Grid support
- Framer Motion compatibility
- Fallback for reduced motion preferences

## Migration Guide

### From existing loading states:
```tsx
// Before
{isLoading ? 'Loading...' : 'Submit'}

// After
<LoadingButton loading={isLoading} loadingText="Loading...">
  Submit
</LoadingButton>
```

### From generic spinners:
```tsx
// Before
{isLoading && <div className="spinner" />}

// After
{isLoading && <LoadingSpinner text="Loading..." />}
```