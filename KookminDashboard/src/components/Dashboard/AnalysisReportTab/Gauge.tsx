import React, { useEffect } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface GaugeProps {
  percent: number;
  color: string;
  loading?: boolean;
}

export function Gauge({ percent, color, loading = false }: GaugeProps) {
  const radius = 63;
  const centerX = 70;
  const centerY = 80;
  const circumference = Math.PI * radius;

  const motionPercent = useMotionValue(0);
  const dashOffset = useTransform(
    motionPercent,
    (v) => circumference * (1 - v / 100)
  );

  useEffect(() => {
    motionPercent.set(0);
    animate(motionPercent, percent, {
      duration: 1,
      ease: "easeOut",
    });
  }, [percent, motionPercent]);

  return (
    <svg width="135" height="80" viewBox="0 0 140 80">
      <motion.path
        d={`
          M ${centerX - radius} ${centerY}
          A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}
        `}
        fill="none"
        stroke="#E5E5E5"
        strokeWidth="12"
        animate={loading ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }}
        transition={
          loading
            ? {
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : {}
        }
      />

      <motion.path
        d={`
          M ${centerX - radius} ${centerY}
          A ${radius} ${radius} 0 0 1 ${centerX + radius} ${centerY}
        `}
        fill="none"
        stroke={color}
        strokeWidth="12"
        strokeDasharray={circumference}
        style={{ strokeDashoffset: dashOffset }}
        strokeLinecap="round"
        animate={loading ? { opacity: [0.3, 1, 0.3] } : { opacity: 1 }}
        transition={
          loading
            ? {
                duration: 1.2,
                repeat: Infinity,
                ease: "easeInOut",
              }
            : {}
        }
      />
    </svg>
  );
}
