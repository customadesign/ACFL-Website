// Logo.tsx
import { motion } from "framer-motion";
import Image from "next/image";

interface LogoProps {
  size?: number;
  className?: string;
}

export default function Logo({ size = 32, className = "" }: LogoProps) {
  // Build className to avoid hydration issues
  const finalClassName = ['inline-block', className].filter(Boolean).join(' ');
  
  return (
    <motion.div
      className={finalClassName}
      initial={{ rotate: 0 }}
      whileHover={{ rotate: 360 }}
      transition={{ duration: 1.6, ease: "easeInOut" }}
    >
      <Image
        src="https://storage.googleapis.com/msgsndr/12p9V9PdtvnTPGSU0BBw/media/672420528abc730356eeaad5.png"
        alt="ACT Coaching for Life logo"
        width={size}
        height={size}
        className="select-none"
      />
    </motion.div>
  );
}