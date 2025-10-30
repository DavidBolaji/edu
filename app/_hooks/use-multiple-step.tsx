'use client';
import { useState } from 'react';

export const useMultiStep = (totalSteps: number) => {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () =>
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 0));
  const goToStep = (step: number) => setCurrentStep(step);

  return { currentStep, nextStep, prevStep, goToStep, totalSteps };
};
