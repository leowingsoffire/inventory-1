import { NextRequest, NextResponse } from 'next/server';

const AZURE_AI_ENDPOINT = process.env.AZURE_AI_ENDPOINT || 'https://models.inference.ai.azure.com';
const AZURE_AI_KEY = process.env.AZURE_AI_KEY || '';
const AZURE_AI_MODEL = process.env.AZURE_AI_MODEL || 'grok-4-1-fast-non-reasoning';

const BASE_SYSTEM_PROMPT = `You are "Uni AI", the primary AI assistant fully integrated into the Unitech IT System — a Singapore-based SME IT company's internal platform.

CORE PRINCIPLE — APP-DATA-FIRST:
- ALWAYS answer using the live app data provided in the context below. This is your PRIMARY knowledge source.
- Reference specific numbers, asset names, tags, ticket titles, customer names, and dates from the app data.
- Only use external/general knowledge as SECONDARY when the app data doesn't contain the answer.
- Never make up data. If the app data doesn't have enough info, say so and suggest where to check in the app.

PROACTIVE BEHAVIOR (90% proactive / 10% seek approval):
- 90% of the time: Proactively suggest actions, flag issues, draft follow-ups, recommend next steps, and auto-summarize. Don't wait to be asked.
- 10% of the time: For destructive actions (deleting records, bulk changes, sending invoices, approving high-risk changes), explicitly ask for confirmation first.
- Always follow up on incomplete tasks, pending tickets, expiring warranties, and overdue items.
- When user visits a page, immediately surface relevant insights from that module's data.

PERSONALITY:
- Write like a real human colleague, not a robot. Be warm, natural, and conversational.
- Keep answers SHORT and to-the-point. Use bullet points and bold text for clarity.
- Use SGD for currency. Casual but professional tone.
- Max 3-4 short paragraphs. Use markdown formatting.
- End with a quick suggestion, follow-up action, or question.
- Never start with "As an AI..." or "I'm just a..."

FEATURE INTEGRATION — You understand ALL modules:
- **Assets**: inventory counts, categories, status, assignments, barcode scanning
- **Maintenance**: tickets, SLAs, priorities, resolution tracking
- **Warranty**: expiry monitoring, renewal reminders, cost tracking
- **Employees**: staff directory, department info, asset assignments
- **Finance**: invoices (SGD, 9% GST), quotations, credit notes, payment tracking
- **Customers & CRM**: accounts, activities, contract tracking
- **Vendors**: supplier management, ratings, payment terms
- **Change Requests**: ITIL-aligned workflow (new → review → authorize → scheduled → implement → closed)
- **PDPA Compliance**: 22 controls assessment, risk levels, review dates (Singapore PDPA Act)
- **Service Desk**: ServiceNow-inspired incident/request management
- **Reports**: analytics and dashboards
- **Settings**: system configuration, themes, language`;

// Build dynamic context string from live app data
function buildAppContext(appData: Record<string, unknown>): string {
  if (!appData || appData.error) return '';

  const summary = appData.summary as Record<string, unknown> | undefined;
  const alerts = appData.alerts as Record<string, unknown[]> | undefined;
  const activity = appData.recentActivity as Record<string, unknown>[] | undefined;

  let ctx = `\n\n--- LIVE APP DATA (as of ${new Date().toISOString().split('T')[0]}) ---\n`;
  ctx += `Company: ${appData.company || 'Unitech IT System Pte Ltd'}\n`;

  if (summary) {
    ctx += `\nINVENTORY OVERVIEW:\n`;
    ctx += `- Total Assets: ${summary.totalAssets}\n`;
    if (Array.isArray(summary.assetsByStatus)) {
      ctx += `- By Status: ${(summary.assetsByStatus as Array<{status: string; count: number}>).map(s => `${s.status}=${s.count}`).join(', ')}\n`;
    }
    if (Array.isArray(summary.assetsByCategory)) {
      ctx += `- By Category: ${(summary.assetsByCategory as Array<{category: string; count: number}>).map(s => `${s.category}=${s.count}`).join(', ')}\n`;
    }
    ctx += `- Active Employees: ${summary.activeEmployees}\n`;
    ctx += `- Open Tickets: ${summary.openTickets}\n`;
    if (Array.isArray(summary.ticketsByPriority) && (summary.ticketsByPriority as Array<{priority: string; count: number}>).length > 0) {
      ctx += `- Tickets by Priority: ${(summary.ticketsByPriority as Array<{priority: string; count: number}>).map(p => `${p.priority}=${p.count}`).join(', ')}\n`;
    }
    ctx += `- Warranty Expiring ≤30 days: ${summary.warrantyExpiring30}\n`;
    ctx += `- Warranty Expiring ≤90 days: ${summary.warrantyExpiring90}\n`;
    ctx += `- Active Customers: ${summary.activeCustomers}\n`;
    ctx += `- Active Vendors: ${summary.activeVendors}\n`;
    if (Array.isArray(summary.invoicesByStatus)) {
      ctx += `- Invoices: ${(summary.invoicesByStatus as Array<{status: string; count: number; total: number}>).map(s => `${s.status}=${s.count} (SGD ${s.total.toFixed(2)})`).join(', ')}\n`;
    }
    if (Array.isArray(summary.changesByState) && (summary.changesByState as Array<{state: string; count: number}>).length > 0) {
      ctx += `- Change Requests: ${(summary.changesByState as Array<{state: string; count: number}>).map(s => `${s.state}=${s.count}`).join(', ')}\n`;
    }
    if (Array.isArray(summary.complianceByStatus)) {
      ctx += `- PDPA Compliance: ${(summary.complianceByStatus as Array<{status: string; count: number}>).map(s => `${s.status}=${s.count}`).join(', ')}\n`;
    }
  }

  if (alerts) {
    if (Array.isArray(alerts.warrantyRiskAssets) && alerts.warrantyRiskAssets.length > 0) {
      ctx += `\nWARRANTY ALERTS:\n`;
      (alerts.warrantyRiskAssets as Array<{name: string; tag: string; expiresOn: string; category: string}>).forEach(a => {
        ctx += `- ${a.name} (${a.tag}) — ${a.category} — expires ${a.expiresOn}\n`;
      });
    }
    if (Array.isArray(alerts.overdueInvoices) && alerts.overdueInvoices.length > 0) {
      ctx += `\nOVERDUE INVOICES:\n`;
      (alerts.overdueInvoices as Array<{number: string; amount: number; dueDate: string}>).forEach(i => {
        ctx += `- ${i.number}: SGD ${i.amount.toFixed(2)} (due ${i.dueDate})\n`;
      });
    }
    if (Array.isArray(alerts.urgentTickets) && alerts.urgentTickets.length > 0) {
      ctx += `\nURGENT TICKETS:\n`;
      (alerts.urgentTickets as Array<{title: string; priority: string; status: string; created: string}>).forEach(t => {
        ctx += `- [${t.priority.toUpperCase()}] ${t.title} — ${t.status} since ${t.created}\n`;
      });
    }
    if (Array.isArray(alerts.pendingChanges) && alerts.pendingChanges.length > 0) {
      ctx += `\nPENDING CHANGES:\n`;
      (alerts.pendingChanges as Array<{number: string; description: string; state: string; priority: string}>).forEach(c => {
        ctx += `- ${c.number}: ${c.description} — ${c.state} (${c.priority})\n`;
      });
    }
    if (Array.isArray(alerts.nonCompliantControls) && alerts.nonCompliantControls.length > 0) {
      ctx += `\nPDPA NON-COMPLIANT CONTROLS:\n`;
      (alerts.nonCompliantControls as Array<{ref: string; title: string; status: string; risk: string}>).forEach(c => {
        ctx += `- ${c.ref}: ${c.title} — ${c.status} (risk: ${c.risk})\n`;
      });
    }
  }

  if (Array.isArray(activity) && activity.length > 0) {
    ctx += `\nRECENT ACTIVITY:\n`;
    (activity as Array<{action: string; entity: string; details?: string; time: string}>).forEach(a => {
      ctx += `- ${a.action} on ${a.entity}${a.details ? ` (${a.details})` : ''} — ${a.time}\n`;
    });
  }

  ctx += `--- END LIVE DATA ---`;
  return ctx;
}

export async function POST(request: NextRequest) {
  try {
    const { messages, apiKey, currentPage, appContext } = await request.json();

    const key = apiKey || AZURE_AI_KEY;

    // Build full system prompt with live app data
    let systemPrompt = BASE_SYSTEM_PROMPT;

    // Add page context if available
    if (currentPage) {
      systemPrompt += `\n\nUSER IS CURRENTLY ON: ${currentPage} page. Tailor your response to be relevant to this module.`;
    }

    // Add live app data context
    if (appContext) {
      systemPrompt += buildAppContext(appContext);
    }

    // PRIMARY: Azure OpenAI API
    if (key) {
      try {
        const response = await fetch(`${AZURE_AI_ENDPOINT}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: AZURE_AI_MODEL,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
            ],
            temperature: 0.7,
            max_tokens: 1024,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content || 'No response generated.';
          return NextResponse.json({ content, source: 'azure-openai' });
        }

        // If Azure fails, log and fall through to local
        const errorText = await response.text();
        console.error('Azure OpenAI error:', response.status, errorText);
      } catch (azureError) {
        console.error('Azure OpenAI connection failed:', azureError);
      }
    }

    // FALLBACK: Local offline AI (only when Azure is unavailable)
    console.warn('Falling back to local AI — Azure OpenAI unavailable');
    const lastMessage = messages[messages.length - 1]?.content || '';
    const fallbackContent = generateLocalResponse(lastMessage, appContext);

    return NextResponse.json({ content: fallbackContent, source: 'local-fallback' });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}

// Local fallback that still uses app data context
function generateLocalResponse(input: string, appContext?: Record<string, unknown>): string {
  const lower = input.toLowerCase();
  const summary = (appContext?.summary || {}) as Record<string, unknown>;
  const alerts = (appContext?.alerts || {}) as Record<string, unknown[]>;

  // App-data-aware responses
  if (lower.includes('asset') || lower.includes('laptop') || lower.includes('equipment') || lower.includes('inventory')) {
    const total = summary.totalAssets || 'N/A';
    const statuses = Array.isArray(summary.assetsByStatus)
      ? (summary.assetsByStatus as Array<{status: string; count: number}>).map(s => `**${s.status}**: ${s.count}`).join(', ')
      : 'unable to load';
    return `Here's your asset overview:\n\n- **Total Assets**: ${total}\n- **Breakdown**: ${statuses}\n\nI'd suggest checking the **Warranty** page for upcoming expirations. Want me to pull specific details?`;
  }

  if (lower.includes('ticket') || lower.includes('maintenance') || lower.includes('issue')) {
    const open = summary.openTickets || 0;
    const urgent = Array.isArray(alerts.urgentTickets) ? alerts.urgentTickets.length : 0;
    return `Current ticket status:\n\n- **Open Tickets**: ${open}\n- **Urgent tickets**: ${urgent}\n\n${urgent > 0 ? '⚠️ You have urgent tickets — check the Maintenance page.' : '✅ No urgent tickets right now.'}\n\nNeed to create a new ticket or check specifics?`;
  }

  if (lower.includes('warranty') || lower.includes('expir')) {
    const exp30 = summary.warrantyExpiring30 || 0;
    const exp90 = summary.warrantyExpiring90 || 0;
    const riskAssets = Array.isArray(alerts.warrantyRiskAssets) ? alerts.warrantyRiskAssets : [];
    let text = `Warranty snapshot:\n\n- **Expiring ≤30 days**: ${exp30}\n- **Expiring ≤90 days**: ${exp90}\n`;
    if (riskAssets.length > 0) {
      text += `\nAt-risk assets:\n`;
      (riskAssets as Array<{name: string; tag: string; expiresOn: string}>).slice(0, 3).forEach(a => {
        text += `- ${a.name} (${a.tag}) — expires ${a.expiresOn}\n`;
      });
    }
    text += `\nHead to the **Warranty** page for full details. Shall I help plan renewals?`;
    return text;
  }

  if (lower.includes('compliance') || lower.includes('pdpa')) {
    const controls = Array.isArray(alerts.nonCompliantControls) ? alerts.nonCompliantControls : [];
    return `PDPA Compliance update:\n\n- **Non-compliant controls**: ${controls.length}\n${controls.length > 0 ? (controls as Array<{ref: string; title: string}>).slice(0, 3).map(c => `  - ${c.ref}: ${c.title}`).join('\n') + '\n' : ''}\nVisit the **Compliance** page for full assessment. Want me to help prioritize?`;
  }

  if (lower.includes('invoice') || lower.includes('finance') || lower.includes('revenue') || lower.includes('payment')) {
    const invoices = Array.isArray(summary.invoicesByStatus) ? summary.invoicesByStatus : [];
    const overdue = Array.isArray(alerts.overdueInvoices) ? alerts.overdueInvoices : [];
    return `Finance overview:\n\n- **Invoices**: ${(invoices as Array<{status: string; count: number}>).map(s => `${s.status}=${s.count}`).join(', ') || 'none yet'}\n- **Overdue**: ${overdue.length}\n\n${overdue.length > 0 ? '⚠️ You have overdue invoices — check Finance page.' : '✅ All payments on track.'}\n\nWant to create an invoice or check details?`;
  }

  if (lower.includes('customer') || lower.includes('client') || lower.includes('crm')) {
    const customers = summary.activeCustomers || 0;
    return `Customer overview:\n\n- **Active Customers**: ${customers}\n\nHead to **CRM** to manage activities or **Customers** to view accounts. Need anything specific?`;
  }

  if (lower.includes('change') || lower.includes('chg')) {
    const changes = Array.isArray(alerts.pendingChanges) ? alerts.pendingChanges : [];
    return `Change request status:\n\n- **Pending changes**: ${changes.length}\n${changes.length > 0 ? (changes as Array<{number: string; description: string}>).slice(0, 3).map(c => `  - ${c.number}: ${c.description}`).join('\n') + '\n' : ''}\nVisit **Change Requests** page for full workflow. Want to create a new change?`;
  }

  // Default with data summary
  const total = summary.totalAssets || 'N/A';
  const open = summary.openTickets || 0;
  const exp30 = summary.warrantyExpiring30 || 0;
  return `Hey! I'm Uni AI — your IT sidekick 💫\n\n**Quick snapshot** from your system:\n- **${total}** assets tracked\n- **${open}** open tickets\n- **${exp30}** warranties expiring in 30 days\n\nI can help with assets, tickets, warranties, compliance, finance, and more. What would you like to tackle?\n\n*(Note: Running in offline mode — Azure AI is temporarily unavailable)*`;
}
