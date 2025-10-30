'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';

import Steper from '@/app/_components/steper/steper';
import { useMultiStep } from '@/app/_hooks/use-multiple-step';
import SignUpOneForm from '../_forms/sign-up-one-form';
import SignUpTwoForm from '../_forms/sign-up-two-form';
import SignUpThreeForm from '../_forms/sign-up-three-form';

const SignUpComponent = () => {
  const { currentStep, nextStep, prevStep } = useMultiStep(3);
  const steps = [
    <SignUpOneForm key="one" nextStep={nextStep} />,
    <SignUpTwoForm key="two" nextStep={nextStep} prevStep={prevStep} />,
    <SignUpThreeForm key="three" nextStep={nextStep} prevStep={prevStep} />,
  ];

  return (
    <AnimatePresence mode="wait">
      <div className="w-full max-w-md h-[90vh] scrollbar-hide overflow-auto mx-auto pb-28">
        <Steper step={currentStep} steps={steps} />
      </div>
    </AnimatePresence>
  );
};

export default SignUpComponent;
