"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface AnimatedListProps {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}

export function AnimatedList({
  children,
  delay = 1000,
  className,
}: AnimatedListProps) {
  const childrenArray = useMemo(
    () => React.Children.toArray(children),
    [children]
  );

  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (visibleCount >= childrenArray.length) return;
    const timeout = setTimeout(() => {
      setVisibleCount((prev) => prev + 1);
    }, delay);
    return () => clearTimeout(timeout);
  }, [visibleCount, childrenArray.length, delay]);

  const visibleChildren = childrenArray.slice(0, visibleCount);

  return (
    <div className={className}>
      <AnimatePresence initial={false}>
        {visibleChildren.map((child, index) => (
          <AnimatedListItem key={(child as React.ReactElement).key || index}>
            {child}
          </AnimatedListItem>
        ))}
      </AnimatePresence>
    </div>
  );
}

function AnimatedListItem({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{
        type: "spring",
        stiffness: 350,
        damping: 25,
      }}
    >
      {children}
    </motion.div>
  );
}
