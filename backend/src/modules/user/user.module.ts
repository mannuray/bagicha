import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { AccountDeletionService } from './account-deletion.service';

@Module({
  controllers: [UserController],
  providers: [UserRepository, UserService, AccountDeletionService],
  exports: [UserRepository],
})
export class UserModule {}
