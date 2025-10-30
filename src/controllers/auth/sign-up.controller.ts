import { ITransactionService } from '@/src/application/services/transaction.service.interface';
import { ISignUpUseCase } from '@/src/application/use-case/auth/sign-up-use-case';
import { InputParseError } from '@/src/entities/error/common';
import {
  allSignUpSchema,
  allSignUpSchemaType,
} from '@/src/entities/models/auth/sign-up-schema';

import { Cookie } from '@/src/entities/models/cookie';

export type ISignUpController = ReturnType<typeof signUpController>;

export const signUpController =
  (signUpUseCase: ISignUpUseCase, transactionService: ITransactionService) =>
  async (input: allSignUpSchemaType): Promise<Cookie> => {
    console.log(input)
    try {
      return await transactionService.startTransaction(async (mainTx) => {
        try {
          const { data, error: inputParseError } =
            allSignUpSchema.safeParse(input);

          if (inputParseError) {
            throw new InputParseError('Invalid data', {
              cause: inputParseError,
            });
          }

          const { cookie } = await signUpUseCase(data, mainTx);
          return cookie;
        } catch (error) {
          throw error;
        }
      });
    } catch (error) {
      throw error;
    }
  };
