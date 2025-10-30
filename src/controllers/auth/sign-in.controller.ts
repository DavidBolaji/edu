import { ISignInUseCase } from '@/src/application/use-case/auth/sign-in-use-case';
import { InputParseError } from '@/src/entities/error/common';
import {
  signInSchema,
  signInSchemaType,
} from '@/src/entities/models/auth/login-schema';
import { Cookie } from '@/src/entities/models/cookie';

export type ISignInController = ReturnType<typeof signInController>;

export const signInController =
  (signInUseCase: ISignInUseCase) =>
  async (input: signInSchemaType): Promise<Cookie> => {
    try {
      const { data, error: inputParseError } = signInSchema.safeParse(input);

      if (inputParseError) {
        throw new InputParseError('Invalid data', { cause: inputParseError });
      }

      const { cookie } = await signInUseCase(data);
      return cookie;
    } catch (error) {
      throw error;
    }
  };
