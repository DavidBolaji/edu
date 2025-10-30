import React from 'react';
import { motion } from 'framer-motion';

const Steper: React.FC<{ step: number; steps: React.ReactNode[] }> = ({
  step,
  steps,
}) => {
  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      transition={{ duration: 0.5 }}
      className="mt-4"
    >
      {steps[step]}
    </motion.div>
  );
};

export default Steper;
