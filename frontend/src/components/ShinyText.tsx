interface ShinyTextProps {
  text: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
}

const ShinyText = ({ text, disabled = false, speed = 5, className = '' }: ShinyTextProps) => {
  const animationDuration = `${speed}s`;
  
  // Build className parts separately to avoid hydration issues
  const baseClasses = 'text-white bg-clip-text inline-block';
  const animateClass = disabled ? '' : 'animate-shine';
  const finalClassName = [baseClasses, animateClass, className].filter(Boolean).join(' ');

  return (
    <div
      className={finalClassName}
      style={{
        backgroundImage: 'linear-gradient(120deg, rgba(255, 255, 255, 0) 40%, rgba(255, 255, 255, 0.8) 50%, rgba(255, 255, 255, 0) 60%)',
        backgroundSize: '200% 100%',
        WebkitBackgroundClip: 'text',
        animationDuration: animationDuration,
      }}
    >
      {text}
    </div>
  );
};

export default ShinyText;