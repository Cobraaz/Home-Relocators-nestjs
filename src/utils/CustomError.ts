import { UserInputError } from 'apollo-server-core';
import { BadRequestException } from '@nestjs/common';

export function CustomError(
  errorMessage: any,
  ErrorTypes: any = UserInputError,
) {
  const object = errorMessage.map(
    (e: { property: string; constraints: string }) => ({
      [e.property]: Object.values(e.constraints),
    }),
  );

  const formattedErrors = object.reduce(
    (result: string[], current: string[]) => {
      const key: any = Object.keys(current);
      result[key] = current[key];
      return result;
    },
  );

  if (ErrorTypes instanceof BadRequestException) {
    throw new BadRequestException(
      {
        errors: formattedErrors,
        statusCode: 400,
      },
      'Server Error',
    );
  }
  throw new BadRequestException(
    {
      errors: formattedErrors,
      statusCode: 400,
    },
    'Server Error',
  );
}

export const customError = (
  errorMessage: { property: string; constraints: string }[],
  ErrorTypes = UserInputError,
): void => {
  const generatedErrorMessage = errorMessage.map(
    ({ property, constraints }) => ({
      property,
      constraints: { [property]: constraints },
    }),
  );

  CustomError(generatedErrorMessage, ErrorTypes);
};
