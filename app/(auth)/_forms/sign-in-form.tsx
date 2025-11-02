'use client';

import React from 'react';
import { Form, Formik, FormikHelpers } from 'formik';
import FormikInput from '@/app/_components/inputs/formik-input';
import { Button } from '@/app/_components/ui/button';
import Spinner from '@/app/_components/ui/spinner';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import {
  signInSchema,
  signInSchemaType,
} from '@/src/entities/models/auth/login-schema';
import { toast } from 'sonner';
import { signIn } from '../action';
import Link from 'next/link';

const SignInForm = () => {
  const onSubmit = async (
    values: signInSchemaType,
    { setSubmitting }: FormikHelpers<signInSchemaType>
  ) => {
    setSubmitting(true);
    const response = await signIn(values);

    if (!response) {
      setSubmitting(false);
      return toast.success('Login successfull', { position: 'top-right' });
    }

    if (response?.error) {
      setSubmitting(false);
      toast.error(response.error, { position: 'top-right' });
      return;
    }
  };

  return (
    <Formik
      initialValues={{ email: '', password: '' }}
      onSubmit={onSubmit}
      validationSchema={toFormikValidationSchema(signInSchema)}
      validateOnMount
    >
      {({ isSubmitting, handleSubmit, isValid }) => (
        <Form onSubmit={handleSubmit} className="space-y-8 w-full">
          <FormikInput label="Email" name="email" type="email" />
          <FormikInput label="Password" name="password" type="password" />
          <Button
            disabled={isSubmitting || !isValid}
            variant={'secondary'}
            className="w-full flex justify-center translate-y-6"
            size={'lg'}
          >
            {isSubmitting ? <Spinner /> : 'Sign In'}
          </Button>
          <div className='mt-2 border border-b-2 border-transparent' />
          <div className="w-full text-center items-center mt-3">
            <p className="text-white italic">
              Don&apos;t have an account? <Link href={'/sign-up'}>Register</Link>
            </p>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default SignInForm;
