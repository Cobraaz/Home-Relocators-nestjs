import { Role } from '@prisma/client';
import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsValidRole(validationOptions?: ValidationOptions) {
  return function (object: any, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: {
        validate(role: Role) {
          if (role) {
            const roles = Object.values(Role).map((ro) => ro.toLowerCase());
            return roles.includes(role.toLowerCase());
          }
          return true;
        },
        defaultMessage() {
          return `Role must be valid`;
        },
      },
    });
  };
}
