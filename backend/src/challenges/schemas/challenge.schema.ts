import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ChallengeDocument = HydratedDocument<Challenge>;

@Schema({
  collection: 'challenges',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Challenge {
  @Prop({ required: true, trim: true })
  title!: string;

  @Prop({ required: true, trim: true })
  description!: string;

  @Prop({ trim: true, default: '' })
  category!: string;

  @Prop({ trim: true, default: '' })
  difficulty!: string;

  @Prop({ default: true })
  is_active!: boolean;
}

export const ChallengeSchema = SchemaFactory.createForClass(Challenge);
