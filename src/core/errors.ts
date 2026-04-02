/** Base error for all action-related failures. */
export class ActionError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message, { cause });
    this.name = 'ActionError';
  }
}

/** Thrown when required action inputs are missing or invalid. */
export class InputValidationError extends ActionError {
  constructor(message: string) {
    super(message);
    this.name = 'InputValidationError';
  }
}

/** Thrown when the AI provider fails to generate content. */
export class AIProviderError extends ActionError {
  constructor(
    message: string,
    public readonly provider: string,
    cause?: unknown,
  ) {
    super(message, cause);
    this.name = 'AIProviderError';
  }
}

/** Thrown when git operations (branch, commit, push) fail. */
export class GitOperationError extends ActionError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'GitOperationError';
  }
}
