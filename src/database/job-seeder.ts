import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import { Customer } from '../customers/entities/customer.entity';
import { Technician } from '../technicians/entities/technician.entity';
import { ServiceRequest, RequestSource, RequestStatus } from '../service-requests/entities/service-request.entity';
import { JobReport } from '../job-reports/entities/job-report.entity';
import { JobPart } from '../job-reports/entities/job-part.entity';
import { JobService } from '../job-reports/entities/job-service.entity';
import { JobExpense } from '../job-reports/entities/job-expense.entity';
import { Invoice, PaymentStatus } from '../invoices/entities/invoice.entity';
import { Review } from '../reviews/entities/review.entity';
import { Notification } from '../notifications/entities/notification.entity';
import { Part } from '../parts/entities/part.entity';
import { ServiceCatalogue } from '../services-catalogue/entities/service-catalogue.entity';

function loadEnv() {
  const envPath = join(__dirname, '..', '..', '.env');
  if (!existsSync(envPath)) return;

  const env = readFileSync(envPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#'));

  for (const line of env) {
    const [key, ...valueParts] = line.split('=');
    if (!key) continue;
    process.env[key] = valueParts.join('=');
  }
}

loadEnv();

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_NAME || 'cooldesk',
  synchronize: false,
  logging: false,
  entities: [
    Customer,
    Technician,
    ServiceRequest,
    JobReport,
    JobPart,
    JobService,
    JobExpense,
    Invoice,
    Review,
    Notification,
    Part,
    ServiceCatalogue,
  ],
});

async function createOrUpdateCustomer(details: {
  name: string;
  phone: string;
  email?: string;
  address: string;
  lat?: number;
  lng?: number;
  password?: string;
  isRegistered?: boolean;
}) {
  const customerRepo = AppDataSource.getRepository(Customer);
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

async function createOrUpdateTechnician(details: {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: string;
}) {
  const technicianRepo = AppDataSource.getRepository(Technician);
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

async function createOrUpdatePart(details: {
  name: string;
  sku: string;
  unitPrice: number;
  stockQty: number;
  minStockLevel?: number;
  needsReview?: boolean;
}) {
  const partRepo = AppDataSource.getRepository(Part);
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

async function upsertServiceRequest(seed: {
  jobRef: string;
  customer: Customer;
  technician?: Technician;
  source: RequestSource;
  serviceType: string;
  equipmentType?: string;
  equipmentBrand?: string;
  equipmentModel?: string;
  problemDescription: string;
  address: string;
  lat?: number;
  lng?: number;
  preferredTime?: string;
  status: RequestStatus;
  scheduledAt?: Date;
}) {
  const repo = AppDataSource.getRepository(ServiceRequest);
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

async function ensureCompletedJob(seed: {
  serviceRequest: ServiceRequest;
  technician: Technician;
  customer: Customer;
  faultFound: string;
  diagnosisNotes: string;
  labourCharge: number;
  customerSignatureUrl?: string;
  arrivedAt: Date;
  completedAt: Date;
  parts: Array<{ part: Part; quantity: number; unitPrice: number }>;
  services: Array<{ serviceName: string; labourCost: number; notes?: string }>;
  expenses: Array<{ description: string; amount: number }>;
  paymentStatus?: PaymentStatus;
  paymentMethod?: string;
  paidAt?: Date;
}) {
  const reportRepo = AppDataSource.getRepository(JobReport);
  const invoiceRepo = AppDataSource.getRepository(Invoice);

  const existingReport = await reportRepo.findOne({
    where: { serviceRequest: { id: seed.serviceRequest.id } },
    relations: ['serviceRequest', 'invoice'],
  });

  const parts = seed.parts.map((entry) => {
    const jobPart = new JobPart();
    jobPart.part = entry.part;
    jobPart.quantity = entry.quantity;
    jobPart.unitPrice = entry.unitPrice;
    jobPart.lineTotal = entry.quantity * entry.unitPrice;
    jobPart.isCustom = false;
    return jobPart;
  });

  const services = seed.services.map((entry) => {
    const jobService = new JobService();
    jobService.serviceName = entry.serviceName;
    jobService.labourCost = entry.labourCost;
    jobService.notes = entry.notes;
    return jobService;
  });

  const expenses = seed.expenses.map((entry) => {
    const jobExpense = new JobExpense();
    jobExpense.description = entry.description;
    jobExpense.amount = entry.amount;
    return jobExpense;
  });

  const partsTotal = parts.reduce((sum, item) => sum + Number(item.lineTotal), 0);
  const extraExpensesTotal = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const subtotal = Number(seed.labourCharge) + partsTotal + extraExpensesTotal;
  const vatAmount = Number((subtotal * 0.05).toFixed(2));
  const grandTotal = Number((subtotal + vatAmount).toFixed(2));

  let report: JobReport;
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
  } else {
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

  seed.serviceRequest.status = RequestStatus.COMPLETED;
  seed.serviceRequest.assignedTechnician = seed.technician;
  await AppDataSource.getRepository(ServiceRequest).save(seed.serviceRequest);

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
    existingInvoice.paymentStatus = seed.paymentStatus ?? PaymentStatus.UNPAID;
    existingInvoice.paymentMethod = seed.paymentMethod ?? null;
    existingInvoice.paidAt = seed.paidAt ?? null;
    await invoiceRepo.save(existingInvoice);
  } else {
    const invoice = invoiceRepo.create({
      invoiceRef,
      jobReport: report,
      customer: seed.customer,
      subtotal,
      vat: vatAmount,
      total: grandTotal,
      paymentStatus: seed.paymentStatus ?? PaymentStatus.UNPAID,
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
    source: RequestSource.WEBSITE,
    serviceType: 'AC Service',
    equipmentType: 'AC',
    equipmentBrand: 'Gree',
    equipmentModel: 'GS-18',
    problemDescription: 'Split AC not cooling properly in the afternoon.',
    address: customerOne.address,
    lat: Number(customerOne.lat),
    lng: Number(customerOne.lng),
    preferredTime: 'Tomorrow morning',
    status: RequestStatus.PENDING,
  });

  await upsertServiceRequest({
    jobRef: 'JOB-9002',
    customer: customerTwo,
    technician,
    source: RequestSource.PHONE,
    serviceType: 'Refrigerator Repair',
    equipmentType: 'Refrigerator',
    equipmentBrand: 'Samsung',
    equipmentModel: 'RT38',
    problemDescription: 'Refrigerator is running but not getting cold.',
    address: customerTwo.address,
    lat: Number(customerTwo.lat),
    lng: Number(customerTwo.lng),
    preferredTime: 'Today 5 PM',
    status: RequestStatus.IN_PROGRESS,
    scheduledAt: new Date('2026-05-30T12:00:00Z'),
  });

  const completedJob = await upsertServiceRequest({
    jobRef: 'JOB-9003',
    customer: customerOne,
    technician: backupTechnician,
    source: RequestSource.WEBSITE,
    serviceType: 'AC Repair',
    equipmentType: 'AC',
    equipmentBrand: 'Daikin',
    equipmentModel: 'DXB-24',
    problemDescription: 'Outdoor unit starts then trips after a few minutes.',
    address: customerOne.address,
    lat: Number(customerOne.lat),
    lng: Number(customerOne.lng),
    preferredTime: 'Yesterday afternoon',
    status: RequestStatus.COMPLETED,
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
    paymentStatus: PaymentStatus.PAID,
    paymentMethod: 'cash',
    paidAt: new Date('2026-05-28T12:10:00Z'),
  });

  const instantJob = await upsertServiceRequest({
    jobRef: 'JOB-9004',
    customer: customerTwo,
    technician,
    source: RequestSource.PHONE,
    serviceType: 'Instant AC Call',
    equipmentType: 'AC',
    equipmentBrand: 'LG',
    equipmentModel: 'DualCool',
    problemDescription: 'Technician received a direct call; AC stopped blowing air.',
    address: customerTwo.address,
    lat: Number(customerTwo.lat),
    lng: Number(customerTwo.lng),
    preferredTime: 'Immediate visit',
    status: RequestStatus.COMPLETED,
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
    paymentStatus: PaymentStatus.UNPAID,
  });

  console.log('Job seeder finished.');
  await AppDataSource.destroy();
}

runSeeder().catch((error) => {
  console.error('Job seeder failed:', error);
  process.exit(1);
});
