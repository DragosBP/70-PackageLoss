import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { Bucket } from '@google-cloud/storage';
import * as path from 'path';
import * as fs from 'fs';

const STORAGE_BUCKET = 'beefapp-86cb5.firebasestorage.app';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private initialized = false;
  private bucket: Bucket | null = null;

  onModuleInit() {
    const serviceAccountPath = path.join(
      __dirname,
      '..',
      '..',
      'firebase-service-account.json',
    );

    if (fs.existsSync(serviceAccountPath)) {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccountPath),
          storageBucket: STORAGE_BUCKET,
        });
        this.bucket = admin.storage().bucket();
        this.initialized = true;
        this.logger.log('Firebase Admin SDK initialized successfully (Messaging + Storage)');
      }
    } else {
      this.logger.warn(
        'Firebase service account not found. Push notifications and storage cleanup will be disabled.',
      );
      this.logger.warn(`Expected path: ${serviceAccountPath}`);
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
    } catch (error) {
      this.logger.error(`Failed to send notification: ${error.message}`);
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
    } catch (error) {
      this.logger.error(`Failed to delete room images: ${error.message}`);
      return { deleted: 0, errors: 1 };
    }
  }
}
