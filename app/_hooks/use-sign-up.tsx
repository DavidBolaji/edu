'use client';

import { UIStates } from '@/config';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { allSignUpSchemaType } from '@/src/entities/models/auth/sign-up-schema';

const useSignUp = () => {
  const queryClient = useQueryClient();

  // Initialize REGISTER query data if not set already
  if (!queryClient.getQueryData([UIStates.REGISTER])) {
    queryClient.setQueryData([UIStates.REGISTER], () => null);
  }

  const insert = <T,>(values: T) => {
    queryClient.setQueryData([UIStates.REGISTER], (prev: T) => {
      if (!prev) return { ...values };
      return {
        ...prev,
        ...values,
      };
    });
  };

  const getSignUpData = <T extends Record<string, string>>(
    data: string[]
  ): T => {
    const initialValue: Record<string, string> = {};

    for (const char of data) {
      if (signUpData && typeof signUpData === 'object' && char in signUpData) {
        //@ts-ignore
        initialValue[char] = signUpData[char as keyof typeof signUpData] || '';
      } else {
        if (char === 'confirm_password') {
          initialValue[char] = signUpData?.password || '';
        } else {
          initialValue[char] = '';
        }
      }
    }
    return initialValue as T;
  };

  const { data: signUpData } = useQuery({
    queryKey: [UIStates.REGISTER],
    queryFn: () =>
      queryClient.getQueryData([UIStates.REGISTER]) as allSignUpSchemaType,
  });

  return { signUpData, insert, getSignUpData };
};

export default useSignUp;
