import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import * as path from 'path';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private initialized = false;

  onModuleInit() {
    const rawServiceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!rawServiceAccountPath) {
      this.logger.warn(
        'FIREBASE_SERVICE_ACCOUNT_PATH not set. Push notifications will be disabled.',
      );
      return;
    }

    try {
      // Support both quoted and unquoted values in .env and resolve relative paths from app root.
      const normalizedPath = rawServiceAccountPath.trim().replace(/^['\"]|['\"]$/g, '');
      const serviceAccountPath = path.isAbsolute(normalizedPath)
        ? normalizedPath
        : path.resolve(process.cwd(), normalizedPath);

      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const serviceAccount = require(serviceAccountPath) as ServiceAccount;

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }

      this.initialized = true;
      this.logger.log('Firebase Admin SDK initialized successfully (Messaging)');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize Firebase: ${message}`);
    }
  }

  async sendChallengeNotification(
    fcmToken: string,
    targetNickname: string,
    challengeTitle: string,
    challengeDescription: string,
  ): Promise<boolean> {
    if (!this.initialized) {
      this.logger.warn('Firebase not initialized, skipping notification');
      return false;
    }

    if (!fcmToken) {
      this.logger.warn('No FCM token provided, skipping notification');
      return false;
    }

    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: {
          title: `New Challenge: ${challengeTitle}`,
          body: `Target: ${targetNickname}`,
        },
        data: {
          type: 'CHALLENGE_ASSIGNED',
          targetNickname,
          challengeTitle,
          challengeDescription,
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'default',
            sound: 'default',
          },
        },
      });

      this.logger.log(
        `Notification sent successfully to token: ${fcmToken.substring(0, 20)}...`,
      );
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send notification: ${message}`);
      return false;
    }
  }

  async sendBulkChallengeNotifications(
    participants: Array<{
      fcmToken: string;
      targetNickname: string;
      challengeTitle: string;
      challengeDescription: string;
    }>,
  ): Promise<{ sent: number; failed: number }> {
    if (!this.initialized) {
      this.logger.warn('Firebase not initialized, skipping bulk notifications');
      return { sent: 0, failed: participants.length };
    }

    const validParticipants = participants.filter((p) => p.fcmToken);
    const results = await Promise.allSettled(
      validParticipants.map((p) =>
        this.sendChallengeNotification(
          p.fcmToken,
          p.targetNickname,
          p.challengeTitle,
          p.challengeDescription,
        ),
      ),
    );

    const sent = results.filter(
      (r) => r.status === 'fulfilled' && r.value === true,
    ).length;
    const failed = validParticipants.length - sent;

    this.logger.log(
      `Bulk notifications complete: ${sent} sent, ${failed} failed, ${participants.length - validParticipants.length} skipped (no token)`,
    );

    return { sent, failed };
  }
}
