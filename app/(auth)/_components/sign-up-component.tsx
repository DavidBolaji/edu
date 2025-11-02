'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';

import Steper from '@/app/_components/steper/steper';
import { useMultiStep } from '@/app/_hooks/use-multiple-step';
import SignUpOneForm from '../_forms/sign-up-one-form';
import SignUpTwoForm from '../_forms/sign-up-two-form';
import SignUpThreeForm from '../_forms/sign-up-three-form';
import Link from 'next/link';

const SignUpComponent = () => {
  const { currentStep, nextStep, prevStep } = useMultiStep(3);
  const steps = [
    <SignUpOneForm key="one" nextStep={nextStep} />,
    <SignUpTwoForm key="two" nextStep={nextStep} prevStep={prevStep} />,
    <SignUpThreeForm key="three" nextStep={nextStep} prevStep={prevStep} />,
  ];

  return (
    <>
      <AnimatePresence mode="wait">
        <div className="w-full max-w-md h-screen scrollbar-hide overflow-auto mx-auto pb-28">
          <Steper step={currentStep} steps={steps} />
        </div>
      </AnimatePresence>
      <div className="w-full text-center bg-primary items-center mt">
        <p className="text-white italic">
          Have an account already? <Link href={'/sign-in'}>Login</Link>
        </p>
      </div>
    </>
  );
};

export default SignUpComponent;
