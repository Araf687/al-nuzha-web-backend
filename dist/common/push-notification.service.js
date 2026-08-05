"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PushNotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PushNotificationService = void 0;
const common_1 = require("@nestjs/common");
let PushNotificationService = PushNotificationService_1 = class PushNotificationService {
    constructor() {
        this.logger = new common_1.Logger(PushNotificationService_1.name);
    }
    async send(expoPushToken, title, body, data) {
        if (!expoPushToken?.startsWith('ExponentPushToken'))
            return;
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
            const json = await res.json();
            if (json?.data?.status === 'error') {
                this.logger.warn(`Expo push error: ${json.data.message}`);
            }
        }
        catch (err) {
            this.logger.error('Failed to send Expo push notification', err);
        }
    }
};
exports.PushNotificationService = PushNotificationService;
exports.PushNotificationService = PushNotificationService = PushNotificationService_1 = __decorate([
    (0, common_1.Injectable)()
], PushNotificationService);
//# sourceMappingURL=push-notification.service.js.map