import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';
import { Bucket } from '@google-cloud/storage';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private initialized = false;
  private bucket: Bucket | null = null;

  onModuleInit() {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
    const storageBucket =
      process.env.FIREBASE_STORAGE_BUCKET || 'beefapp-86cb5.firebasestorage.app';

    if (!serviceAccountPath) {
      this.logger.warn(
        'FIREBASE_SERVICE_ACCOUNT_PATH not set. Push notifications and storage cleanup will be disabled.',
      );
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const serviceAccount = require(serviceAccountPath) as ServiceAccount;

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          storageBucket,
        });
      }

      this.bucket = admin.storage().bucket();
      this.initialized = true;
      this.logger.log(
        'Firebase Admin SDK initialized successfully (Messaging + Storage)',
      );
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

  /**
   * Delete all images associated with a room
   * Images are stored at: rooms/{roomId}/{userId}.jpg
   */
  async deleteRoomImages(roomId: string): Promise<{ deleted: number; errors: number }> {
    if (!this.initialized || !this.bucket) {
      this.logger.warn('Firebase not initialized, skipping image cleanup');
      return { deleted: 0, errors: 0 };
    }

    const prefix = `rooms/${roomId}/`;

    try {
      const [files] = await this.bucket.getFiles({ prefix });

      if (files.length === 0) {
        this.logger.log(`No images found for room ${roomId}`);
        return { deleted: 0, errors: 0 };
      }

      this.logger.log(`Found ${files.length} images to delete for room ${roomId}`);

      const results = await Promise.allSettled(
        files.map((file) => file.delete()),
      );

      const deleted = results.filter((r) => r.status === 'fulfilled').length;
      const errors = results.filter((r) => r.status === 'rejected').length;

      this.logger.log(
        `Room ${roomId} image cleanup: ${deleted} deleted, ${errors} errors`,
      );

      return { deleted, errors };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to delete room images: ${message}`);
      return { deleted: 0, errors: 1 };
    }
  }
}
