import Image from 'next/image';
import React from 'react';
import SignUpComponent from '../_components/sign-up-component';

const SignInPage = () => {
  return (
    <div className="flex mx-auto max-w-screen-sm h-screen items-center justify-center flex-col w-full">
      <Image
        style={{ objectFit: "contain" }}
        height={154}
        width={230}
        alt="edutainment"
        src="/images/logo.png"
      />
      <SignUpComponent />

    </div>
  );
};

export default SignInPage;
