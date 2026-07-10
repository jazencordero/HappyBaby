export class NotAuthorizedError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "NotAuthorizedError";
  }
}

export class NotAuthenticatedError extends Error {
  constructor(message = "Please sign in to continue.") {
    super(message);
    this.name = "NotAuthenticatedError";
  }
}

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export const GENERIC_ERROR = "Something went wrong. Please try again.";
