import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

// Escalating email tone templates
const TONE_TEMPLATES = {
  en: [
    {
      attempt: 1,
      subject: 'Warranty Reminder - {assetName}',
      body: `Dear {customerName},

We hope this message finds you well. This is a friendly reminder that the warranty for your {assetName} ({assetTag}) is set to expire on {warrantyEnd}.

We recommend reaching out to discuss renewal options to ensure continued coverage and support for your equipment.

Please feel free to contact us at your convenience.

Best regards,
Unitech IT Solutions`,
    },
    {
      attempt: 2,
      subject: 'Follow-up: Warranty Expiring Soon - {assetName}',
      body: `Dear {customerName},

We are following up on our previous notification regarding the warranty for your {assetName} ({assetTag}), which will expire on {warrantyEnd}.

To avoid any service disruption, we kindly suggest considering a warranty renewal at your earliest convenience. Our team is ready to assist you with competitive renewal packages tailored to your needs.

We look forward to hearing from you.

Warm regards,
Unitech IT Solutions`,
    },
    {
      attempt: 3,
      subject: 'Urgent: Warranty Expiration Notice - {assetName}',
      body: `Dear {customerName},

This is an important notice regarding the warranty for your {assetName} ({assetTag}). The warranty is scheduled to expire on {warrantyEnd}, and we have not yet received your response to our previous reminders.

Without an active warranty, any future repairs or replacements will be chargeable at standard service rates. We strongly recommend renewing the warranty to maintain cost-effective coverage.

Please respond at your earliest convenience to discuss your options.

Regards,
Unitech IT Solutions`,
    },
    {
      attempt: 4,
      subject: 'Final Warning: Warranty About to Expire - {assetName}',
      body: `Dear {customerName},

This is our final reminder before escalation regarding the warranty for your {assetName} ({assetTag}), expiring on {warrantyEnd}.

As we have not received a response to our previous communications, we want to ensure you are fully aware of the implications. Post-warranty service will incur additional costs, and response times may be longer.

Please contact us immediately to secure your warranty renewal.

Urgent regards,
Unitech IT Solutions`,
    },
    {
      attempt: 5,
      subject: 'ESCALATION: Warranty Expired/Expiring - {assetName} - Management Attention Required',
      body: `Dear {customerName},

This matter has been escalated to our management team due to the approaching/past expiration of the warranty for your {assetName} ({assetTag}) on {warrantyEnd}.

Despite multiple attempts to reach you regarding warranty renewal, we have not received a response. Our IT Admin has been included in this communication for oversight.

We urge you to take immediate action to avoid service coverage gaps. Please contact us at your earliest possible convenience.

This is our final automated communication regarding this matter.

Sincerely,
Unitech IT Solutions Management`,
    },
  ],
  zh: [
    {
      attempt: 1,
      subject: '保修提醒 - {assetName}',
      body: `尊敬的{customerName}，

您好！我们在此温馨提醒您，您的{assetName}（{assetTag}）的保修将于{warrantyEnd}到期。

建议您联系我们讨论续保方案，以确保持续的保障和支持。

期待您的回复。

此致，
Unitech IT Solutions`,
    },
    {
      attempt: 2,
      subject: '跟进：保修即将到期 - {assetName}',
      body: `尊敬的{customerName}，

我们就您的{assetName}（{assetTag}）保修到期事宜进行跟进。保修将于{warrantyEnd}到期。

为避免服务中断，建议您尽早考虑续保。我们的团队已准备好为您提供量身定制的续保方案。

期待您的回复。

此致，
Unitech IT Solutions`,
    },
    {
      attempt: 3,
      subject: '紧急：保修到期通知 - {assetName}',
      body: `尊敬的{customerName}，

这是关于您的{assetName}（{assetTag}）保修的重要通知。保修将于{warrantyEnd}到期，我们尚未收到您对之前提醒的回复。

保修到期后，任何维修或更换将按标准服务费率收费。我们强烈建议续保以维持经济实惠的保障。

请尽快回复。

此致，
Unitech IT Solutions`,
    },
    {
      attempt: 4,
      subject: '最终警告：保修即将到期 - {assetName}',
      body: `尊敬的{customerName}，

这是关于{assetName}（{assetTag}）保修（到期日：{warrantyEnd}）升级前的最后通知。

由于我们未收到您对之前通信的回复，请确保您已充分了解相关影响。保修期后的服务将产生额外费用，响应时间也可能延长。

请立即联系我们以确保续保。

此致，
Unitech IT Solutions`,
    },
    {
      attempt: 5,
      subject: '升级通知：保修已到期/即将到期 - {assetName} - 需管理层关注',
      body: `尊敬的{customerName}，

由于{assetName}（{assetTag}）保修即将于{warrantyEnd}到期/已到期，此事已升级至管理层。

尽管我们多次尝试联系您续保，但未收到回复。IT管理员已被加入此通信。

请立即采取行动以避免服务覆盖空白。

这是关于此事的最终自动通信。

此致，
Unitech IT Solutions 管理团队`,
    },
  ],
};

function fillTemplate(template: string, data: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(data)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}

// POST: Check and send warranty alerts
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'check') {
      // Find assets with warranties expiring within alert windows
      const now = new Date();
      const alertDays = [60, 30, 7];
      const results: Array<{ assetId: string; assetTag: string; name: string; daysLeft: number; alertType: string }> = [];

      const assets = await prisma.asset.findMany({
        where: { warrantyEnd: { not: '' } },
      });

      for (const asset of assets) {
        if (!asset.warrantyEnd) continue;
        const warrantyDate = new Date(asset.warrantyEnd);
        const daysLeft = Math.ceil((warrantyDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        for (const days of alertDays) {
          if (daysLeft <= days && daysLeft > 0) {
            const alertType = `${days}_day`;
            // Check if alert already sent
            const existing = await prisma.warrantyAlert.findFirst({
              where: { assetId: asset.id, alertType, status: { not: 'failed' } },
            });
            if (!existing) {
              results.push({
                assetId: asset.id,
                assetTag: asset.assetTag,
                name: asset.name,
                daysLeft,
                alertType,
              });
            }
            break; // Only trigger the most urgent alert
          }
        }
      }

      return NextResponse.json({ alerts: results });
    }

    if (action === 'send') {
      const { assetId, alertType, lang = 'en' } = body;
      const asset = await prisma.asset.findUnique({ where: { id: assetId } });
      if (!asset) {
        return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
      }

      // Get or create warranty alert record
      let alert = await prisma.warrantyAlert.findFirst({
        where: { assetId, alertType },
      });

      const attempt = alert ? alert.attempts + 1 : 1;
      const toneIdx = Math.min(attempt, 5) - 1;
      const toneKey = lang === 'zh' ? 'zh' : 'en';
      const template = TONE_TEMPLATES[toneKey][toneIdx];

      const data = {
        customerName: asset.customerName || asset.assignedTo || 'Valued Customer',
        assetName: asset.name,
        assetTag: asset.assetTag,
        warrantyEnd: asset.warrantyEnd ? String(asset.warrantyEnd) : 'N/A',
      };

      const subject = fillTemplate(template.subject, data);
      const emailBody = fillTemplate(template.body, data);
      const ccEmails = attempt >= 3 ? 'admin@unitech.sg' : '';

      if (alert) {
        await prisma.warrantyAlert.update({
          where: { id: alert.id },
          data: {
            attempts: attempt,
            lastAttempt: new Date(),
            nextAttempt: attempt < 5 ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) : null,
            subject,
            body: emailBody,
            ccEmails,
            status: attempt >= 5 ? 'escalated' : 'sent',
          },
        });
      } else {
        await prisma.warrantyAlert.create({
          data: {
            assetId,
            alertType,
            daysBefore: parseInt(alertType.split('_')[0]),
            recipientEmail: asset.customerEmail || '',
            ccEmails,
            status: 'sent',
            attempts: 1,
            maxAttempts: 5,
            lastAttempt: new Date(),
            nextAttempt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
            subject,
            body: emailBody,
          },
        });
      }

      // In production, this would use nodemailer to send the email
      // For prototype, we return the composed email
      return NextResponse.json({
        success: true,
        email: {
          to: asset.customerEmail || 'customer@example.com',
          cc: ccEmails,
          subject,
          body: emailBody,
          attempt,
        },
      });
    }

    if (action === 'get_template') {
      const { attempt = 1, lang = 'en' } = body;
      const toneKey = lang === 'zh' ? 'zh' : 'en';
      const toneIdx = Math.min(Math.max(attempt, 1), 5) - 1;
      return NextResponse.json({ template: TONE_TEMPLATES[toneKey][toneIdx] });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Warranty API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET: List all warranty alerts
export async function GET() {
  try {
    const alerts = await prisma.warrantyAlert.findMany({
      include: { asset: true },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(alerts);
  } catch (error) {
    console.error('Warranty GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
