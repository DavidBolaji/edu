import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import SignUpComponent from '../_components/sign-up-component';

const SignInPage = () => {
  return (
    <div className="flex mx-auto max-w-screen-sm items-center justify-center flex-col w-full h-screen">
      <Image
        layout="contain"
        height={154}
        width={230}
        alt="edutainment"
        src={
          'https://res.cloudinary.com/djpcyrdvk/image/upload/v1726070978/edutainment/logo_wuypxe.png'
        }
      />
      <SignUpComponent />
      <div className="w-full text-center bg-primary items-center mt-3 absolute py-3 bottom-0">
        <p className="text-white italic">
          Have an account already? <Link href={'/sign-in'}>Login</Link>
        </p>
      </div>
    </div>
  );
};

export default SignInPage;
