'use server';

import { getInjection } from '@/di/container';
import { AuthenticationError } from '@/src/entities/error/auth';
import { InputParseError } from '@/src/entities/error/common';
import { PrismaErrorHandler } from '@/src/entities/error/prisma-error';
import { signInSchemaType } from '@/src/entities/models/auth/login-schema';
import { allSignUpSchemaType } from '@/src/entities/models/auth/sign-up-schema';
import { Cookie } from '@/src/entities/models/cookie';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';


export async function sendEmail({ fname, email }: { fname: string, email: string }) {
  try {

    // Email content
    const emailContent = `
      <h2>Welcome</h2>
      <p>Hi ${fname},</p>
      <p>Welcome to edutainment — we’re happy to have you onboard!</p>
      <p>Your account has been successfully created. You can now log in and start exploring the tools designed to help you achieve your goals faster and easier.</p>
      <p>If you have any questions or need assistance, our support team is always ready to help.</p>
      <p>Thanks for joining us — we can’t wait to see what you achieve!</p>
      <p>Best regards,<br>The Edutainment Team</p>
    `

    // TODO: Integrate with email service (Resend, SendGrid, etc.)
    // For now, we'll just log the email that would be sent
    console.log(`[Email] To: ${email}`)

    console.log(`[Email] Content: ${emailContent}`)

    // Example with Resend (uncomment when integrated):
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'noreply@edutainment.app',
        to: email,
        subject: `Welcome`,
        html: emailContent,
      }),
    })

    console.error("Success sending email:")
  } catch (error) {
    console.error("Error sending email:", error)

  }
}


export async function signUp(data: allSignUpSchemaType) {
  let sessionCookie: Cookie;

  try {
    const signUpController = getInjection('ISignUpController');
    sessionCookie = await signUpController(data);
    await sendEmail({email: data.email, fname: data.fname})

    const cookieInstance = await cookies();
    cookieInstance.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
  } catch (error) {
    if (
      error instanceof InputParseError ||
      error instanceof AuthenticationError
    ) {
      return {
        success: false,
        error: (error as Error).message,
      };
    }

    const prismaError = PrismaErrorHandler.handle(error);
    if (PrismaErrorHandler.getIsPrismaError()) {
      return {
        success: false,
        error: prismaError.message,
      };
    }
    return {
      success: false,
      error: `Something went wrong: ${(error as Error).message}`,
    };
  }

  redirect('/dashboard/home');
}

export async function signIn(data: signInSchemaType) {
  let sessionCookie: Cookie;

  try {
    const signInController = getInjection('ISignInController');
    sessionCookie = await signInController(data);

    const cookieInstance = await cookies();
    cookieInstance.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes
    );
  } catch (error) {
    if (
      error instanceof InputParseError ||
      error instanceof AuthenticationError
    ) {
      return {
        success: false,
        error: error.message,
      };
    }

    const prismaError = PrismaErrorHandler.handle(error);
    if (PrismaErrorHandler.getIsPrismaError()) {
      return {
        success: false,
        error: prismaError.message,
      };
    }

    return {
      success: false,
      error: 'Something went wrong',
    };
  }
  redirect(`/dashboard/home`);
}
