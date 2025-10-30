'use client';

import React from 'react';
import { Form, Formik, FormikHelpers } from 'formik';
import FormikInput from '@/app/_components/inputs/formik-input';
import { Button } from '@/app/_components/ui/button';
import Spinner from '@/app/_components/ui/spinner';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import useSignUp from '@/app/_hooks/use-sign-up';
import {
  signUpThreeSchema,
  SignUpThreeSchemaType,
} from '@/src/entities/models/auth/sign-up-schema';
import { signUp } from '../action';
import { toast } from 'sonner';

const SignUpThreeForm: React.FC<{
  nextStep?: () => void;
  prevStep?: () => void;
}> = ({ prevStep }) => {
  const { insert, getSignUpData, signUpData } = useSignUp();

  const onSubmit = async (
    values: SignUpThreeSchemaType,
    { setSubmitting }: FormikHelpers<SignUpThreeSchemaType>
  ) => {
    insert<SignUpThreeSchemaType>(values);

    setSubmitting(true);

    const response = await signUp(signUpData!);

    if (!response) {
      setSubmitting(false);
      return toast.success('Account creation successfull', {
        position: 'top-right',
      });
    }

    if (response?.error) {
      setSubmitting(false);
      toast.error(response.error, { position: 'top-right' });
      return;
    }
  };

  return (
    <Formik
      initialValues={getSignUpData<SignUpThreeSchemaType>([
        'password',
        'confirm_password',
      ])}
      onSubmit={onSubmit}
      validationSchema={toFormikValidationSchema(signUpThreeSchema)}
      validateOnMount
    >
      {({ isSubmitting, handleSubmit, isValid }) => (
        <Form onSubmit={handleSubmit} className="space-y-8 w-full">
          <FormikInput label="Password" name="password" type="password" />
          <FormikInput
            label="Confirm Password"
            name="confirm_password"
            type="password"
          />

          <div className="flex justify-between gap-2 translate-y-6">
            <Button
              disabled={isSubmitting}
              variant={'secondary'}
              className="w-full flex justify-center "
              size={'lg'}
              type="button"
              onClick={prevStep}
            >
              Back
            </Button>
            <Button
              disabled={isSubmitting || !isValid}
              variant={'secondary'}
              className="w-full flex justify-center"
              size={'lg'}
            >
              {isSubmitting ? <Spinner /> : 'Create Account'}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default SignUpThreeForm;
