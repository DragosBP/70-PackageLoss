import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

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

  @Prop({ type: Types.ObjectId, ref: 'Challenge', default: null })
  assigned_challenge_id: Types.ObjectId | null;

  @Prop({ type: String, trim: true, default: null })
  target_user_id: string | null;

  @Prop({ type: String, trim: true, default: null })
  previous_target_id: string | null;

  @Prop({ type: Date, default: null })
  challenge_assigned_at: Date | null;

  @Prop({ default: false })
  is_challenge_completed: boolean;
}

export const ParticipantSchema = SchemaFactory.createForClass(Participant);

@Schema({ collection: 'rooms', _id: false }) // IMPORTANT: _id: false pentru ID custom
export class Room {
  @Prop({ type: String }) // Aici vine codul de 6 cifre
  _id: string;

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

  @Prop({ default: false })
  game_started: boolean;

  @Prop({ type: Date, default: null })
  game_started_at: Date | null;

  // Challenge regeneration timer fields
  @Prop({ type: Date, default: null })
  last_challenge_regeneration: Date | null;

  @Prop({ type: Date, default: null })
  next_challenge_regeneration: Date | null;
}

export const RoomSchema = SchemaFactory.createForClass(Room);