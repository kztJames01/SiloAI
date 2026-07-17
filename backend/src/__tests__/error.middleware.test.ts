import { Request, Response, NextFunction } from 'express';
import { ZodError, z } from 'zod';
import { errorHandler, AppError } from '../api/middleware/error.middleware';

function runErrorHandler(err: Error) {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  errorHandler(err, {} as Request, { status } as unknown as Response, {} as NextFunction);
  return { status, json };
}

describe('errorHandler', () => {
  it('returns 400 for Zod validation errors instead of 500', () => {
    const schema = z.object({ email: z.string().email() });
    let zodErr: ZodError;
    try {
      schema.parse({ email: 'nope' });
    } catch (e) {
      zodErr = e as ZodError;
    }
    const { status, json } = runErrorHandler(zodErr!);
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Validation failed', status: 400 }));
  });

  it('preserves AppError status codes', () => {
    const { status } = runErrorHandler(new AppError('nope', 403));
    expect(status).toHaveBeenCalledWith(403);
  });

  it('masks unknown errors as 500', () => {
    const { status } = runErrorHandler(new Error('db exploded'));
    expect(status).toHaveBeenCalledWith(500);
  });
});
