const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create users
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // Admin user (Dev Admin)
  await prisma.user.upsert({
    where: { email: 'admin@unitech.sg' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@unitech.sg',
      name: 'Admin User',
      displayName: 'Admin',
      password: hashedPassword,
      role: 'dev_admin',
    },
  });

  // Production Admin - Myo Min
  const myoPassword = await bcrypt.hash('myo123', 10);
  await prisma.user.upsert({
    where: { email: 'myo@unitech.sg' },
    update: {},
    create: {
      username: 'myoadmin',
      email: 'myo@unitech.sg',
      name: 'Myo Min',
      displayName: 'Myo Min',
      password: myoPassword,
      role: 'dev_admin',
    },
  });

  // Financial Controller - Yulius Herman
  const yuPassword = await bcrypt.hash('yu123', 10);
  await prisma.user.upsert({
    where: { email: 'yulius@unitech.sg' },
    update: {},
    create: {
      username: 'yuadmin',
      email: 'yulius@unitech.sg',
      name: 'Yulius Herman',
      displayName: 'Yulius Herman',
      password: yuPassword,
      role: 'finance_controller',
    },
  });

  // Create employees
  const employees = [
    { employeeId: 'UT-E001', name: 'Tan Wei Ming', email: 'weiming@unitech.sg', department: 'Engineering', position: 'Senior Engineer', phone: '+65 9123 4567', status: 'active', joinDate: new Date('2022-03-15') },
    { employeeId: 'UT-E002', name: 'Sarah Lim', email: 'sarah@unitech.sg', department: 'IT Department', position: 'IT Manager', phone: '+65 9234 5678', status: 'active', joinDate: new Date('2021-06-01') },
    { employeeId: 'UT-E003', name: 'Ahmad Rahman', email: 'ahmad@unitech.sg', department: 'Sales', position: 'Sales Executive', phone: '+65 9345 6789', status: 'active', joinDate: new Date('2023-01-10') },
    { employeeId: 'UT-E004', name: 'Li Xiao Mei', email: 'xiaomei@unitech.sg', department: 'Marketing', position: 'Marketing Manager', phone: '+65 9456 7890', status: 'active', joinDate: new Date('2022-08-20') },
    { employeeId: 'UT-E005', name: 'Kumar Patel', email: 'kumar@unitech.sg', department: 'Engineering', position: 'DevOps Engineer', phone: '+65 9567 8901', status: 'active', joinDate: new Date('2023-04-05') },
    { employeeId: 'UT-E006', name: 'Jessica Wong', email: 'jessica@unitech.sg', department: 'HR', position: 'HR Executive', phone: '+65 9678 9012', status: 'active', joinDate: new Date('2022-11-15') },
    { employeeId: 'UT-E007', name: 'David Chen', email: 'david@unitech.sg', department: 'Finance', position: 'Accountant', phone: '+65 9789 0123', status: 'active', joinDate: new Date('2023-02-28') },
    { employeeId: 'UT-E008', name: 'Nurul Huda', email: 'nurul@unitech.sg', department: 'Operations', position: 'Operations Lead', phone: '+65 9890 1234', status: 'inactive', joinDate: new Date('2021-09-01') },
  ];

  for (const emp of employees) {
    await prisma.employee.upsert({
      where: { employeeId: emp.employeeId },
      update: {},
      create: emp,
    });
  }

  // Create assets
  const assets = [
    { assetTag: 'UT-LP-001', name: 'MacBook Pro 16"', category: 'Laptop', type: 'Apple', brand: 'Apple', model: 'MacBook Pro M3 Pro', serialNumber: 'C02XK1TZMD6T', status: 'assigned', condition: 'excellent', location: 'Office - Level 3', purchaseDate: new Date('2024-01-15'), purchasePrice: 3899, warrantyEnd: new Date('2027-01-15'), assignedTo: 'Tan Wei Ming', ipAddress: '192.168.1.101', macAddress: 'A4:83:E7:2B:1C:5D', specifications: 'M3 Pro, 18GB RAM, 512GB SSD' },
    { assetTag: 'UT-LP-002', name: 'ThinkPad X1 Carbon', category: 'Laptop', type: 'Windows', brand: 'Lenovo', model: 'X1 Carbon Gen 11', serialNumber: 'PF3NKXYZ', status: 'assigned', condition: 'good', location: 'Office - Level 2', purchaseDate: new Date('2023-08-20'), purchasePrice: 2450, warrantyEnd: new Date('2026-08-20'), assignedTo: 'Sarah Lim', ipAddress: '192.168.1.102', macAddress: 'B4:2E:99:3A:4F:7E', specifications: 'i7-1365U, 16GB RAM, 512GB SSD' },
    { assetTag: 'UT-DT-001', name: 'Dell OptiPlex 7090', category: 'Desktop', type: 'Windows', brand: 'Dell', model: 'OptiPlex 7090', serialNumber: 'DELL7090XYZ', status: 'assigned', condition: 'good', location: 'Office - Level 2', purchaseDate: new Date('2023-03-10'), purchasePrice: 1850, warrantyEnd: new Date('2026-03-10'), assignedTo: 'Ahmad Rahman', ipAddress: '192.168.1.201', macAddress: 'C4:3D:88:1B:2E:6F' },
    { assetTag: 'UT-SV-001', name: 'Dell PowerEdge R740', category: 'Server', type: 'Rack Mount', brand: 'Dell', model: 'PowerEdge R740', serialNumber: 'SVR740ABC', status: 'active', condition: 'good', location: 'Server Room', purchaseDate: new Date('2022-06-15'), purchasePrice: 12500, warrantyEnd: new Date('2026-06-15'), ipAddress: '192.168.1.10', macAddress: 'D4:4E:77:5C:3D:8A', specifications: '2x Xeon Gold, 128GB RAM, 4x 2TB SSD RAID' },
    { assetTag: 'UT-PR-001', name: 'HP LaserJet Pro MFP', category: 'Printer', type: 'Laser', brand: 'HP', model: 'LaserJet Pro M428fdw', serialNumber: 'HP428FDW123', status: 'active', condition: 'good', location: 'Office - Level 2 Print Area', purchaseDate: new Date('2023-01-05'), purchasePrice: 680, warrantyEnd: new Date('2025-01-05') },
    { assetTag: 'UT-MN-001', name: 'Dell UltraSharp 27"', category: 'Monitor', type: '4K Display', brand: 'Dell', model: 'U2723QE', serialNumber: 'DELLMON27XYZ', status: 'assigned', condition: 'excellent', location: 'Office - Level 3', purchaseDate: new Date('2024-01-15'), purchasePrice: 850, warrantyEnd: new Date('2027-01-15'), assignedTo: 'Tan Wei Ming' },
    { assetTag: 'UT-PH-001', name: 'iPhone 15 Pro', category: 'Phone', type: 'Mobile', brand: 'Apple', model: 'iPhone 15 Pro 256GB', serialNumber: 'DNQXYZ123456', status: 'assigned', condition: 'excellent', location: 'Office - Level 3', purchaseDate: new Date('2024-02-01'), purchasePrice: 1649, warrantyEnd: new Date('2025-02-01'), assignedTo: 'Kumar Patel' },
    { assetTag: 'UT-NW-001', name: 'Cisco Catalyst 9200', category: 'Network', type: 'Switch', brand: 'Cisco', model: 'Catalyst 9200-48P', serialNumber: 'CISCOCAT9200', status: 'active', condition: 'good', location: 'Server Room', purchaseDate: new Date('2022-09-01'), purchasePrice: 4200, warrantyEnd: new Date('2025-09-01'), ipAddress: '192.168.1.1', macAddress: 'E4:5F:66:7A:8B:9C' },
  ];

  for (const asset of assets) {
    await prisma.asset.upsert({
      where: { assetTag: asset.assetTag },
      update: {},
      create: asset,
    });
  }

  // Create maintenance tickets
  const allAssets = await prisma.asset.findMany();
  const assetMap = new Map(allAssets.map((a) => [a.assetTag, a.id]));

  const tickets = [
    { assetId: assetMap.get('UT-LP-002'), type: 'repair', priority: 'high', status: 'open', title: 'Keyboard malfunction on ThinkPad', description: 'Several keys not responding intermittently', assignedTo: 'IT Support Team', cost: 250 },
    { assetId: assetMap.get('UT-PR-001'), type: 'repair', priority: 'medium', status: 'inProgress', title: 'Printer paper jam issue', description: 'Frequent paper jams in tray 2', assignedTo: 'HP Service Center', cost: 150 },
    { assetId: assetMap.get('UT-SV-001'), type: 'upgrade', priority: 'low', status: 'open', title: 'Server RAM upgrade', description: 'Upgrade server RAM from 128GB to 256GB', assignedTo: 'Kumar Patel', cost: 2400 },
    { assetId: assetMap.get('UT-NW-001'), type: 'inspection', priority: 'medium', status: 'resolved', title: 'Network switch firmware update', description: 'Update Cisco Catalyst firmware to latest version', assignedTo: 'Sarah Lim', cost: 0, resolvedAt: new Date('2024-10-15') },
    { assetId: assetMap.get('UT-DT-001'), type: 'repair', priority: 'critical', status: 'inProgress', title: 'Desktop BSOD issue', description: 'Blue screen errors occurring randomly', assignedTo: 'IT Support Team', cost: 180 },
  ];

  for (const ticket of tickets) {
    if (ticket.assetId) {
      await prisma.maintenance.create({ data: ticket });
    }
  }

  // Create activity logs
  const logs = [
    { action: 'create', entity: 'asset', details: 'MacBook Pro 16" added to inventory' },
    { action: 'assign', entity: 'asset', details: 'ThinkPad X1 assigned to Sarah Lim' },
    { action: 'create', entity: 'maintenance', details: 'Ticket created: Keyboard malfunction' },
    { action: 'update', entity: 'employee', details: 'Kumar Patel profile updated' },
    { action: 'create', entity: 'asset', details: 'Cisco Catalyst 9200 added to inventory' },
  ];

  for (const log of logs) {
    await prisma.activityLog.create({ data: log });
  }

  // Create customers (Singapore SME clients)
  const customers = [
    { companyName: 'Oceanic Trading Pte Ltd', uen: '202312345A', address: '10 Anson Road, #12-05 International Plaza', postalCode: '079903', contactPerson: 'Jason Lim', contactEmail: 'jason@oceanictrading.sg', contactPhone: '+65 6321 4567', website: 'https://oceanictrading.sg', industry: 'Trading & Distribution', companySize: '50-100', contractType: 'retainer', contractValue: 3600, contractStart: new Date('2024-01-01'), contractEnd: new Date('2024-12-31'), status: 'active', gstRegistered: true, gstNumber: 'M90012345A', paymentTerms: 30, creditLimit: 10000 },
    { companyName: 'Greenleaf F&B Group', uen: '201908765B', address: '50 Jurong Gateway Road, #03-11 JEM', postalCode: '608549', contactPerson: 'Michelle Tan', contactEmail: 'michelle@greenleaffb.com', contactPhone: '+65 6432 5678', website: 'https://greenleaffb.com', industry: 'Food & Beverage', companySize: '100-200', contractType: 'project', contractValue: 15000, contractStart: new Date('2024-03-01'), contractEnd: new Date('2024-09-30'), status: 'active', gstRegistered: true, gstNumber: 'M90023456B', paymentTerms: 14 },
    { companyName: 'Apex Logistics Solutions', uen: '202001234C', address: '1 Changi Business Park Crescent, #05-01', postalCode: '486025', contactPerson: 'Ravi Kumar', contactEmail: 'ravi@apexlogistics.sg', contactPhone: '+65 6543 6789', website: 'https://apexlogistics.sg', industry: 'Logistics', companySize: '20-50', contractType: 'ad-hoc', status: 'active', paymentTerms: 30 },
    { companyName: 'NovaTech Engineering', uen: '201756789D', address: '25 International Business Park, #08-02 German Centre', postalCode: '609916', contactPerson: 'Daniel Ng', contactEmail: 'daniel@novatech.com.sg', contactPhone: '+65 6654 7890', website: 'https://novatech.com.sg', industry: 'Engineering', companySize: '10-20', contractType: 'retainer', contractValue: 1800, contractStart: new Date('2024-06-01'), contractEnd: new Date('2025-05-31'), status: 'active', gstRegistered: false, paymentTerms: 30 },
    { companyName: 'SkyBridge Media', uen: '202234567E', address: '71 Ayer Rajah Crescent, #06-14', postalCode: '139951', contactPerson: 'Amanda Koh', contactEmail: 'amanda@skybridgemedia.sg', contactPhone: '+65 6765 8901', industry: 'Media & Creative', companySize: '5-10', status: 'prospect', paymentTerms: 14 },
  ];
  for (const cust of customers) {
    await prisma.customer.create({ data: cust });
  }

  // Create vendors
  const vendors = [
    { companyName: 'Dell Technologies Singapore', uen: '199905678F', address: '1 Fusionopolis Place, #14-10 Galaxis', postalCode: '138522', contactPerson: 'Kelly Sim', contactEmail: 'kelly.sim@dell.com', contactPhone: '+65 6511 1234', website: 'https://dell.com.sg', category: 'hardware', rating: 5, status: 'active', gstRegistered: true, gstNumber: 'M90034567F', paymentTerms: 45 },
    { companyName: 'Singtel Business Solutions', uen: '199206789G', address: '31 Exeter Road, Comcentre', postalCode: '239732', contactPerson: 'Adrian Loh', contactEmail: 'adrian.loh@singtel.com', contactPhone: '+65 6838 2222', website: 'https://singtel.com', category: 'telecom', rating: 4, status: 'active', gstRegistered: true, gstNumber: 'M90045678G', paymentTerms: 30 },
    { companyName: 'Microsoft Singapore', uen: '200007890H', address: '1 Marina Boulevard, #22-01', postalCode: '018989', contactPerson: 'Sophia Tan', contactEmail: 'sophia.tan@microsoft.com', contactPhone: '+65 6888 8888', website: 'https://microsoft.com/sg', category: 'software', rating: 5, status: 'active', gstRegistered: true, paymentTerms: 30 },
    { companyName: 'CompuServe IT Services', uen: '201834567J', address: '10 Ubi Crescent, #04-50 Ubi Techpark', postalCode: '408564', contactPerson: 'Heng Chee Keong', contactEmail: 'ck@compuserve.sg', contactPhone: '+65 6745 3210', website: 'https://compuserve.sg', category: 'services', rating: 3, status: 'active', paymentTerms: 30 },
  ];
  for (const v of vendors) {
    await prisma.vendor.create({ data: v });
  }

  // Create invoices
  const allCustomers = await prisma.customer.findMany();
  const custMap = new Map(allCustomers.map(c => [c.companyName, c.id]));

  const invoices = [
    { invoiceNumber: 'INV-2024-001', customerId: custMap.get('Oceanic Trading Pte Ltd'), type: 'invoice', status: 'paid', issueDate: new Date('2024-01-15'), dueDate: new Date('2024-02-14'), subtotal: 3600, gstRate: 9, gstAmount: 324, totalAmount: 3924, paidAmount: 3924, items: JSON.stringify([{ desc: 'Monthly IT Support Retainer (Jan 2024)', qty: 1, rate: 3600 }]), paidAt: new Date('2024-02-10') },
    { invoiceNumber: 'INV-2024-002', customerId: custMap.get('Greenleaf F&B Group'), type: 'invoice', status: 'paid', issueDate: new Date('2024-03-15'), dueDate: new Date('2024-03-29'), subtotal: 8500, gstRate: 9, gstAmount: 765, totalAmount: 9265, paidAmount: 9265, items: JSON.stringify([{ desc: 'Network Infrastructure Setup', qty: 1, rate: 5500 }, { desc: 'POS System Integration', qty: 1, rate: 3000 }]), paidAt: new Date('2024-03-28') },
    { invoiceNumber: 'INV-2024-003', customerId: custMap.get('Oceanic Trading Pte Ltd'), type: 'invoice', status: 'sent', issueDate: new Date('2024-02-15'), dueDate: new Date('2024-03-16'), subtotal: 3600, gstRate: 9, gstAmount: 324, totalAmount: 3924, paidAmount: 0, items: JSON.stringify([{ desc: 'Monthly IT Support Retainer (Feb 2024)', qty: 1, rate: 3600 }]) },
    { invoiceNumber: 'INV-2024-004', customerId: custMap.get('NovaTech Engineering'), type: 'invoice', status: 'overdue', issueDate: new Date('2024-05-01'), dueDate: new Date('2024-05-31'), subtotal: 4200, gstRate: 9, gstAmount: 378, totalAmount: 4578, paidAmount: 0, items: JSON.stringify([{ desc: 'Server Migration Project', qty: 1, rate: 3000 }, { desc: 'Data Backup Setup', qty: 1, rate: 1200 }]) },
    { invoiceNumber: 'QUO-2024-001', customerId: custMap.get('SkyBridge Media'), type: 'quotation', status: 'sent', issueDate: new Date('2024-06-01'), dueDate: new Date('2024-06-30'), subtotal: 12000, gstRate: 9, gstAmount: 1080, totalAmount: 13080, paidAmount: 0, items: JSON.stringify([{ desc: 'Full IT Infrastructure Setup', qty: 1, rate: 8000 }, { desc: 'Cybersecurity Package', qty: 1, rate: 4000 }]) },
  ];
  for (const inv of invoices) {
    if (inv.customerId) {
      await prisma.invoice.create({ data: inv });
    }
  }

  // Create CRM activities
  const crmActivities = [
    { customerId: custMap.get('Oceanic Trading Pte Ltd'), type: 'meeting', title: 'Quarterly review meeting', description: 'Discussed IT support performance and upcoming needs', contactPerson: 'Jason Lim', status: 'completed', completedAt: new Date('2024-06-15'), assignedTo: 'Sarah Lim' },
    { customerId: custMap.get('Greenleaf F&B Group'), type: 'site-visit', title: 'New outlet IT setup', description: 'Site survey for new Tampines outlet', contactPerson: 'Michelle Tan', status: 'completed', completedAt: new Date('2024-07-01'), assignedTo: 'Kumar Patel' },
    { customerId: custMap.get('SkyBridge Media'), type: 'follow-up', title: 'Follow up on quotation', description: 'Follow up on IT infrastructure quotation QUO-2024-001', contactPerson: 'Amanda Koh', status: 'scheduled', scheduledAt: new Date('2024-07-15'), assignedTo: 'Ahmad Rahman' },
    { customerId: custMap.get('Apex Logistics Solutions'), type: 'support', title: 'Email server troubleshooting', description: 'Resolved email delivery issues', contactPerson: 'Ravi Kumar', status: 'completed', completedAt: new Date('2024-06-20'), assignedTo: 'Tan Wei Ming' },
    { customerId: custMap.get('NovaTech Engineering'), type: 'call', title: 'Payment follow-up call', description: 'Called regarding overdue invoice INV-2024-004', contactPerson: 'Daniel Ng', status: 'completed', completedAt: new Date('2024-06-10'), assignedTo: 'David Chen' },
  ];
  for (const act of crmActivities) {
    if (act.customerId) {
      await prisma.cRMActivity.create({ data: act });
    }
  }

  // Create change requests (ServiceNow-style)
  const changeRequests = [
    { number: 'CHG0000001', shortDescription: 'Upgrade server room UPS system', description: 'Replace existing 5kVA UPS with 10kVA model to support additional rack servers', approval: 'approved', type: 'normal', state: 'implement', priority: 'high', risk: 'moderate', impact: 'high', category: 'hardware', plannedStartDate: new Date('2024-07-15'), plannedEndDate: new Date('2024-07-17'), assignedTo: 'Kumar Patel', requestedBy: 'Sarah Lim', implementationPlan: '1. Power down non-critical systems\n2. Install new UPS\n3. Test failover\n4. Restore systems', backoutPlan: 'Reconnect old UPS if new unit fails acceptance testing' },
    { number: 'CHG0000002', shortDescription: 'Migrate email to Microsoft 365', description: 'Migrate all company email accounts from on-premise Exchange to Microsoft 365 Business Premium', approval: 'approved', type: 'normal', state: 'scheduled', priority: 'high', risk: 'high', impact: 'high', category: 'software', plannedStartDate: new Date('2024-08-01'), plannedEndDate: new Date('2024-08-05'), assignedTo: 'Tan Wei Ming', requestedBy: 'Sarah Lim', implementationPlan: '1. Setup M365 tenant\n2. Configure DNS\n3. Batch migrate mailboxes\n4. Verify and cutover' },
    { number: 'CHG0000003', shortDescription: 'Install new network switches on Level 3', description: 'Replace aging Cisco 2960 switches with Catalyst 9200 on Level 3', approval: 'requested', type: 'normal', state: 'review', priority: 'medium', risk: 'moderate', impact: 'medium', category: 'network', plannedStartDate: new Date('2024-08-10'), plannedEndDate: new Date('2024-08-11'), assignedTo: 'Kumar Patel', requestedBy: 'Tan Wei Ming' },
    { number: 'CHG0000004', shortDescription: 'Deploy endpoint protection across all workstations', description: 'Install and configure CrowdStrike Falcon on all Windows and Mac endpoints', approval: 'approved', type: 'standard', state: 'implement', priority: 'critical', risk: 'low', impact: 'high', category: 'security', plannedStartDate: new Date('2024-07-10'), plannedEndDate: new Date('2024-07-12'), assignedTo: 'Sarah Lim', requestedBy: 'Admin User' },
    { number: 'CHG0000005', shortDescription: 'Upgrade Wi-Fi access points in office', description: 'Replace Ubiquiti AC Pro APs with Wi-Fi 6E U6 Enterprise models', approval: 'not-yet-requested', type: 'normal', state: 'new', priority: 'medium', risk: 'low', impact: 'medium', category: 'network', plannedStartDate: new Date('2024-09-01'), plannedEndDate: new Date('2024-09-02'), assignedTo: 'Tan Wei Ming', requestedBy: 'Li Xiao Mei' },
    { number: 'CHG0000006', shortDescription: 'Emergency firewall rule update', description: 'Block incoming traffic from suspicious IP ranges detected by SOC', approval: 'approved', type: 'emergency', state: 'closed', priority: 'critical', risk: 'low', impact: 'low', category: 'security', plannedStartDate: new Date('2024-06-20'), plannedEndDate: new Date('2024-06-20'), assignedTo: 'Kumar Patel', requestedBy: 'Sarah Lim', closureCode: 'successful', closureNotes: 'Firewall rules applied. Suspicious traffic blocked successfully.' },
    { number: 'CHG0000007', shortDescription: 'Add SSL certificate to company website', description: 'Procure and install wildcard SSL certificate for *.unitech.sg', approval: 'approved', type: 'standard', state: 'closed', priority: 'medium', risk: 'low', impact: 'medium', category: 'security', plannedStartDate: new Date('2024-06-01'), plannedEndDate: new Date('2024-06-01'), assignedTo: 'Tan Wei Ming', requestedBy: 'Ahmad Rahman', closureCode: 'successful', closureNotes: 'SSL installed and verified. HTTPS enforced.' },
    { number: 'CHG0000008', shortDescription: 'Upgrade accounting software to v12', description: 'Upgrade Xero integration and accounting module from v10 to v12', approval: 'rejected', type: 'normal', state: 'review', priority: 'low', risk: 'moderate', impact: 'medium', category: 'software', plannedStartDate: new Date('2024-08-15'), plannedEndDate: new Date('2024-08-16'), assignedTo: 'David Chen', requestedBy: 'Jessica Wong' },
    { number: 'CHG0000009', shortDescription: 'Server room air conditioning maintenance', description: 'Scheduled preventive maintenance on CRAC units in server room', approval: 'approved', type: 'standard', state: 'authorize', priority: 'medium', risk: 'moderate', impact: 'high', category: 'hardware', plannedStartDate: new Date('2024-08-20'), plannedEndDate: new Date('2024-08-20'), assignedTo: 'Nurul Huda', requestedBy: 'Sarah Lim' },
    { number: 'CHG0000010', shortDescription: 'Deploy new VPN solution for remote staff', description: 'Replace OpenVPN with WireGuard for better performance and security', approval: 'requested', type: 'normal', state: 'review', priority: 'high', risk: 'high', impact: 'high', category: 'network', plannedStartDate: new Date('2024-09-10'), plannedEndDate: new Date('2024-09-14'), assignedTo: 'Kumar Patel', requestedBy: 'Tan Wei Ming', implementationPlan: '1. Setup WireGuard server\n2. Create user profiles\n3. Pilot with IT team\n4. Rollout to all remote staff' },
    { number: 'CHG0000011', shortDescription: 'Printer fleet consolidation', description: 'Reduce printer count from 8 to 4 MFPs with secure print release', approval: 'not-yet-requested', type: 'normal', state: 'new', priority: 'low', risk: 'low', impact: 'low', category: 'hardware', assignedTo: 'Nurul Huda', requestedBy: 'Jessica Wong' },
    { number: 'CHG0000012', shortDescription: 'Configure backup for NAS storage', description: 'Setup automated nightly backup of Synology NAS to AWS S3', approval: 'approved', type: 'standard', state: 'implement', priority: 'high', risk: 'low', impact: 'high', category: 'software', plannedStartDate: new Date('2024-07-22'), plannedEndDate: new Date('2024-07-23'), assignedTo: 'Tan Wei Ming', requestedBy: 'Kumar Patel' },
  ];
  for (const cr of changeRequests) {
    await prisma.changeRequest.create({ data: cr });
  }

  console.log('✅ Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
