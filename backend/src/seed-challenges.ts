import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ChallengesService } from './challenges/challenges.service';

const challenges = [
  {
    title: 'Secret Selfie',
    description: 'Take a selfie with your target without them noticing you\'re taking a photo together.',
  },
  {
    title: 'Compliment Master',
    description: 'Give your target 3 genuine compliments throughout the party without being suspicious.',
  },
  {
    title: 'Dance Partner',
    description: 'Get your target to dance with you for at least 30 seconds.',
  },
  {
    title: 'Story Time',
    description: 'Get your target to tell you an embarrassing story from their past.',
  },
  {
    title: 'Food Offering',
    description: 'Bring your target a drink or snack without them asking for it.',
  },
];

async function seed() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const challengesService = app.get(ChallengesService);

  console.log('Seeding challenges...');

  for (const challenge of challenges) {
    try {
      const created = await challengesService.create(challenge);
      console.log(`✓ Created: ${created.title}`);
    } catch (error) {
      console.error(`✗ Failed to create: ${challenge.title}`, error);
    }
  }

  console.log('\nDone! Seeded', challenges.length, 'challenges.');
  await app.close();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
