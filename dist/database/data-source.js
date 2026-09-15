"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const fs_1 = require("fs");
const path_1 = require("path");
function loadEnv() {
    const envPath = (0, path_1.join)(__dirname, '..', '..', '.env');
    if (!(0, fs_1.existsSync)(envPath))
        return;
    const env = (0, fs_1.readFileSync)(envPath, 'utf8')
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#'));
    for (const line of env) {
        const [key, ...valueParts] = line.split('=');
        if (!key || process.env[key.trim()] !== undefined)
            continue;
        process.env[key.trim()] = valueParts.join('=').trim();
    }
}
loadEnv();
exports.default = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'cooldesk',
    synchronize: false,
    logging: false,
    entities: [(0, path_1.join)(__dirname, '..', '**', `*.entity${(0, path_1.extname)(__filename)}`)],
    migrations: [(0, path_1.join)(__dirname, 'migrations', `*${(0, path_1.extname)(__filename)}`)],
});
//# sourceMappingURL=data-source.js.map