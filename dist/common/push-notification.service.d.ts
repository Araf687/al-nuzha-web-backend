export declare class PushNotificationService {
    private readonly logger;
    send(expoPushToken: string, title: string, body: string, data?: Record<string, unknown>): Promise<void>;
}
