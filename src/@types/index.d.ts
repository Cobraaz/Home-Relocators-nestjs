import { Types } from 'mongoose';
import { IUserDocument } from '../../models/users';

declare global {
  namespace Express {
    interface AuthInfo {
      email?: string;
      name?: string;
      given_name?: string;
      family_name?: string;
    }
    interface Request {
      // user?: Record<
      //   IUserDocument & {
      //     id: Types.ObjectId;
      //   }
      // >;

      // authInfo?: {
      //   email?: string;
      // };

      // authInfo?:
      //   | AuthInfo
      //   | undefined
      //   | {
      //       email?: string;
      //     };

      localUser: {
        id?: string;
        role?: string;
      };
    }
  }
}
