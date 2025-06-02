import { useEffect, useState } from "react";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

interface AnimatedValueProps {
  value: number;
  suffix?: string;
  format?: (val: number) => string;
}

export function AnimatedValue({
  value,
  suffix = "",
  format,
}: AnimatedValueProps) {
  const mv = useMotionValue(0);
  const text = useTransform(mv, (v) => (format ? format(v) : v.toFixed(1)));

  const [display, setDisplay] = useState<string>(text.get());

  useEffect(() => {
    const unsubscribe = text.on("change", (v) => setDisplay(v));
    return unsubscribe;
  }, [text]);

  useEffect(() => {
    animate(mv, value, { duration: 1 });
  }, [value, mv]);

  return (
    <motion.span>
      {display}
      {suffix}
    </motion.span>
  );
}
