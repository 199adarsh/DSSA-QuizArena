import { Request as ExpressRequest } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

export interface Request extends ExpressRequest {
  user?: DecodedIdToken;
}
