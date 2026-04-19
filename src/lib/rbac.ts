// Role-Based Access Control constants and types

export const ROLES = {
  DEV_ADMIN: 'dev_admin',
  TENANT_ADMIN: 'tenant_admin',
  FINANCE_CONTROLLER: 'finance_controller',
  ENGINEER: 'engineer',
} as const;

export type RoleKey = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<RoleKey, { en: string; zh: string }> = {
  dev_admin: { en: 'Dev Admin', zh: '开发管理员' },
  tenant_admin: { en: 'Tenant Admin', zh: '租户管理员' },
  finance_controller: { en: 'Finance Controller', zh: '财务总监' },
  engineer: { en: 'Engineer', zh: '工程师' },
};

export const ROLE_DESCRIPTIONS: Record<RoleKey, { en: string; zh: string }> = {
  dev_admin: {
    en: 'Full system access. Can manage all settings, users, roles, and system configuration.',
    zh: '完全系统访问权限。可以管理所有设置、用户、角色和系统配置。',
  },
  tenant_admin: {
    en: 'Manage company assets, employees, and tickets. Cannot modify system settings or roles.',
    zh: '管理公司资产、员工和工单。无法修改系统设置或角色。',
  },
  finance_controller: {
    en: 'Full access to finance, invoices, vendors, and reports. Limited system administration.',
    zh: '完全访问财务、发票、供应商和报告。有限的系统管理权限。',
  },
  engineer: {
    en: 'View and update assigned assets and tickets. Limited create/delete permissions.',
    zh: '查看和更新分配的资产和工单。有限的创建/删除权限。',
  },
};

export const RESOURCES = [
  'assets',
  'employees',
  'maintenance',
  'reports',
  'ai_assistant',
  'settings',
  'users',
  'roles',
  'warranty_alerts',
  'system_config',
  'barcode_scanner',
] as const;

export type Resource = (typeof RESOURCES)[number];

export const RESOURCE_LABELS: Record<Resource, { en: string; zh: string }> = {
  assets: { en: 'Assets', zh: '资产' },
  employees: { en: 'Employees', zh: '员工' },
  maintenance: { en: 'Maintenance', zh: '维护工单' },
  reports: { en: 'Reports', zh: '报告' },
  ai_assistant: { en: 'AI Assistant', zh: 'AI 助手' },
  settings: { en: 'Settings', zh: '设置' },
  users: { en: 'User Management', zh: '用户管理' },
  roles: { en: 'Role Management', zh: '角色管理' },
  warranty_alerts: { en: 'Warranty Alerts', zh: '保修提醒' },
  system_config: { en: 'System Config', zh: '系统配置' },
  barcode_scanner: { en: 'Barcode Scanner', zh: '条码扫描' },
};

export interface PermissionSet {
  canCreate: boolean;
  canRead: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}

export type RolePermissions = Record<Resource, PermissionSet>;

// Default permissions for each role
export const DEFAULT_PERMISSIONS: Record<RoleKey, RolePermissions> = {
  dev_admin: Object.fromEntries(
    RESOURCES.map(r => [r, { canCreate: true, canRead: true, canUpdate: true, canDelete: true }])
  ) as RolePermissions,

  tenant_admin: {
    assets: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
    employees: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
    maintenance: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
    reports: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    ai_assistant: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    settings: { canCreate: false, canRead: true, canUpdate: true, canDelete: false },
    users: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
    roles: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    warranty_alerts: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
    system_config: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    barcode_scanner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  },

  finance_controller: {
    assets: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    employees: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    maintenance: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    reports: { canCreate: true, canRead: true, canUpdate: true, canDelete: true },
    ai_assistant: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    settings: { canCreate: false, canRead: true, canUpdate: true, canDelete: false },
    users: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    roles: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    warranty_alerts: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    system_config: { canCreate: false, canRead: false, canUpdate: false, canDelete: false },
    barcode_scanner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  },

  engineer: {
    assets: { canCreate: false, canRead: true, canUpdate: true, canDelete: false },
    employees: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    maintenance: { canCreate: true, canRead: true, canUpdate: true, canDelete: false },
    reports: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    ai_assistant: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    settings: { canCreate: false, canRead: false, canUpdate: false, canDelete: false },
    users: { canCreate: false, canRead: false, canUpdate: false, canDelete: false },
    roles: { canCreate: false, canRead: false, canUpdate: false, canDelete: false },
    warranty_alerts: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
    system_config: { canCreate: false, canRead: false, canUpdate: false, canDelete: false },
    barcode_scanner: { canCreate: false, canRead: true, canUpdate: false, canDelete: false },
  },
};
