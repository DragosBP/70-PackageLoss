import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private initialized = false;

  onModuleInit() {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (!serviceAccountPath) {
      this.logger.warn(
        'FIREBASE_SERVICE_ACCOUNT_PATH not set - FCM notifications disabled',
      );
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const serviceAccount = require(serviceAccountPath) as ServiceAccount;
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      this.initialized = true;
      this.logger.log('Firebase Admin SDK initialized successfully');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to initialize Firebase: ${message}`);
    }
  }

  async sendToDevice(
    fcmToken: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<boolean> {
    if (!this.initialized) {
      this.logger.warn('Firebase not initialized - skipping notification');
      return false;
    }

    if (!fcmToken) {
      return false;
    }

    try {
      await admin.messaging().send({
        token: fcmToken,
        notification: { title, body },
        data,
      });
      this.logger.log(
        `Notification sent to token: ${fcmToken.slice(0, 10)}...`,
      );
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send notification: ${message}`);
      return false;
    }
  }

  async sendToMultiple(
    fcmTokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<{ successCount: number; failureCount: number }> {
    if (!this.initialized) {
      this.logger.warn('Firebase not initialized - skipping notifications');
      return { successCount: 0, failureCount: fcmTokens.length };
    }

    const validTokens = fcmTokens.filter((t) => t && t.length > 0);
    if (validTokens.length === 0) {
      return { successCount: 0, failureCount: 0 };
    }

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens: validTokens,
        notification: { title, body },
        data,
      });

      this.logger.log(
        `Batch notification: ${response.successCount} sent, ${response.failureCount} failed`,
      );

      return {
        successCount: response.successCount,
        failureCount: response.failureCount,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to send batch notifications: ${message}`);
      return { successCount: 0, failureCount: validTokens.length };
    }
  }
}
