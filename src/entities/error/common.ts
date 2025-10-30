export class InputParseError extends Error {
  constructor(message: string, options: ErrorOptions) {
    super(message, options);
  }
}

export class NotFoundError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class DatabaseOperationError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}

export class NextRedirect extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = 'NextRedirect';
  }
}

export class PrismaError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
  }
}
