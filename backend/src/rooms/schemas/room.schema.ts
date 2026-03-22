import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RoomDocument = HydratedDocument<Room>;

@Schema({ _id: false })
export class Participant {
  @Prop({ required: true, trim: true })
  user_id: string;

  @Prop({ required: true, trim: true })
  nickname: string;

  @Prop({ trim: true, default: '' })
  pfp_base64: string;

  @Prop({ trim: true, default: '' })
  fcm_token: string;

  @Prop({ default: Date.now })
  last_active: Date;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);

@Schema({ collection: 'rooms' })
export class Room {
  @Prop({ required: true, trim: true })
  room_name: string;

  @Prop({ required: true, trim: true })
  admin_nickname: string;

  @Prop({ default: Date.now })
  created_at: Date;

  @Prop({ required: true, index: { expires: 0 } })
  expires_at: Date;

  @Prop({ type: [ParticipantSchema], default: [] })
  participants: Participant[];

  @Prop({ type: [String], default: [] })
  active_alerts: string[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);
