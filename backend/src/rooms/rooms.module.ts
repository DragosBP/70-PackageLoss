import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';
import { Room, RoomSchema } from './schemas/room.schema';
import {
  Challenge,
  ChallengeSchema,
} from '../challenges/schemas/challenge.schema';
import { ChallengeAssignmentService } from './challenge-assignment.service';
import { ChallengeSchedulerService } from './challenge-scheduler.service';
import { ChallengeAssignmentController } from './challenge-assignment.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Room.name, schema: RoomSchema },
      { name: Challenge.name, schema: ChallengeSchema },
    ]),
    NotificationsModule,
  ],
  controllers: [RoomsController, ChallengeAssignmentController],
  providers: [RoomsService, ChallengeAssignmentService, ChallengeSchedulerService],
  exports: [RoomsService, ChallengeAssignmentService],
})
export class RoomsModule {}
