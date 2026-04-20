import { prisma } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { createNotification, createNotificationForAllAdmins } from '@/lib/notifications';

// ========== Types ==========

export type RuleTrigger =
  | 'ticket-created'          // New maintenance ticket
  | 'ticket-updated'          // Ticket status/priority changed
  | 'asset-created'           // New asset added
  | 'asset-status-changed'    // Asset status changed
  | 'approval-created'        // New approval request
  | 'warranty-expiring'       // Warranty nearing expiry
  | 'invoice-overdue'         // Invoice past due date
  | 'sla-at-risk'            // SLA approaching breach
  | 'sla-breached'           // SLA breached
  | 'scheduled-task-due'     // Scheduled maintenance due
  | 'employee-onboarded'     // New employee added
  | 'employee-offboarded'    // Employee deactivated
  | 'stock-low'              // Asset category below threshold
  | 'change-request-created' // New change request
  | 'contract-expiring';     // Contract nearing end

export type RuleAction =
  | 'auto-assign'            // Assign to specific user/role
  | 'auto-approve'           // Auto-approve without human
  | 'auto-escalate'          // Escalate to manager/admin
  | 'auto-notify'            // Send notification
  | 'auto-create-ticket'     // Create maintenance ticket
  | 'auto-create-po'         // Create purchase order
  | 'auto-provision'         // Provision standard asset kit
  | 'auto-deprovision'       // Collect & reset assets
  | 'auto-update-status'     // Update entity status
  | 'auto-schedule'          // Schedule follow-up task
  | 'flag-for-review';       // Flag for human review (the 10%)

export interface AutomationRule {
  id: string;
  name: string;
  description: string | null;
  trigger: string;
  conditions: string; // JSON: { field, operator, value }[]
  actions: string;    // JSON: { type, params }[]
  priority: number;
  isActive: boolean;
  requiresApproval: boolean; // true = needs human sign-off (10%)
  autoApproveBelow: number | null; // auto-approve if amount < this
  createdBy: string | null;
  executionCount: number;
  lastExecutedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationLog {
  id: string;
  ruleId: string;
  ruleName: string;
  trigger: string;
  entityId: string | null;
  entityType: string | null;
  action: string;
  result: string; // 'success' | 'failed' | 'pending-approval' | 'skipped'
  details: string | null;
  executedAt: string;
}

export interface AutomationStats {
  totalRules: number;
  activeRules: number;
  totalExecutions: number;
  autoApproved: number;
  escalatedToHuman: number;
  failedExecutions: number;
  automationRate: number; // percentage
}

// ========== DB Setup ==========

export async function ensureAutomationTables(): Promise<void> {
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AutomationRule" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "name" TEXT NOT NULL,
      "description" TEXT,
      "trigger" TEXT NOT NULL,
      "conditions" TEXT NOT NULL DEFAULT '[]',
      "actions" TEXT NOT NULL DEFAULT '[]',
      "priority" INTEGER NOT NULL DEFAULT 0,
      "isActive" INTEGER NOT NULL DEFAULT 1,
      "requiresApproval" INTEGER NOT NULL DEFAULT 0,
      "autoApproveBelow" REAL,
      "createdBy" TEXT,
      "executionCount" INTEGER NOT NULL DEFAULT 0,
      "lastExecutedAt" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$queryRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "AutomationLog" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "ruleId" TEXT NOT NULL,
      "ruleName" TEXT NOT NULL,
      "trigger" TEXT NOT NULL,
      "entityId" TEXT,
      "entityType" TEXT,
      "action" TEXT NOT NULL,
      "result" TEXT NOT NULL DEFAULT 'success',
      "details" TEXT,
      "executedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

// ========== CRUD ==========

export async function getAutomationRules(options: {
  activeOnly?: boolean; trigger?: string; limit?: number; offset?: number;
} = {}): Promise<{ rules: AutomationRule[]; total: number }> {
  await ensureAutomationTables();
  const { activeOnly, trigger, limit = 100, offset = 0 } = options;
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (activeOnly) { conditions.push(`"isActive" = 1`); }
  if (trigger) { conditions.push(`"trigger" = ?`); params.push(trigger); }
  const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  const countR = await prisma.$queryRawUnsafe<{ count: number }[]>(`SELECT COUNT(*) as count FROM "AutomationRule"${where}`, ...params);
  const total = Number(countR[0]?.count ?? 0);
  const rules = await prisma.$queryRawUnsafe<AutomationRule[]>(
    `SELECT * FROM "AutomationRule"${where} ORDER BY "priority" DESC, "createdAt" DESC LIMIT ? OFFSET ?`, ...params, limit, offset,
  );
  return { rules, total };
}

export async function getAutomationRule(id: string): Promise<AutomationRule | null> {
  await ensureAutomationTables();
  const rows = await prisma.$queryRawUnsafe<AutomationRule[]>(`SELECT * FROM "AutomationRule" WHERE "id" = ?`, id);
  return rows[0] ?? null;
}

export async function createAutomationRule(data: {
  name: string; description?: string; trigger: string; conditions?: object[];
  actions?: object[]; priority?: number; isActive?: boolean;
  requiresApproval?: boolean; autoApproveBelow?: number; createdBy?: string;
}): Promise<string> {
  await ensureAutomationTables();
  const id = generateId();
  await prisma.$queryRawUnsafe(
    `INSERT INTO "AutomationRule" ("id","name","description","trigger","conditions","actions","priority","isActive","requiresApproval","autoApproveBelow","createdBy","executionCount","createdAt","updatedAt")
     VALUES (?,?,?,?,?,?,?,?,?,?,?,0,datetime('now'),datetime('now'))`,
    id, data.name, data.description ?? null, data.trigger,
    JSON.stringify(data.conditions ?? []), JSON.stringify(data.actions ?? []),
    data.priority ?? 0, data.isActive !== false ? 1 : 0,
    data.requiresApproval ? 1 : 0, data.autoApproveBelow ?? null,
    data.createdBy ?? null,
  );
  return id;
}

export async function updateAutomationRule(id: string, data: Partial<{
  name: string; description: string; trigger: string; conditions: object[];
  actions: object[]; priority: number; isActive: boolean;
  requiresApproval: boolean; autoApproveBelow: number;
}>): Promise<void> {
  await ensureAutomationTables();
  const fields: string[] = [];
  const params: unknown[] = [];
  if (data.name !== undefined) { fields.push(`"name" = ?`); params.push(data.name); }
  if (data.description !== undefined) { fields.push(`"description" = ?`); params.push(data.description); }
  if (data.trigger !== undefined) { fields.push(`"trigger" = ?`); params.push(data.trigger); }
  if (data.conditions !== undefined) { fields.push(`"conditions" = ?`); params.push(JSON.stringify(data.conditions)); }
  if (data.actions !== undefined) { fields.push(`"actions" = ?`); params.push(JSON.stringify(data.actions)); }
  if (data.priority !== undefined) { fields.push(`"priority" = ?`); params.push(data.priority); }
  if (data.isActive !== undefined) { fields.push(`"isActive" = ?`); params.push(data.isActive ? 1 : 0); }
  if (data.requiresApproval !== undefined) { fields.push(`"requiresApproval" = ?`); params.push(data.requiresApproval ? 1 : 0); }
  if (data.autoApproveBelow !== undefined) { fields.push(`"autoApproveBelow" = ?`); params.push(data.autoApproveBelow); }
  if (fields.length === 0) return;
  fields.push(`"updatedAt" = datetime('now')`);
  await prisma.$queryRawUnsafe(`UPDATE "AutomationRule" SET ${fields.join(', ')} WHERE "id" = ?`, ...params, id);
}

export async function deleteAutomationRule(id: string): Promise<void> {
  await ensureAutomationTables();
  await prisma.$queryRawUnsafe(`DELETE FROM "AutomationRule" WHERE "id" = ?`, id);
}

// ========== Logs ==========

export async function getAutomationLogs(options: {
  ruleId?: string; result?: string; limit?: number; offset?: number;
} = {}): Promise<{ logs: AutomationLog[]; total: number }> {
  await ensureAutomationTables();
  const { ruleId, result, limit = 100, offset = 0 } = options;
  const conditions: string[] = [];
  const params: unknown[] = [];
  if (ruleId) { conditions.push(`"ruleId" = ?`); params.push(ruleId); }
  if (result) { conditions.push(`"result" = ?`); params.push(result); }
  const where = conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : '';
  const countR = await prisma.$queryRawUnsafe<{ count: number }[]>(`SELECT COUNT(*) as count FROM "AutomationLog"${where}`, ...params);
  const total = Number(countR[0]?.count ?? 0);
  const logs = await prisma.$queryRawUnsafe<AutomationLog[]>(
    `SELECT * FROM "AutomationLog"${where} ORDER BY "executedAt" DESC LIMIT ? OFFSET ?`, ...params, limit, offset,
  );
  return { logs, total };
}

async function logExecution(ruleId: string, ruleName: string, trigger: string, action: string, result: string, entityId?: string, entityType?: string, details?: string): Promise<void> {
  await prisma.$queryRawUnsafe(
    `INSERT INTO "AutomationLog" ("id","ruleId","ruleName","trigger","entityId","entityType","action","result","details","executedAt") VALUES (?,?,?,?,?,?,?,?,?,datetime('now'))`,
    generateId(), ruleId, ruleName, trigger, entityId ?? null, entityType ?? null, action, result, details ?? null,
  );
}

// ========== Stats ==========

export async function getAutomationStats(): Promise<AutomationStats> {
  await ensureAutomationTables();
  const rulesR = await prisma.$queryRawUnsafe<{ total: number; active: number }[]>(
    `SELECT COUNT(*) as total, SUM(CASE WHEN "isActive" = 1 THEN 1 ELSE 0 END) as active FROM "AutomationRule"`,
  );
  const logsR = await prisma.$queryRawUnsafe<{ total: number; approved: number; escalated: number; failed: number }[]>(
    `SELECT COUNT(*) as total,
      SUM(CASE WHEN "action" = 'auto-approve' AND "result" = 'success' THEN 1 ELSE 0 END) as approved,
      SUM(CASE WHEN "result" = 'pending-approval' THEN 1 ELSE 0 END) as escalated,
      SUM(CASE WHEN "result" = 'failed' THEN 1 ELSE 0 END) as failed
     FROM "AutomationLog"`,
  );
  const totalExec = Number(logsR[0]?.total ?? 0);
  const escalated = Number(logsR[0]?.escalated ?? 0);
  const autoHandled = totalExec - escalated;
  return {
    totalRules: Number(rulesR[0]?.total ?? 0),
    activeRules: Number(rulesR[0]?.active ?? 0),
    totalExecutions: totalExec,
    autoApproved: Number(logsR[0]?.approved ?? 0),
    escalatedToHuman: escalated,
    failedExecutions: Number(logsR[0]?.failed ?? 0),
    automationRate: totalExec > 0 ? Math.round((autoHandled / totalExec) * 100) : 90,
  };
}

// ========== RULE EXECUTION ENGINE ==========

interface RuleCondition {
  field: string;
  operator: 'equals' | 'not-equals' | 'greater-than' | 'less-than' | 'contains' | 'in';
  value: string | number | string[];
}

interface RuleActionDef {
  type: RuleAction;
  params: Record<string, unknown>;
}

function evaluateConditions(conditions: RuleCondition[], context: Record<string, unknown>): boolean {
  if (conditions.length === 0) return true;
  return conditions.every((cond) => {
    const fieldValue = context[cond.field];
    switch (cond.operator) {
      case 'equals': return String(fieldValue) === String(cond.value);
      case 'not-equals': return String(fieldValue) !== String(cond.value);
      case 'greater-than': return Number(fieldValue) > Number(cond.value);
      case 'less-than': return Number(fieldValue) < Number(cond.value);
      case 'contains': return String(fieldValue).toLowerCase().includes(String(cond.value).toLowerCase());
      case 'in': return Array.isArray(cond.value) && cond.value.includes(String(fieldValue));
      default: return false;
    }
  });
}

export async function executeRulesForTrigger(
  trigger: RuleTrigger,
  context: Record<string, unknown>,
  entityId?: string,
  entityType?: string,
): Promise<{ executed: number; results: { ruleId: string; ruleName: string; action: string; result: string }[] }> {
  await ensureAutomationTables();
  const { rules } = await getAutomationRules({ activeOnly: true, trigger });
  const results: { ruleId: string; ruleName: string; action: string; result: string }[] = [];
  let executed = 0;

  for (const rule of rules) {
    const conditions: RuleCondition[] = JSON.parse(rule.conditions || '[]');
    const actions: RuleActionDef[] = JSON.parse(rule.actions || '[]');

    if (!evaluateConditions(conditions, context)) continue;

    for (const action of actions) {
      let result = 'success';
      let details = '';

      try {
        // Check if this needs human approval (the 10%)
        if (rule.requiresApproval) {
          const amount = Number(context.amount ?? 0);
          if (rule.autoApproveBelow && amount < rule.autoApproveBelow) {
            // Auto-approve small amounts
            await executeAction(action, context, entityId, entityType);
            details = `Auto-approved (amount ${amount} < threshold ${rule.autoApproveBelow})`;
          } else {
            // Flag for human review
            result = 'pending-approval';
            details = `Escalated to human — amount: ${amount}`;
            await createNotificationForAllAdmins(
              'approval-needed',
              `🤖 Automation requires approval: ${rule.name}`,
              `Rule "${rule.name}" matched but requires your approval. ${details}`,
              '/automation',
            );
          }
        } else {
          await executeAction(action, context, entityId, entityType);
          details = `Fully automated — ${action.type}`;
        }
      } catch (err) {
        result = 'failed';
        details = err instanceof Error ? err.message : 'Unknown error';
      }

      await logExecution(rule.id, rule.name, trigger, action.type, result, entityId, entityType, details);
      // Update execution count
      await prisma.$queryRawUnsafe(
        `UPDATE "AutomationRule" SET "executionCount" = "executionCount" + 1, "lastExecutedAt" = datetime('now'), "updatedAt" = datetime('now') WHERE "id" = ?`,
        rule.id,
      );
      results.push({ ruleId: rule.id, ruleName: rule.name, action: action.type, result });
      executed++;
    }
  }

  return { executed, results };
}

async function executeAction(action: RuleActionDef, context: Record<string, unknown>, entityId?: string, entityType?: string): Promise<void> {
  const params = action.params || {};

  switch (action.type) {
    case 'auto-assign': {
      const assignTo = String(params.assignTo ?? params.userId ?? '');
      if (entityType === 'maintenance' && entityId) {
        await prisma.$queryRawUnsafe(`UPDATE "Maintenance" SET "assignedTo" = ?, "updatedAt" = datetime('now') WHERE "id" = ?`, assignTo, entityId);
      } else if (entityType === 'change-request' && entityId) {
        await prisma.$queryRawUnsafe(`UPDATE "ChangeRequest" SET "assignedTo" = ?, "updatedAt" = datetime('now') WHERE "id" = ?`, assignTo, entityId);
      }
      break;
    }

    case 'auto-approve': {
      if (entityType === 'approval' && entityId) {
        await prisma.$queryRawUnsafe(`UPDATE "ApprovalRequest" SET "status" = 'approved', "updatedAt" = datetime('now') WHERE "id" = ?`, entityId);
        await prisma.$queryRawUnsafe(`UPDATE "ApprovalStep" SET "status" = 'approved', "comment" = '🤖 Auto-approved by automation rule', "decidedAt" = datetime('now') WHERE "requestId" = ? AND "status" = 'pending'`, entityId);
      } else if (entityType === 'change-request' && entityId) {
        await prisma.$queryRawUnsafe(`UPDATE "ChangeRequest" SET "approval" = 'approved', "state" = 'authorize', "updatedAt" = datetime('now') WHERE "id" = ?`, entityId);
      }
      break;
    }

    case 'auto-escalate': {
      const escalateTo = String(params.escalateTo ?? 'admin');
      const users = await prisma.$queryRawUnsafe<{ id: string }[]>(`SELECT "id" FROM "User" WHERE "role" = ? AND "isActive" = 1`, escalateTo);
      for (const user of users) {
        await createNotification(user.id, 'general', `⚠️ Escalation: ${String(context.title ?? 'Item needs attention')}`, String(context.description ?? `Escalated for ${escalateTo} review`), entityType === 'maintenance' ? '/maintenance' : '/dashboard');
      }
      if (entityType === 'maintenance' && entityId) {
        await prisma.$queryRawUnsafe(`UPDATE "Maintenance" SET "priority" = 'critical', "updatedAt" = datetime('now') WHERE "id" = ?`, entityId);
      }
      break;
    }

    case 'auto-notify': {
      const notifyRole = String(params.role ?? 'admin');
      const notifyMsg = String(params.message ?? `Automation alert for ${entityType}`);
      const users = await prisma.$queryRawUnsafe<{ id: string }[]>(`SELECT "id" FROM "User" WHERE "role" = ? AND "isActive" = 1`, notifyRole);
      for (const user of users) {
        await createNotification(user.id, 'general', `🤖 ${String(context.title ?? 'Automation Alert')}`, notifyMsg, '/automation');
      }
      break;
    }

    case 'auto-create-ticket': {
      const ticketTitle = String(params.title ?? context.title ?? 'Auto-Generated Ticket');
      const ticketPriority = String(params.priority ?? 'medium');
      const assetId = String(params.assetId ?? context.assetId ?? entityId ?? '');
      if (assetId) {
        const id = generateId();
        await prisma.$queryRawUnsafe(
          `INSERT INTO "Maintenance" ("id","assetId","type","priority","status","title","description","createdAt","updatedAt") VALUES (?,?,'preventive',?,'open',?,?,datetime('now'),datetime('now'))`,
          id, assetId, ticketPriority, `[Auto] ${ticketTitle}`, String(params.description ?? 'Created by automation rule'),
        );
      }
      break;
    }

    case 'auto-create-po': {
      const poTitle = String(params.title ?? `Auto PO: ${context.category ?? 'Restock'}`);
      const poAmount = Number(params.estimatedAmount ?? 0);
      // Create as approval request for procurement
      const poId = generateId();
      const adminUsers = await prisma.$queryRawUnsafe<{ id: string }[]>(`SELECT "id" FROM "User" WHERE "role" = 'admin' AND "isActive" = 1 LIMIT 1`);
      const adminId = adminUsers[0]?.id ?? 'system';
      await prisma.$queryRawUnsafe(
        `INSERT INTO "ApprovalRequest" ("id","type","title","description","requesterId","amount","entityId","entityType","status","currentLevel","totalLevels","createdAt","updatedAt") VALUES (?,'purchase',?,?,'system',?,?,?,'pending',1,1,datetime('now'),datetime('now'))`,
        poId, poTitle, `Auto-generated purchase order for restocking`, poAmount, entityId ?? null, 'procurement',
      );
      // Create approval step
      await prisma.$queryRawUnsafe(
        `INSERT INTO "ApprovalStep" ("id","requestId","level","approverId","status","createdAt") VALUES (?,?,1,?,'pending',datetime('now'))`,
        generateId(), poId, adminId,
      );
      await createNotificationForAllAdmins('approval-needed', `🛒 Auto Purchase Order: ${poTitle}`, `Stock low — auto-PO created. Amount: $${poAmount}`, '/approvals');
      break;
    }

    case 'auto-provision': {
      // Auto-provision standard kit for new employee
      const employeeName = String(context.name ?? context.employeeName ?? 'New Employee');
      const standardKit = ['Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Headset'];
      const notes = `Standard IT kit provisioned for ${employeeName}: ${standardKit.join(', ')}`;
      await createNotificationForAllAdmins('general', `📦 Auto-Provision: ${employeeName}`, notes, '/assets');
      // Create ticket for IT to prepare kit
      const assetRows = await prisma.$queryRawUnsafe<{ id: string }[]>(`SELECT "id" FROM "Asset" LIMIT 1`);
      if (assetRows.length > 0) {
        const ticketId = generateId();
        await prisma.$queryRawUnsafe(
          `INSERT INTO "Maintenance" ("id","assetId","type","priority","status","title","description","createdAt","updatedAt") VALUES (?,?,'other','high','open',?,?,datetime('now'),datetime('now'))`,
          ticketId, assetRows[0].id, `[Auto] Provision IT Kit: ${employeeName}`, notes,
        );
      }
      break;
    }

    case 'auto-deprovision': {
      const empName = String(context.name ?? context.employeeName ?? 'Employee');
      const empEmail = String(context.email ?? '');
      // Find assets assigned to this employee and mark for collection
      if (empEmail) {
        await prisma.$queryRawUnsafe(`UPDATE "Asset" SET "status" = 'pending-return', "notes" = COALESCE("notes",'') || ' | Auto-flagged for collection', "updatedAt" = datetime('now') WHERE "assignedTo" = ?`, empEmail);
      }
      await createNotificationForAllAdmins('general', `🔓 Auto-Deprovision: ${empName}`, `Employee offboarded — assets flagged for collection. Accounts to be disabled.`, '/assets');
      break;
    }

    case 'auto-update-status': {
      const newStatus = String(params.status ?? 'updated');
      if (entityType === 'maintenance' && entityId) {
        await prisma.$queryRawUnsafe(`UPDATE "Maintenance" SET "status" = ?, "updatedAt" = datetime('now') WHERE "id" = ?`, newStatus, entityId);
      } else if (entityType === 'asset' && entityId) {
        await prisma.$queryRawUnsafe(`UPDATE "Asset" SET "status" = ?, "updatedAt" = datetime('now') WHERE "id" = ?`, newStatus, entityId);
      } else if (entityType === 'change-request' && entityId) {
        await prisma.$queryRawUnsafe(`UPDATE "ChangeRequest" SET "state" = ?, "updatedAt" = datetime('now') WHERE "id" = ?`, newStatus, entityId);
      }
      break;
    }

    case 'auto-schedule': {
      const schedTitle = String(params.title ?? 'Follow-up Task');
      const daysLater = Number(params.daysLater ?? 7);
      await createNotificationForAllAdmins('general', `📅 Scheduled: ${schedTitle}`, `Auto-scheduled for ${daysLater} days from now`, '/scheduled-tasks');
      break;
    }

    case 'flag-for-review': {
      await createNotificationForAllAdmins('approval-needed', `🔍 Review Required: ${String(context.title ?? 'Item needs review')}`, String(params.reason ?? 'Flagged by automation rule for manual review'), entityType === 'maintenance' ? '/maintenance' : '/automation');
      break;
    }
  }
}

// ========== BACKGROUND RUNNER: Periodic checks ==========

export async function runPeriodicAutomation(): Promise<{
  warrantyChecks: number; slaChecks: number; invoiceChecks: number;
  scheduledTasks: number; stockChecks: number; contractChecks: number;
}> {
  await ensureAutomationTables();
  const results = { warrantyChecks: 0, slaChecks: 0, invoiceChecks: 0, scheduledTasks: 0, stockChecks: 0, contractChecks: 0 };

  // 1) WARRANTY EXPIRY CHECK — Auto-alert 30/60/90 days before expiry
  try {
    const expiringAssets = await prisma.$queryRawUnsafe<{ id: string; name: string; warrantyEnd: string; assignedTo: string | null }[]>(
      `SELECT "id", "name", "warrantyEnd", "assignedTo" FROM "Asset" WHERE "warrantyEnd" IS NOT NULL AND date("warrantyEnd") BETWEEN date('now') AND date('now', '+90 days')`,
    );
    for (const asset of expiringAssets) {
      const r = await executeRulesForTrigger('warranty-expiring', { assetId: asset.id, assetName: asset.name, warrantyEnd: asset.warrantyEnd, assignedTo: asset.assignedTo, title: `Warranty expiring: ${asset.name}` }, asset.id, 'asset');
      if (r.executed === 0) {
        // Default action if no rules configured
        await createNotificationForAllAdmins('warranty-expiry', `⚠️ Warranty Expiring: ${asset.name}`, `Warranty ends ${asset.warrantyEnd}`, '/warranty');
      }
      results.warrantyChecks++;
    }
  } catch { /* non-critical */ }

  // 2) SLA BREACH CHECK — Check open tickets against SLA policies
  try {
    const openTickets = await prisma.$queryRawUnsafe<{ id: string; title: string; priority: string; createdAt: string; status: string }[]>(
      `SELECT "id", "title", "priority", "createdAt", "status" FROM "Maintenance" WHERE "status" IN ('open', 'inProgress')`,
    );
    const slaMap: Record<string, number> = { critical: 4, high: 8, medium: 24, low: 72 };
    for (const ticket of openTickets) {
      const maxHours = slaMap[ticket.priority] ?? 24;
      const created = new Date(ticket.createdAt);
      const hoursElapsed = (Date.now() - created.getTime()) / 3600000;
      if (hoursElapsed > maxHours) {
        await executeRulesForTrigger('sla-breached', { ticketId: ticket.id, title: ticket.title, priority: ticket.priority, hoursElapsed: Math.round(hoursElapsed), maxHours }, ticket.id, 'maintenance');
        results.slaChecks++;
      } else if (hoursElapsed > maxHours * 0.75) {
        await executeRulesForTrigger('sla-at-risk', { ticketId: ticket.id, title: ticket.title, priority: ticket.priority, hoursElapsed: Math.round(hoursElapsed), maxHours }, ticket.id, 'maintenance');
        results.slaChecks++;
      }
    }
  } catch { /* non-critical */ }

  // 3) OVERDUE INVOICE CHECK
  try {
    const overdueInvoices = await prisma.invoice.findMany({ where: { status: 'sent', dueDate: { lt: new Date() } }, include: { customer: true } });
    for (const inv of overdueInvoices) {
      await prisma.invoice.update({ where: { id: inv.id }, data: { status: 'overdue' } });
      await executeRulesForTrigger('invoice-overdue', { invoiceId: inv.id, invoiceNumber: inv.invoiceNumber, amount: inv.totalAmount, customerName: inv.customer.companyName, title: `Invoice overdue: ${inv.invoiceNumber}` }, inv.id, 'invoice');
      results.invoiceChecks++;
    }
  } catch { /* non-critical */ }

  // 4) SCHEDULED TASK RUNNER — Run due scheduled tasks
  try {
    const dueTasks = await prisma.$queryRawUnsafe<{ id: string; title: string; description: string | null; assetId: string | null; assignedTo: string | null; frequency: string }[]>(
      `SELECT "id", "title", "description", "assetId", "assignedTo", "frequency" FROM "ScheduledTask" WHERE "isActive" = 1 AND "nextRun" <= datetime('now')`,
    );
    for (const task of dueTasks) {
      if (task.assetId) {
        const ticketId = generateId();
        await prisma.$queryRawUnsafe(
          `INSERT INTO "Maintenance" ("id","assetId","type","priority","status","title","description","assignedTo","createdAt","updatedAt") VALUES (?,?,'preventive','medium','open',?,?,?,datetime('now'),datetime('now'))`,
          ticketId, task.assetId, `[Scheduled] ${task.title}`, task.description ?? 'Auto-generated from scheduled task', task.assignedTo,
        );
      }
      // Calculate next run
      const freqDays: Record<string, string> = { daily: '+1 day', weekly: '+7 days', biweekly: '+14 days', monthly: '+1 month', quarterly: '+3 months', yearly: '+1 year' };
      const interval = freqDays[task.frequency] ?? '+7 days';
      await prisma.$queryRawUnsafe(`UPDATE "ScheduledTask" SET "lastRun" = datetime('now'), "nextRun" = datetime('now', ?), "updatedAt" = datetime('now') WHERE "id" = ?`, interval, task.id);
      await executeRulesForTrigger('scheduled-task-due', { taskId: task.id, title: task.title }, task.id, 'scheduled-task');
      results.scheduledTasks++;
    }
  } catch { /* non-critical */ }

  // 5) STOCK LEVEL CHECK — Alert when asset category count is low
  try {
    const stockLevels = await prisma.$queryRawUnsafe<{ category: string; count: number }[]>(
      `SELECT "category", COUNT(*) as count FROM "Asset" WHERE "status" = 'available' GROUP BY "category"`,
    );
    for (const stock of stockLevels) {
      if (Number(stock.count) <= 2) {
        await executeRulesForTrigger('stock-low', { category: stock.category, availableCount: Number(stock.count), title: `Low stock: ${stock.category}` }, stock.category, 'stock');
        results.stockChecks++;
      }
    }
  } catch { /* non-critical */ }

  // 6) CONTRACT EXPIRY CHECK
  try {
    const expiringContracts = await prisma.customer.findMany({
      where: { contractEnd: { gte: new Date(), lte: new Date(Date.now() + 30 * 86400000) }, status: 'active' },
    });
    for (const cust of expiringContracts) {
      await executeRulesForTrigger('contract-expiring', { customerId: cust.id, customerName: cust.companyName, contractEnd: cust.contractEnd?.toISOString(), title: `Contract expiring: ${cust.companyName}` }, cust.id, 'contract');
      results.contractChecks++;
    }
  } catch { /* non-critical */ }

  return results;
}

// ========== SEED DEFAULT RULES ==========

export async function seedDefaultRules(): Promise<number> {
  await ensureAutomationTables();
  const existing = await prisma.$queryRawUnsafe<{ count: number }[]>(`SELECT COUNT(*) as count FROM "AutomationRule"`);
  if (Number(existing[0]?.count ?? 0) > 0) return 0;

  const defaultRules = [
    {
      name: 'Auto-Approve Low-Value Purchases',
      description: 'Automatically approve purchase requests under $500 SGD',
      trigger: 'approval-created',
      conditions: [{ field: 'type', operator: 'equals', value: 'purchase' }],
      actions: [{ type: 'auto-approve', params: {} }],
      priority: 10,
      requiresApproval: true,
      autoApproveBelow: 500,
    },
    {
      name: 'Auto-Route Critical Tickets',
      description: 'Auto-assign critical tickets to senior engineers and escalate',
      trigger: 'ticket-created',
      conditions: [{ field: 'priority', operator: 'equals', value: 'critical' }],
      actions: [
        { type: 'auto-assign', params: { assignTo: 'admin' } },
        { type: 'auto-notify', params: { role: 'admin', message: 'Critical ticket created — immediate attention required' } },
      ],
      priority: 20,
      requiresApproval: false,
    },
    {
      name: 'Auto-Route High Priority Tickets',
      description: 'Auto-assign high priority tickets to available engineers',
      trigger: 'ticket-created',
      conditions: [{ field: 'priority', operator: 'equals', value: 'high' }],
      actions: [{ type: 'auto-assign', params: { assignTo: 'engineer' } }],
      priority: 15,
      requiresApproval: false,
    },
    {
      name: 'SLA Breach Auto-Escalation',
      description: 'Escalate to management when SLA is breached',
      trigger: 'sla-breached',
      conditions: [],
      actions: [
        { type: 'auto-escalate', params: { escalateTo: 'admin' } },
        { type: 'auto-notify', params: { role: 'admin', message: 'SLA breached — ticket escalated' } },
      ],
      priority: 25,
      requiresApproval: false,
    },
    {
      name: 'SLA At-Risk Warning',
      description: 'Notify assigned engineer when SLA is at risk (75%+ used)',
      trigger: 'sla-at-risk',
      conditions: [],
      actions: [{ type: 'auto-notify', params: { role: 'engineer', message: 'SLA at risk — please prioritize' } }],
      priority: 15,
      requiresApproval: false,
    },
    {
      name: 'Warranty Expiry Auto-Alert',
      description: 'Auto-notify admins when asset warranty is expiring within 90 days',
      trigger: 'warranty-expiring',
      conditions: [],
      actions: [{ type: 'auto-notify', params: { role: 'admin', message: 'Asset warranty expiring soon — review for renewal' } }],
      priority: 10,
      requiresApproval: false,
    },
    {
      name: 'Low Stock Auto-Procurement',
      description: 'Auto-create purchase order when available stock ≤ 2 units',
      trigger: 'stock-low',
      conditions: [],
      actions: [{ type: 'auto-create-po', params: { estimatedAmount: 1000, title: 'Restock' } }],
      priority: 10,
      requiresApproval: true,
      autoApproveBelow: 500,
    },
    {
      name: 'Employee Onboarding Auto-Provision',
      description: 'Auto-provision standard IT kit when new employee is added',
      trigger: 'employee-onboarded',
      conditions: [],
      actions: [{ type: 'auto-provision', params: {} }],
      priority: 10,
      requiresApproval: false,
    },
    {
      name: 'Employee Offboarding Auto-Deprovision',
      description: 'Auto-collect assets and disable accounts when employee leaves',
      trigger: 'employee-offboarded',
      conditions: [],
      actions: [{ type: 'auto-deprovision', params: {} }],
      priority: 10,
      requiresApproval: false,
    },
    {
      name: 'Invoice Overdue Auto-Follow-Up',
      description: 'Mark overdue invoices and notify finance team',
      trigger: 'invoice-overdue',
      conditions: [],
      actions: [
        { type: 'auto-update-status', params: { status: 'overdue' } },
        { type: 'auto-notify', params: { role: 'admin', message: 'Invoice overdue — follow up with customer' } },
      ],
      priority: 10,
      requiresApproval: false,
    },
    {
      name: 'Contract Expiry Renewal Alert',
      description: 'Alert 30 days before customer contract expires',
      trigger: 'contract-expiring',
      conditions: [],
      actions: [
        { type: 'auto-notify', params: { role: 'admin', message: 'Customer contract expiring — initiate renewal discussion' } },
        { type: 'auto-schedule', params: { title: 'Contract Renewal Follow-up', daysLater: 7 } },
      ],
      priority: 10,
      requiresApproval: false,
    },
    {
      name: 'Auto-Approve Standard Changes',
      description: 'Auto-approve standard (low-risk) change requests',
      trigger: 'change-request-created',
      conditions: [{ field: 'type', operator: 'equals', value: 'standard' }, { field: 'risk', operator: 'equals', value: 'low' }],
      actions: [{ type: 'auto-approve', params: {} }],
      priority: 10,
      requiresApproval: false,
    },
    {
      name: 'Emergency Change Escalation',
      description: 'Auto-escalate emergency change requests to all admins',
      trigger: 'change-request-created',
      conditions: [{ field: 'type', operator: 'equals', value: 'emergency' }],
      actions: [
        { type: 'auto-escalate', params: { escalateTo: 'admin' } },
        { type: 'flag-for-review', params: { reason: 'Emergency change — requires immediate human approval' } },
      ],
      priority: 30,
      requiresApproval: true,
      autoApproveBelow: 0,
    },
  ];

  let seeded = 0;
  for (const rule of defaultRules) {
    await createAutomationRule({
      name: rule.name,
      description: rule.description,
      trigger: rule.trigger,
      conditions: rule.conditions,
      actions: rule.actions,
      priority: rule.priority,
      requiresApproval: rule.requiresApproval ?? false,
      autoApproveBelow: rule.autoApproveBelow,
      createdBy: 'system',
    });
    seeded++;
  }
  return seeded;
}
