import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

interface LottieAnimationProps {
  className?: string;
  width?: number;
  height?: number;
}

const LottieAnimation = ({ className = "", width = 400, height = 400 }: LottieAnimationProps) => {
  return (
    <div className={`${className}`} style={{ width, height }}>
      <DotLottieReact
        src="https://lottie.host/516c61b0-d853-4db3-90bc-5e4dd133cd16/bfFxbbkcNu.lottie"
        loop
        autoplay
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default LottieAnimation;