'use client';
import React, { useState, useEffect, useRef } from 'react';
import { Box, useTheme } from '@mui/material';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';

const SwipeableView = ({ 
  children, 
  activeIndex, 
  onIndexChange, 
  threshold = 50,
  velocity = 0.5,
  resistance = 0.8,
  overshootThreshold = 100,
}) => {
  const theme = useTheme();
  const controls = useAnimation();
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [currentX, setCurrentX] = useState(0);
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setWindowWidth(window.innerWidth);
      const handleResize = () => setWindowWidth(window.innerWidth);
      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (!isDragging && windowWidth > 0) {
      controls.start({
        x: -activeIndex * windowWidth,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        },
      });
    }
  }, [activeIndex, controls, isDragging, windowWidth]);

  const handleDragStart = (event, info) => {
    setIsDragging(true);
    setStartX(info.point.x);
  };

  const handleDragEnd = (event, info) => {
    setIsDragging(false);
    const dragDistance = info.point.x - startX;
    const dragVelocity = info.velocity.x;
    
    const childrenArray = React.Children.toArray(children);
    const maxIndex = childrenArray.length - 1;

    let newIndex = activeIndex;

    if (Math.abs(dragDistance) > threshold || Math.abs(dragVelocity) > velocity * 1000) {
      if (dragDistance > 0 && activeIndex > 0) {
        newIndex = activeIndex - 1;
      } else if (dragDistance < 0 && activeIndex < maxIndex) {
        newIndex = activeIndex + 1;
      }
    }

    if (newIndex !== activeIndex && onIndexChange) {
      onIndexChange(newIndex);
    } else {
      controls.start({
        x: -activeIndex * windowWidth,
        transition: {
          type: 'spring',
          stiffness: 300,
          damping: 30,
        },
      });
    }
  };

  const handleDrag = (event, info) => {
    setCurrentX(info.point.x);
  };

  const childrenArray = React.Children.toArray(children);

  const dragConstraints = {
    left: -(childrenArray.length - 1) * windowWidth - overshootThreshold,
    right: overshootThreshold,
  };

  return (
    <Box
      ref={containerRef}
      sx={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        touchAction: 'pan-y',
        userSelect: 'none',
      }}
    >
      <motion.div
        drag="x"
        dragConstraints={dragConstraints}
        dragElastic={resistance}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{
          display: 'flex',
          height: '100%',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {childrenArray.map((child, index) => (
          <Box
            key={index}
            sx={{
              width: windowWidth || '100vw',
              height: '100%',
              flexShrink: 0,
              overflow: 'auto',
              position: 'relative',
            }}
          >
            <AnimatePresence mode="wait">
              {Math.abs(index - activeIndex) <= 1 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  style={{ height: '100%' }}
                >
                  {child}
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        ))}
      </motion.div>

      {/* Page Indicators */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 0.5,
          padding: '4px 8px',
          borderRadius: 2,
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          backdropFilter: 'blur(10px)',
          zIndex: 10,
        }}
      >
        {childrenArray.map((_, index) => (
          <Box
            key={index}
            onClick={() => onIndexChange && onIndexChange(index)}
            sx={{
              width: index === activeIndex ? 24 : 8,
              height: 8,
              borderRadius: 1,
              backgroundColor: index === activeIndex 
                ? theme.palette.primary.main 
                : 'rgba(255, 255, 255, 0.5)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: index === activeIndex 
                  ? theme.palette.primary.dark 
                  : 'rgba(255, 255, 255, 0.7)',
              },
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

export default SwipeableView;