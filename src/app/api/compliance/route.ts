import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

const PDPA_CONTROLS = [
  // Governance & Accountability
  { category: 'Governance', controlRef: 'GOV-01', controlTitle: 'Data Protection Officer (DPO)', description: 'Designate a Data Protection Officer responsible for PDPA compliance', riskLevel: 'high' },
  { category: 'Governance', controlRef: 'GOV-02', controlTitle: 'Data Protection Policy', description: 'Establish and maintain a comprehensive data protection policy', riskLevel: 'high' },
  { category: 'Governance', controlRef: 'GOV-03', controlTitle: 'Data Protection Impact Assessment', description: 'Conduct DPIA for new projects involving personal data', riskLevel: 'high' },
  { category: 'Governance', controlRef: 'GOV-04', controlTitle: 'Employee Training', description: 'Regular PDPA training for all staff handling personal data', riskLevel: 'medium' },
  { category: 'Governance', controlRef: 'GOV-05', controlTitle: 'Incident Response Plan', description: 'Documented plan for data breach notification within 3 days', riskLevel: 'high' },
  // Consent Obligation
  { category: 'Consent', controlRef: 'CON-01', controlTitle: 'Consent Collection', description: 'Obtain consent before collecting personal data with clear purpose', riskLevel: 'high' },
  { category: 'Consent', controlRef: 'CON-02', controlTitle: 'Consent Withdrawal', description: 'Provide mechanism for individuals to withdraw consent', riskLevel: 'medium' },
  { category: 'Consent', controlRef: 'CON-03', controlTitle: 'Deemed Consent', description: 'Document scenarios where deemed consent applies', riskLevel: 'medium' },
  // Purpose Limitation
  { category: 'Purpose Limitation', controlRef: 'PUR-01', controlTitle: 'Purpose Notification', description: 'Notify individuals of purposes for data collection', riskLevel: 'high' },
  { category: 'Purpose Limitation', controlRef: 'PUR-02', controlTitle: 'Use Limitation', description: 'Use personal data only for notified purposes', riskLevel: 'high' },
  // Notification Obligation
  { category: 'Notification', controlRef: 'NOT-01', controlTitle: 'Privacy Notice', description: 'Publish clear privacy notice on website and forms', riskLevel: 'high' },
  { category: 'Notification', controlRef: 'NOT-02', controlTitle: 'Breach Notification', description: 'Notify PDPC of significant data breaches within 3 calendar days', riskLevel: 'high' },
  // Access & Correction
  { category: 'Access & Correction', controlRef: 'ACC-01', controlTitle: 'Access Request Process', description: 'Process for individuals to request access to their personal data', riskLevel: 'medium' },
  { category: 'Access & Correction', controlRef: 'ACC-02', controlTitle: 'Correction Request Process', description: 'Process for individuals to correct their personal data', riskLevel: 'medium' },
  // Accuracy Obligation
  { category: 'Accuracy', controlRef: 'ACR-01', controlTitle: 'Data Accuracy', description: 'Ensure personal data is accurate and complete', riskLevel: 'medium' },
  // Protection Obligation
  { category: 'Protection', controlRef: 'PRO-01', controlTitle: 'Technical Safeguards', description: 'Implement encryption, access controls, and secure storage', riskLevel: 'high' },
  { category: 'Protection', controlRef: 'PRO-02', controlTitle: 'Administrative Safeguards', description: 'Policies for data handling, access management, and audit trails', riskLevel: 'high' },
  { category: 'Protection', controlRef: 'PRO-03', controlTitle: 'Physical Safeguards', description: 'Secure physical access to systems containing personal data', riskLevel: 'medium' },
  // Retention Limitation
  { category: 'Retention', controlRef: 'RET-01', controlTitle: 'Retention Policy', description: 'Define retention periods for each type of personal data', riskLevel: 'medium' },
  { category: 'Retention', controlRef: 'RET-02', controlTitle: 'Data Disposal', description: 'Secure disposal of personal data that is no longer needed', riskLevel: 'medium' },
  // Transfer Limitation
  { category: 'Transfer', controlRef: 'TRF-01', controlTitle: 'Overseas Transfer', description: 'Ensure adequate protection for overseas data transfers', riskLevel: 'high' },
  // Do Not Call
  { category: 'Do Not Call', controlRef: 'DNC-01', controlTitle: 'DNC Registry Check', description: 'Check DNC registry before sending marketing messages', riskLevel: 'medium' },
];

export async function GET() {
  try {
    let assessments = await prisma.pDPAAssessment.findMany({
      orderBy: [{ category: 'asc' }, { controlRef: 'asc' }],
    });

    // Seed defaults if empty
    if (assessments.length === 0) {
      await prisma.pDPAAssessment.createMany({ data: PDPA_CONTROLS });
      assessments = await prisma.pDPAAssessment.findMany({
        orderBy: [{ category: 'asc' }, { controlRef: 'asc' }],
      });
    }

    return NextResponse.json(assessments);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch compliance data' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    if (!data.id) {
      return NextResponse.json({ error: 'Missing assessment ID' }, { status: 400 });
    }
    const { id, ...updateData } = data;
    const updated = await prisma.pDPAAssessment.update({
      where: { id },
      data: {
        status: updateData.status,
        evidence: updateData.evidence,
        responsiblePerson: updateData.responsiblePerson,
        reviewDate: updateData.reviewDate ? new Date(updateData.reviewDate) : null,
        nextReviewDate: updateData.nextReviewDate ? new Date(updateData.nextReviewDate) : null,
        notes: updateData.notes,
        riskLevel: updateData.riskLevel,
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: 'Failed to update assessment' }, { status: 500 });
  }
}
