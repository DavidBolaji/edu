'use client';

import React from 'react';
import { Form, Formik } from 'formik';
import FormikInput from '@/app/_components/inputs/formik-input';
import { Button } from '@/app/_components/ui/button';
import Spinner from '@/app/_components/ui/spinner';
import { toFormikValidationSchema } from 'zod-formik-adapter';
import useSignUp from '@/app/_hooks/use-sign-up';
import {
  signUpOneSchema,
  SignUpOneSchemaType,
} from '@/src/entities/models/auth/sign-up-schema';
import FormikSelectInput from '@/app/_components/inputs/formik-select-input';
import { titleOptions } from '@/app/_lib/data';

const SignUpOneForm: React.FC<{ nextStep?: () => void }> = ({ nextStep }) => {
  const { insert, getSignUpData } = useSignUp();

  const onSubmit = async (values: SignUpOneSchemaType) => {
    insert<SignUpOneSchemaType>(values);
    nextStep && nextStep();
  };

  return (
    <Formik
      initialValues={getSignUpData<SignUpOneSchemaType>([
        'title',
        'fname',
        'middlename',
        'lname',
      ])}
      onSubmit={onSubmit}
      validationSchema={toFormikValidationSchema(signUpOneSchema)}
      validateOnMount
    >
      {({ isSubmitting, handleSubmit, isValid }) => (
        <Form onSubmit={handleSubmit} className="space-y-8 w-full">
          <FormikSelectInput
            label="Title"
            name="title"
            placeholder="Select Title"
            options={titleOptions || []}
          />
          <FormikInput label="First Name" name="fname" type="text" />
          <FormikInput label="Middle Name" name="middlename" type="text" />
          <FormikInput label="Last Name" name="lname" type="text" />
          <Button
            disabled={isSubmitting || !isValid}
            variant={'secondary'}
            className="w-full flex justify-center translate-y-6"
            size={'lg'}
          >
            {isSubmitting ? <Spinner /> : 'Next'}
          </Button>
        </Form>
      )}
    </Formik>
  );
};

export default SignUpOneForm;
