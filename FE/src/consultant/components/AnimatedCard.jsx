import React from 'react';
import { motion } from 'framer-motion';

const AnimatedCard = ({ 
  children, 
  className = '', 
  delay = 0, 
  hover = true,
  ...props 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.5, 
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={hover ? { 
        y: -4, 
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)' 
      } : {}}
      className={`
        bg-white rounded-2xl shadow-lg border border-gray-100 
        overflow-hidden transition-all duration-300
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
};

export default AnimatedCard;
