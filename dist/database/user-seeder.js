"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const typeorm_1 = require("typeorm");
const fs_1 = require("fs");
const path_1 = require("path");
const bcrypt = require("bcrypt");
const customer_entity_1 = require("../customers/entities/customer.entity");
const technician_entity_1 = require("../technicians/entities/technician.entity");
const service_request_entity_1 = require("../service-requests/entities/service-request.entity");
const job_report_entity_1 = require("../job-reports/entities/job-report.entity");
const job_part_entity_1 = require("../job-reports/entities/job-part.entity");
const job_service_entity_1 = require("../job-reports/entities/job-service.entity");
const job_expense_entity_1 = require("../job-reports/entities/job-expense.entity");
const invoice_entity_1 = require("../invoices/entities/invoice.entity");
const review_entity_1 = require("../reviews/entities/review.entity");
const notification_entity_1 = require("../notifications/entities/notification.entity");
const part_entity_1 = require("../parts/entities/part.entity");
const service_catalogue_entity_1 = require("../services-catalogue/entities/service-catalogue.entity");
function loadEnv() {
    const envPath = (0, path_1.join)(__dirname, '..', '..', '.env');
    if (!(0, fs_1.existsSync)(envPath))
        return;
    const env = (0, fs_1.readFileSync)(envPath, 'utf8')
        .split(/\r?\n/)
        .filter((line) => line && !line.startsWith('#'));
    for (const line of env) {
        const [key, ...valueParts] = line.split('=');
        if (!key)
            continue;
        process.env[key] = valueParts.join('=');
    }
}
loadEnv();
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_NAME || 'cooldesk',
    synchronize: false,
    logging: false,
    entities: [
        customer_entity_1.Customer,
        technician_entity_1.Technician,
        service_request_entity_1.ServiceRequest,
        job_report_entity_1.JobReport,
        job_part_entity_1.JobPart,
        job_service_entity_1.JobService,
        job_expense_entity_1.JobExpense,
        invoice_entity_1.Invoice,
        review_entity_1.Review,
        notification_entity_1.Notification,
        part_entity_1.Part,
        service_catalogue_entity_1.ServiceCatalogue,
    ],
});
async function createOrUpdateCustomer() {
    const customerRepo = AppDataSource.getRepository(customer_entity_1.Customer);
    const passwordHash = await bcrypt.hash('Araf@123', 10);
    const data = {
        name: 'Araf Yeasin',
        phone: '01614756856',
        email: 'arafyeasin@gmail.com',
        passwordHash,
        isRegistered: true,
    };
    const existing = await customerRepo.findOne({ where: { phone: data.phone } });
    if (existing) {
        existing.name = data.name;
        existing.email = data.email;
        existing.passwordHash = data.passwordHash;
        existing.isRegistered = true;
        return customerRepo.save(existing);
    }
    const customer = customerRepo.create(data);
    return customerRepo.save(customer);
}
async function createOrUpdateTechnician(details) {
    const technicianRepo = AppDataSource.getRepository(technician_entity_1.Technician);
    const passwordHash = await bcrypt.hash(details.password, 10);
    const data = {
        name: details.name,
        phone: details.phone,
        email: details.email,
        passwordHash,
        role: details.role,
        isActive: true,
    };
    const existing = await technicianRepo.findOne({ where: { phone: data.phone } });
    if (existing) {
        existing.name = data.name;
        existing.email = data.email;
        existing.passwordHash = data.passwordHash;
        existing.role = data.role;
        existing.isActive = true;
        return technicianRepo.save(existing);
    }
    const technician = technicianRepo.create(data);
    return technicianRepo.save(technician);
}
async function runSeeder() {
    console.log('Starting user seeder...');
    await AppDataSource.initialize();
    await createOrUpdateTechnician({
        name: 'Masum Abdullah',
        phone: '+971566636469',
        email: 'masumabdullah874@gmail.com',
        password: 'Admin@123',
        role: 'admin',
    });
    await createOrUpdateCustomer();
    await createOrUpdateTechnician({
        name: 'Technician User',
        phone: '01847140372',
        email: 'technician@gmail.com',
        password: 'Technician@123',
        role: 'technician',
    });
    console.log('User seeder finished.');
    await AppDataSource.destroy();
}
runSeeder().catch((error) => {
    console.error('Seeder failed:', error);
    process.exit(1);
});
//# sourceMappingURL=user-seeder.js.map