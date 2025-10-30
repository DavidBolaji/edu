import Image from 'next/image';
import Link from 'next/link';
import React from 'react';
import SignInForm from '../_forms/sign-in-form';

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
      <SignInForm />
      <div className="w-full text-center items-center mt-3 absolute bottom-3">
        <p className="text-white italic">
          Don&apos;t have an account? <Link href={'/sign-up'}>Register</Link>
        </p>
      </div>
    </div>
  );
};

export default SignInPage;
