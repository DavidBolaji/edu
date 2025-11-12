import { mergeTypes, z } from 'zod';

//------------------------------------------------------------------------------
// Personal Information Schema One
//------------------------------------------------------------------------------
export const signUpOneSchema = z.object({
  title: z.enum(['Mr', 'Mrs', 'Ms', 'Dr', 'Professor'], { message: 'Title is required' }),
  fname: z.string().min(1, { message: 'First name field is required' }),
  middlename: z.string().min(1, { message: 'Middle name field is required' }),
  lname: z.string().min(1, { message: 'Last name field is required' }),
});

export type SignUpOneSchemaType = z.infer<typeof signUpOneSchema>;

//------------------------------------------------------------------------------
// Personal Information Schema Two
//------------------------------------------------------------------------------
export const signUpTwoSchema = z.object({
  email: z.string().email({ message: 'Invalid email' }),
  phone: z.string().min(1, { message: 'Phone name field is required' }),
  school: z.string().min(1, { message: 'School name field is required' }),
  role: z.enum(['STUDENT', 'LECTURER']),
});

export type SignUpTwoSchemaType = z.infer<typeof signUpTwoSchema>;

//------------------------------------------------------------------------------
// Personal Information Schema Three
//------------------------------------------------------------------------------

export const signUpSchemaBase = z.object({
  password: z.string(),
  confirm_password: z.string(),
});

export const signUpThreeSchema = signUpSchemaBase.refine(
  (data) => data.password === data.confirm_password,
  {
    message: 'Passwords must match',
    path: ['confirm_password'],
  }
);

export type SignUpThreeSchemaType = z.infer<typeof signUpThreeSchema>;

// Remove confirm_password from base schema
const signUpSchemaWithoutConfirm = signUpSchemaBase.omit({
  confirm_password: true,
});

// Complete signup schema
export const allSignUpSchema = signUpSchemaWithoutConfirm
  .merge(signUpOneSchema)
  .merge(signUpTwoSchema);

// Type for complete signup
export type allSignUpSchemaType = mergeTypes<
  SignUpOneSchemaType,
  mergeTypes<
    Omit<SignUpThreeSchemaType, 'confirm_password'>,
    SignUpTwoSchemaType
  >
>;
