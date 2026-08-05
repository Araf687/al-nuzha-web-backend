import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  async send(
    expoPushToken: string,
    title: string,
    body: string,
    data?: Record<string, unknown>,
  ): Promise<void> {
    if (!expoPushToken?.startsWith('ExponentPushToken')) return;

    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: expoPushToken, title, body, data: data ?? {}, sound: 'default' }),
      });

      const json = await res.json() as { data?: { status?: string; message?: string } };
      if (json?.data?.status === 'error') {
        this.logger.warn(`Expo push error: ${json.data.message}`);
      }
    } catch (err) {
      this.logger.error('Failed to send Expo push notification', err);
    }
  }
}
