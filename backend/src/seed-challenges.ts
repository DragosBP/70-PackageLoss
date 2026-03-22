import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ChallengesService } from './challenges/challenges.service';

const challenges = [
  // --- FRIENDLY (25) ---
  { title: "The Slow Walker", description: "Walk slowly right in front of your target, pacing them exactly for 30 seconds." },
  { title: "Untied Shoe Alert", description: "Tell your target their shoe is untied with absolute sincerity when it isn't." },
  { title: "The Repeater", description: "Repeat the last three words of their sentence back to them, three times in a row." },
  { title: "Shoulder Tap Trick", description: "Tap their left shoulder while standing on their right side." },
  { title: "The Yawner", description: "Unashamedly fake-yawn very loudly every time they begin a sentence, do this twice." },
  { title: "The Disagree-er", description: "Casually disagree with an absolutely obvious fact they state, just to be annoying." },
  { title: "The Inspector", description: "Stare intently at a spot on their shirt until they ask what's wrong, then say 'nevermind'." },
  { title: "High Five Psych", description: "Go in for a hype high-five, but totally miss their hand on purpose." },
  { title: "The Interrupter", description: "Interrupt their story to talk about something wildly irrelevant, then say 'anyway, continue'." },
  { title: "Mispronunciator", description: "Slightly but noticeably mispronounce their name or a common word while talking to them." },
  { title: "Close Talker", description: "Stand 2 inches closer than socially acceptable while talking to them for a full minute." },
  { title: "The Over-Explainer", description: "Explain a painfully simple concept (like how to open a door) to them as if they are a child." },
  { title: "The Lint Picker", description: "Pretend to aggressively pick a piece of non-existent lint off their clothing." },
  { title: "Too Long Handshake", description: "Shake their hand but refuse to let go for an uncomfortable 5 seconds." },
  { title: "Phantom Bug", description: "Swat the air near their head in a panic as if chasing away a fly that doesn't exist." },
  { title: "The Hype Man", description: "Sarcasticly over-cheer for them doing something totally normal (like sitting down or drinking water)." },
  { title: "Loud Whisper", description: "Whisper closely into their ear, but make it loud enough for the entire room to hear." },
  { title: "The 'What?' Loop", description: "Pretend you didn't hear them and make them repeat themselves 3 times in a row." },
  { title: "Item Nudge", description: "While they aren't looking, move their drink or phone exactly 6 inches out of their reach." },
  { title: "The Clapper", description: "Suddenly start a slow clap when they stop speaking, as if they just finished a performance." },
  { title: "The Sigh", description: "Let out a massive, dramatic sigh right when they start talking to you." },
  { title: "The Over-Nodder", description: "Nod excessively fast and vigorously while they're talking to you." },
  { title: "Fake Spoiler", description: "Act like you're about to spoil a movie they are watching, but make up a fake ending." },
  { title: "The Mimic", description: "Mimic their exact posture and hand gestures identically while they talk." },
  { title: "Staring Contest", description: "Stare at them unblinkingly while they're talking to someone else until they notice." },

  // --- MEDIUM (25) ---
  { title: "Path Blocker", description: "Casually stand explicitly in front of the door or hallway they are trying to walk through for 3 seconds." },
  { title: "Screen Peeker", description: "Stare blatantly over their shoulder at their phone screen until they complain." },
  { title: "Blindfold", description: "Sneak up behind them, cover their eyes, and say 'guess who' in a very weird voice." },
  { title: "Shoe Kick", description: "While standing near them, casually 'accidentally' step on the back of their shoe twice." },
  { title: "Chair Pull", description: "Slowly knock or drag their chair just an inch backward right before they sit." },
  { title: "Snack Thief", description: "Reach over and grab one fry/chip/etc directly off their plate without asking." },
  { title: "The Wet Willy Threat", description: "Lick your finger aggressively while staring at them, hover it near their ear, but don't touch." },
  { title: "Volume Slider", description: "Start talking very loudly, then switch to an absolute whisper mid-sentence so they have to lean in." },
  { title: "Hair Mess", description: "Reach over and blatantly mess up their hair when they are trying to talk to someone else." },
  { title: "Pocket Invader", description: "Casually try to stick your hand deep into their coat or pants pocket." },
  { title: "The Leaner", description: "Use their shoulder or head as an armrest for at least 30 seconds." },
  { title: "Accidental Push", description: "Give them a slight, safe push as they walk past to throw them off balance slightly." },
  { title: "Hat Thief", description: "Swiftly swipe their hat or sunglasses off their head and put them on yourself." },
  { title: "Seat Stealer", description: "Wait until they stand up, immediately steal their seat, and refuse to move for 2 minutes." },
  { title: "The Shadow", description: "Follow directly behind them, matching their every step perfectly, for 1 full minute." },
  { title: "Phone Intercept", description: "When they are showing you a photo on their phone, physically grab it out of their hand." },
  { title: "Conversation Hijacker", description: "Actively hijack a conversation they are having and redirect it entirely to yourself." },
  { title: "The Human Wall", description: "Box them into a corner and refuse to let them step out for 10 full seconds." },
  { title: "Awkward Silence", description: "After they finish a sentence, stare at them for 5 full seconds in absolute dead silence." },
  { title: "The Ankle Tapper", description: "Repeatedly tap the back of their ankle with your foot while walking behind them." },
  { title: "Drink Mix", description: "Drop a piece of ice, a napkin, or a lemon into their glass when they aren't paying attention." },
  { title: "Shoe Tie Trap", description: "Stop abruptly right in front of them while walking to tie your shoes." },
  { title: "The Reverse High Five", description: "Go in for a high five, but slap the back of their hand instead of the palm." },
  { title: "Elbow Bump", description: "Bump their elbow right as they are taking a sip of a non-spillable drink (like water)." },
  { title: "Fake Out", description: "Pretend to violently toss a completely harmless object (like a balled tissue) at their face." },

  // --- HARDCORE (50) ---
  { title: "Shoelaces Tied", description: "Actually attempt to tie their left and right shoelaces together while they are distracted sitting down." },
  { title: "The Ice Attack", description: "Drop a small piece of ice directly down the back of their shirt." },
  { title: "Water Flick", description: "Wet your hands in the bathroom and aggressively flick water directly into their face." },
  { title: "Jacket Trap", description: "Pull their jacket partially down their arms to temporarily pin their arms to their sides." },
  { title: "The Fake Trip", description: "Pretend to trip and full-body fall into them (safely)." },
  { title: "The Wet Willie", description: "The real deal. Give them a swift, wet poke in their ear when they least expect it." },
  { title: "Phone Confiscation", description: "Take their phone directly out of their hand and refuse to give it back for 5 minutes." },
  { title: "Reverse Piggyback", description: "Jump onto their back out of nowhere and refuse to get off for 30 seconds." },
  { title: "The Indian Burn", description: "Give them a quick but solid 'Indian burn' on their forearm." },
  { title: "The Dead Leg", description: "Give them a light 'Charley horse' punch in the thigh." },
  { title: "Shoe Thief", description: "Physically untie and swipe one of their shoes, then hide it somewhere in the room." },
  { title: "Spoiled Drink", description: "Add a splash of hot sauce, salt, or something gross (but safe) to their drink." },
  { title: "Conversation Ender", description: "Literally put your hand completely over their mouth mid-sentence." },
  { title: "The Bear Hug Trap", description: "Bear hug them so tightly they cannot move their arms, holding it for 30 seconds." },
  { title: "Nose Honk", description: "Pinch their nose violently, wiggle it, and loudly say 'HONK'." },
  { title: "Chair Tilt", description: "Tip their chair slightly backward while they are sitting in it (just enough to cause a mini heart attack)." },
  { title: "The Wedgie", description: "A classic, mild sneak-attack wedgie." },
  { title: "Tackle", description: "Safely but aggressively tackle them onto a couch, bed, or soft surface." },
  { title: "Shirt Pull", description: "Grab the back of their shirt collar and pull them backward slightly mid-stride." },
  { title: "Marker Attack", description: "Draw a tiny mustache, heart, or unibrow on their face with a pen or marker." },
  { title: "Drink Siphon", description: "Grab their drink and finish whatever is left in the glass while looking them directly in the eyes." },
  { title: "The Headlock", description: "Put them in a solid headlock and give them a highly aggressive noogie." },
  { title: "Pocket Sand", description: "Yell 'Pocket Sand!' and throw actual water, confetti, or crumpled napkins directly in their face." },
  { title: "Food Smear", description: "Smear a noticeable glob of frosting, sauce, or dip straight onto their nose." },
  { title: "The Spank", description: "Give them a shockingly solid, resounding smack on the butt." },
  { title: "Leg Sweep", description: "Safely sweep their legs out from under them so they fall back into your arms." },
  { title: "Ear Lick", description: "Give their ear lobe or cheek a sudden, wildly inappropriate, wet lick." },
  { title: "Blindfold Kidnap", description: "Physically cover their eyes with your hands and forcibly guide them to walk to a different room." },
  { title: "The Bag Steal", description: "Unzip their backpack or bag, take out exactly one item (like their keys), and keep it for 15 mins." },
  { title: "Human Chair", description: "Fully sit on their lap, making yourself absolutely dead weight, while they talk to someone else." },
  { title: "The Sneeze", description: "Fake a massive sneeze and simultaneously splash a tiny bit of water on their arm." },
  { title: "Tickle Torture", description: "Pin them down and mercilessly tickle them until they sincerely scream for mercy." },
  { title: "Screen Swipe", description: "When they are looking at their phone, reach over and swipe away or close the app they are actively using." },
  { title: "The Knee Buckle", description: "Sneak up behind them and push the back of their knees hard to make their legs buckle." },
  { title: "Volume 100", description: "Wait until they are close, then yell your next response directly into their ear at maximum volume." },
  { title: "The Push", description: "Physically shove them out of the way when they are walking, acting as if you are in a massive rush." },
  { title: "Deodorant Swipe", description: "Wipe your bare hand in your own armpit, and then aggressively wipe it on their arm." },
  { title: "Cough Attack", description: "Fake a horrible, wet cough explicitly in their direction without covering your mouth at all." },
  { title: "Bite", description: "Actually bite their arm or shoulder (hard enough to be annoying, but not enough to injure)." },
  { title: "The Tripwire", description: "Stick your foot out purely to maliciously trip them as they walk by." },
  { title: "Steal Their Setup", description: "If they are typing or using their phone, literally put your hands over theirs or take the device entirely." },
  { title: "The Spitball", description: "Make a chunky, wet paper spitball and throw it directly at the back of their neck." },
  { title: "Phone Drop", description: "When they hand you their phone to look at something, pretend to dramatically drop it on the floor." },
  { title: "Hoodie Yank", description: "Yank the strings of their hoodie as hard and fast as possible to violently close the hood around their face." },
  { title: "The Squeeze", description: "Grab and aggressively squeeze their inner thigh or bicep out of nowhere." },
  { title: "Jacket Thief", description: "If they take off their jacket, immediately put it on yourself and refuse to return it for 30 minutes." },
  { title: "Shoulder Check", description: "Intentionally and aggressively shoulder-check them as they walk past you in a doorway." },
  { title: "The Annoying Tap", description: "Rhythmically and painfully 'boop' them on the forehead over and over until they physically stop you." },
  { title: "Face Squish", description: "Grab their cheeks with one hand and violently squish their face together while maintaining a conversation." },
  { title: "Stop Hitting Yourself", description: "Grab their wrist, force them to smack their own face or head, and aggressively whisper 'stop hitting yourself'." }
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
