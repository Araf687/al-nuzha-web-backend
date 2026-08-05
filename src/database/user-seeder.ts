import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import * as bcrypt from 'bcrypt';
import { Customer } from '../customers/entities/customer.entity';
import { Technician } from '../technicians/entities/technician.entity';
import { ServiceRequest } from '../service-requests/entities/service-request.entity';
import { JobReport } from '../job-reports/entities/job-report.entity';
import { JobPart } from '../job-reports/entities/job-part.entity';
import { JobService } from '../job-reports/entities/job-service.entity';
import { JobExpense } from '../job-reports/entities/job-expense.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
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
  // Register full entity graph so inverse relations can be resolved during metadata build.
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

async function createOrUpdateCustomer() {
  const customerRepo = AppDataSource.getRepository(Customer);
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

async function createOrUpdateTechnician(details: {
  name: string;
  phone: string;
  email: string;
  password: string;
  role: string;
}) {
  const technicianRepo = AppDataSource.getRepository(Technician);
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
