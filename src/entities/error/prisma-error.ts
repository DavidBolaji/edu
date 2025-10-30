interface ErrorResponse {
  code: string;
  message: string;
  type?: string;
  details?: any;
}

export class PrismaErrorHandler {
  private static isPrismaError = false;

  static handle(error: any): ErrorResponse {
    // Handle PrismaClientKnownRequestError
    if (error?.constructor?.name === 'PrismaClientKnownRequestError') {
      this.isPrismaError = true;
      return this.handleKnownError(error);
    }

    // Handle PrismaClientValidationError
    if (error?.constructor?.name === 'PrismaClientValidationError') {
      this.isPrismaError = true;
      return {
        code: 'VALIDATION_ERROR',
        message: 'Invalid data provided.',
        type: 'ValidationError',
        details: error.message,
      };
    }

    // Handle PrismaClientInitializationError
    if (error?.constructor?.name === 'PrismaClientInitializationError') {
      this.isPrismaError = true;
      return {
        code: error.errorCode || 'INITIALIZATION_ERROR',
        message: 'Failed to initialize database connection.',
        type: 'InitializationError',
        details: error.message,
      };
    }

    // Default error response
    return {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred.',
      type: error.type || 'UNKNOWN',
      details: error.cause || 'UNKNOWN',
    };
  }

  static getIsPrismaError(): boolean {
    return this.isPrismaError;
  }

  private static handleKnownError(error: any): ErrorResponse {
    const errorResponse: ErrorResponse = {
      code: error.code,
      type: 'KnownError',
      message: '',
      details: error.meta,
    };

    switch (error.code) {
      case 'P2002':
        const target = Array.isArray(error.meta?.target)
          ? error.meta.target.join(', ')
          : error.meta?.target || 'unknown field';
        errorResponse.message = `${target
          .split('_')
          .join(' ')} has to be unique.`;
        break;
      case 'P2014':
        errorResponse.message =
          'The change you are trying to make would violate the required relation between models.';
        break;
      case 'P2003':
        errorResponse.message = `Foreign key constraint failed on the field: ${error.meta?.field_name}.`;
        break;
      case 'P2025':
        errorResponse.message = 'Record not found.';
        break;
      case 'P2001':
        errorResponse.message = 'Record does not exist.';
        break;
      case 'P2011':
        errorResponse.message = 'Null constraint violation.';
        break;
      case 'P2012':
        errorResponse.message = 'Missing required field.';
        break;
      default:
        errorResponse.message =
          error.message || 'An unknown database error occurred.';
    }

    return errorResponse;
  }
}
