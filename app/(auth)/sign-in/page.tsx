import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import SignInForm from '../_forms/sign-in-form';

const SignInPage = () => {
  return (
    <div className="flex mx-auto max-w-screen-sm items-center justify-center flex-col w-full">
      <Image
        style={{ objectFit: "contain" }}
        height={154}
        width={230}
        alt="edutainment"
        src="/images/logo.png"
      />
      <SignInForm />
    
    </div>
  );
};

export default SignInPage;
