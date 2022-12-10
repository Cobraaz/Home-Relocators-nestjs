import { Field, Int, ObjectType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';

@ObjectType()
export class FindAllUsersResponse {
  @Field(() => Int)
  totalCount: number;

  @Field(() => [User], { nullable: true })
  users: User[];
}
