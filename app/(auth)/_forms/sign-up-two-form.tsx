'use client';

import React from 'react';
import { Form, Formik } from 'formik';
import FormikInput from '@/app/_components/inputs/formik-input';
import { Button } from '@/app/_components/ui/button';
import Spinner from '@/app/_components/ui/spinner';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import useSignUp from '@/app/_hooks/use-sign-up';
import {
  signUpTwoSchema,
  SignUpTwoSchemaType,
} from '@/src/entities/models/auth/sign-up-schema';
import FormikSelectInput from '@/app/_components/inputs/formik-select-input';
import { roleList, schoolList } from '@/app/_lib/data';

const SignUpTwoForm: React.FC<{
  nextStep?: () => void;
  prevStep?: () => void;
}> = ({ nextStep, prevStep }) => {
  const { insert, getSignUpData } = useSignUp();

  const onSubmit = async (values: SignUpTwoSchemaType) => {
    insert<SignUpTwoSchemaType>(values);
    nextStep && nextStep();
  };

  return (
    <Formik
      initialValues={getSignUpData<SignUpTwoSchemaType>([
        'email',
        'school',
        'phone',
        'role',
      ])}
      onSubmit={onSubmit}
      validationSchema={toFormikValidationSchema(signUpTwoSchema)}
      validateOnMount
    >
      {({ isSubmitting, handleSubmit, isValid }) => (
        <Form onSubmit={handleSubmit} className="space-y-8 w-full">
          <FormikInput label="Email" name="email" type="email" />
          <FormikSelectInput
            label="School"
            name="school"
            placeholder="Select School"
            options={schoolList || []}
          />
          <FormikInput label="Phone" name="phone" type="text" />
          <FormikSelectInput
            label="Role"
            name="role"
            placeholder="Select Role"
            options={roleList || []}
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
              {isSubmitting ? <Spinner /> : 'Next'}
            </Button>
          </div>
        </Form>
      )}
    </Formik>
  );
};

export default SignUpTwoForm;
