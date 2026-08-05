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
async function createOrUpdateCustomer(details) {
    const customerRepo = AppDataSource.getRepository(customer_entity_1.Customer);
    const existing = await customerRepo.findOne({ where: { phone: details.phone } });
    const passwordHash = details.password ? await bcrypt.hash(details.password, 10) : existing?.passwordHash;
    if (existing) {
        existing.name = details.name;
        existing.email = details.email ?? existing.email;
        existing.address = details.address;
        existing.lat = details.lat ?? existing.lat;
        existing.lng = details.lng ?? existing.lng;
        existing.passwordHash = passwordHash;
        existing.isRegistered = details.isRegistered ?? existing.isRegistered;
        return customerRepo.save(existing);
    }
    const customer = customerRepo.create({
        ...details,
        passwordHash,
        isRegistered: details.isRegistered ?? false,
    });
    return customerRepo.save(customer);
}
async function createOrUpdateTechnician(details) {
    const technicianRepo = AppDataSource.getRepository(technician_entity_1.Technician);
    const existing = await technicianRepo.findOne({ where: { phone: details.phone } });
    const passwordHash = await bcrypt.hash(details.password, 10);
    if (existing) {
        existing.name = details.name;
        existing.email = details.email;
        existing.passwordHash = passwordHash;
        existing.role = details.role;
        existing.isActive = true;
        return technicianRepo.save(existing);
    }
    const technician = technicianRepo.create({
        ...details,
        passwordHash,
        isActive: true,
    });
    return technicianRepo.save(technician);
}
async function createOrUpdatePart(details) {
    const partRepo = AppDataSource.getRepository(part_entity_1.Part);
    const existing = await partRepo.findOne({ where: { sku: details.sku } });
    if (existing) {
        existing.name = details.name;
        existing.unitPrice = details.unitPrice;
        existing.stockQty = details.stockQty;
        existing.minStockLevel = details.minStockLevel ?? existing.minStockLevel;
        existing.needsReview = details.needsReview ?? false;
        return partRepo.save(existing);
    }
    const part = partRepo.create({
        ...details,
        minStockLevel: details.minStockLevel ?? 3,
        needsReview: details.needsReview ?? false,
    });
    return partRepo.save(part);
}
async function upsertServiceRequest(seed) {
    const repo = AppDataSource.getRepository(service_request_entity_1.ServiceRequest);
    const existing = await repo.findOne({
        where: { jobRef: seed.jobRef },
        relations: ['customer', 'assignedTechnician', 'jobReport'],
    });
    if (existing) {
        existing.customer = seed.customer;
        existing.assignedTechnician = seed.technician ?? null;
        existing.source = seed.source;
        existing.serviceType = seed.serviceType;
        existing.equipmentType = seed.equipmentType ?? null;
        existing.equipmentBrand = seed.equipmentBrand ?? null;
        existing.equipmentModel = seed.equipmentModel ?? null;
        existing.problemDescription = seed.problemDescription;
        existing.address = seed.address;
        existing.lat = seed.lat ?? null;
        existing.lng = seed.lng ?? null;
        existing.preferredTime = seed.preferredTime ?? null;
        existing.status = seed.status;
        existing.scheduledAt = seed.scheduledAt ?? null;
        existing.isRecurring = false;
        existing.parentJobId = null;
        return repo.save(existing);
    }
    const request = repo.create({
        jobRef: seed.jobRef,
        customer: seed.customer,
        assignedTechnician: seed.technician,
        source: seed.source,
        serviceType: seed.serviceType,
        equipmentType: seed.equipmentType,
        equipmentBrand: seed.equipmentBrand,
        equipmentModel: seed.equipmentModel,
        problemDescription: seed.problemDescription,
        address: seed.address,
        lat: seed.lat,
        lng: seed.lng,
        preferredTime: seed.preferredTime,
        status: seed.status,
        scheduledAt: seed.scheduledAt,
        isRecurring: false,
    });
    return repo.save(request);
}
async function ensureCompletedJob(seed) {
    const reportRepo = AppDataSource.getRepository(job_report_entity_1.JobReport);
    const invoiceRepo = AppDataSource.getRepository(invoice_entity_1.Invoice);
    const existingReport = await reportRepo.findOne({
        where: { serviceRequest: { id: seed.serviceRequest.id } },
        relations: ['serviceRequest', 'invoice'],
    });
    const parts = seed.parts.map((entry) => {
        const jobPart = new job_part_entity_1.JobPart();
        jobPart.part = entry.part;
        jobPart.quantity = entry.quantity;
        jobPart.unitPrice = entry.unitPrice;
        jobPart.lineTotal = entry.quantity * entry.unitPrice;
        jobPart.isCustom = false;
        return jobPart;
    });
    const services = seed.services.map((entry) => {
        const jobService = new job_service_entity_1.JobService();
        jobService.serviceName = entry.serviceName;
        jobService.labourCost = entry.labourCost;
        jobService.notes = entry.notes;
        return jobService;
    });
    const expenses = seed.expenses.map((entry) => {
        const jobExpense = new job_expense_entity_1.JobExpense();
        jobExpense.description = entry.description;
        jobExpense.amount = entry.amount;
        return jobExpense;
    });
    const partsTotal = parts.reduce((sum, item) => sum + Number(item.lineTotal), 0);
    const extraExpensesTotal = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
    const subtotal = Number(seed.labourCharge) + partsTotal + extraExpensesTotal;
    const vatAmount = Number((subtotal * 0.05).toFixed(2));
    const grandTotal = Number((subtotal + vatAmount).toFixed(2));
    let report;
    if (existingReport) {
        report = existingReport;
        report.technician = seed.technician;
        report.faultFound = seed.faultFound;
        report.diagnosisNotes = seed.diagnosisNotes;
        report.labourCharge = seed.labourCharge;
        report.partsTotal = partsTotal;
        report.extraExpensesTotal = extraExpensesTotal;
        report.vatAmount = vatAmount;
        report.grandTotal = grandTotal;
        report.customerSignatureUrl = seed.customerSignatureUrl;
        report.arrivedAt = seed.arrivedAt;
        report.completedAt = seed.completedAt;
        report.parts = parts;
        report.services = services;
        report.expenses = expenses;
    }
    else {
        report = reportRepo.create({
            serviceRequest: seed.serviceRequest,
            technician: seed.technician,
            faultFound: seed.faultFound,
            diagnosisNotes: seed.diagnosisNotes,
            labourCharge: seed.labourCharge,
            partsTotal,
            extraExpensesTotal,
            vatAmount,
            grandTotal,
            customerSignatureUrl: seed.customerSignatureUrl,
            arrivedAt: seed.arrivedAt,
            completedAt: seed.completedAt,
            parts,
            services,
            expenses,
        });
    }
    report = await reportRepo.save(report);
    seed.serviceRequest.status = service_request_entity_1.RequestStatus.COMPLETED;
    seed.serviceRequest.assignedTechnician = seed.technician;
    await AppDataSource.getRepository(service_request_entity_1.ServiceRequest).save(seed.serviceRequest);
    const invoiceRef = `INV-${seed.serviceRequest.jobRef.replace('JOB-', '')}`;
    const existingInvoice = await invoiceRepo.findOne({
        where: { invoiceRef },
        relations: ['jobReport', 'customer'],
    });
    if (existingInvoice) {
        existingInvoice.jobReport = report;
        existingInvoice.customer = seed.customer;
        existingInvoice.subtotal = subtotal;
        existingInvoice.vat = vatAmount;
        existingInvoice.total = grandTotal;
        existingInvoice.paymentStatus = seed.paymentStatus ?? invoice_entity_1.PaymentStatus.UNPAID;
        existingInvoice.paymentMethod = seed.paymentMethod ?? null;
        existingInvoice.paidAt = seed.paidAt ?? null;
        await invoiceRepo.save(existingInvoice);
    }
    else {
        const invoice = invoiceRepo.create({
            invoiceRef,
            jobReport: report,
            customer: seed.customer,
            subtotal,
            vat: vatAmount,
            total: grandTotal,
            paymentStatus: seed.paymentStatus ?? invoice_entity_1.PaymentStatus.UNPAID,
            paymentMethod: seed.paymentMethod,
            paidAt: seed.paidAt,
        });
        await invoiceRepo.save(invoice);
    }
}
async function runSeeder() {
    console.log('Starting job seeder...');
    await AppDataSource.initialize();
    const technician = await createOrUpdateTechnician({
        name: 'Technician User',
        phone: '01847140372',
        email: 'technician@gmail.com',
        password: 'Technician@123',
        role: 'technician',
    });
    const backupTechnician = await createOrUpdateTechnician({
        name: 'Field Technician',
        phone: '+971500000222',
        email: 'field.tech@cooldesk.ae',
        password: 'Technician@123',
        role: 'technician',
    });
    const customerOne = await createOrUpdateCustomer({
        name: 'Araf Yeasin',
        phone: '01614756856',
        email: 'arafyeasin@gmail.com',
        address: 'Dubai Marina, Dubai',
        lat: 25.0800,
        lng: 55.1400,
        password: 'Araf@123',
        isRegistered: true,
    });
    const customerTwo = await createOrUpdateCustomer({
        name: 'Sara Ahmed',
        phone: '+971500000111',
        email: 'sara.ahmed@example.com',
        address: 'Al Barsha 1, Dubai',
        lat: 25.1124,
        lng: 55.2008,
        isRegistered: false,
    });
    const capacitor = await createOrUpdatePart({
        name: 'AC Capacitor',
        sku: 'CAP-45UF',
        unitPrice: 35,
        stockQty: 24,
    });
    const fanMotor = await createOrUpdatePart({
        name: 'Indoor Fan Motor',
        sku: 'MOTOR-IND-01',
        unitPrice: 180,
        stockQty: 8,
    });
    await upsertServiceRequest({
        jobRef: 'JOB-9001',
        customer: customerOne,
        source: service_request_entity_1.RequestSource.WEBSITE,
        serviceType: 'AC Service',
        equipmentType: 'AC',
        equipmentBrand: 'Gree',
        equipmentModel: 'GS-18',
        problemDescription: 'Split AC not cooling properly in the afternoon.',
        address: customerOne.address,
        lat: Number(customerOne.lat),
        lng: Number(customerOne.lng),
        preferredTime: 'Tomorrow morning',
        status: service_request_entity_1.RequestStatus.PENDING,
    });
    await upsertServiceRequest({
        jobRef: 'JOB-9002',
        customer: customerTwo,
        technician,
        source: service_request_entity_1.RequestSource.PHONE,
        serviceType: 'Refrigerator Repair',
        equipmentType: 'Refrigerator',
        equipmentBrand: 'Samsung',
        equipmentModel: 'RT38',
        problemDescription: 'Refrigerator is running but not getting cold.',
        address: customerTwo.address,
        lat: Number(customerTwo.lat),
        lng: Number(customerTwo.lng),
        preferredTime: 'Today 5 PM',
        status: service_request_entity_1.RequestStatus.IN_PROGRESS,
        scheduledAt: new Date('2026-05-30T12:00:00Z'),
    });
    const completedJob = await upsertServiceRequest({
        jobRef: 'JOB-9003',
        customer: customerOne,
        technician: backupTechnician,
        source: service_request_entity_1.RequestSource.WEBSITE,
        serviceType: 'AC Repair',
        equipmentType: 'AC',
        equipmentBrand: 'Daikin',
        equipmentModel: 'DXB-24',
        problemDescription: 'Outdoor unit starts then trips after a few minutes.',
        address: customerOne.address,
        lat: Number(customerOne.lat),
        lng: Number(customerOne.lng),
        preferredTime: 'Yesterday afternoon',
        status: service_request_entity_1.RequestStatus.COMPLETED,
        scheduledAt: new Date('2026-05-28T10:00:00Z'),
    });
    await ensureCompletedJob({
        serviceRequest: completedJob,
        technician: backupTechnician,
        customer: customerOne,
        faultFound: 'Weak capacitor causing compressor startup failure.',
        diagnosisNotes: 'Replaced the capacitor and tested the compressor cycle.',
        labourCharge: 150,
        customerSignatureUrl: 'https://example.com/signatures/job-9003.png',
        arrivedAt: new Date('2026-05-28T10:35:00Z'),
        completedAt: new Date('2026-05-28T12:05:00Z'),
        parts: [
            { part: capacitor, quantity: 1, unitPrice: 35 },
        ],
        services: [
            { serviceName: 'Compressor diagnostics', labourCost: 80, notes: 'Checked overload and starting current.' },
            { serviceName: 'Capacitor replacement', labourCost: 70, notes: 'Installed 45uF capacitor.' },
        ],
        expenses: [
            { description: 'Transport', amount: 20 },
        ],
        paymentStatus: invoice_entity_1.PaymentStatus.PAID,
        paymentMethod: 'cash',
        paidAt: new Date('2026-05-28T12:10:00Z'),
    });
    const instantJob = await upsertServiceRequest({
        jobRef: 'JOB-9004',
        customer: customerTwo,
        technician,
        source: service_request_entity_1.RequestSource.PHONE,
        serviceType: 'Instant AC Call',
        equipmentType: 'AC',
        equipmentBrand: 'LG',
        equipmentModel: 'DualCool',
        problemDescription: 'Technician received a direct call; AC stopped blowing air.',
        address: customerTwo.address,
        lat: Number(customerTwo.lat),
        lng: Number(customerTwo.lng),
        preferredTime: 'Immediate visit',
        status: service_request_entity_1.RequestStatus.COMPLETED,
        scheduledAt: new Date('2026-05-30T08:30:00Z'),
    });
    await ensureCompletedJob({
        serviceRequest: instantJob,
        technician,
        customer: customerTwo,
        faultFound: 'Indoor fan motor seized due to worn bearings.',
        diagnosisNotes: 'Technician created the job from the field and completed it in one visit.',
        labourCharge: 180,
        customerSignatureUrl: 'https://example.com/signatures/job-9004.png',
        arrivedAt: new Date('2026-05-30T09:00:00Z'),
        completedAt: new Date('2026-05-30T10:25:00Z'),
        parts: [
            { part: fanMotor, quantity: 1, unitPrice: 180 },
        ],
        services: [
            { serviceName: 'Emergency visit', labourCost: 90, notes: 'Direct customer phone request.' },
            { serviceName: 'Fan motor replacement', labourCost: 90, notes: 'Tested airflow after replacement.' },
        ],
        expenses: [
            { description: 'Parking', amount: 10 },
        ],
        paymentStatus: invoice_entity_1.PaymentStatus.UNPAID,
    });
    console.log('Job seeder finished.');
    await AppDataSource.destroy();
}
runSeeder().catch((error) => {
    console.error('Job seeder failed:', error);
    process.exit(1);
});
//# sourceMappingURL=job-seeder.js.map