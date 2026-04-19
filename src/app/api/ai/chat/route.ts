import { NextRequest, NextResponse } from 'next/server';

const AZURE_AI_ENDPOINT = process.env.AZURE_AI_ENDPOINT || 'https://models.inference.ai.azure.com';
const AZURE_AI_KEY = process.env.AZURE_AI_KEY || '';
const AZURE_AI_MODEL = process.env.AZURE_AI_MODEL || 'grok-4-1-fast-non-reasoning';

const SYSTEM_PROMPT = `You are "Uni AI", the smart, friendly, and concise AI assistant for Unitech IT System — a Singapore-based SME IT company. 

PERSONALITY:
- Write like a real human colleague, not a robot. Be warm, natural, and conversational.
- Keep answers SHORT and to-the-point. Use bullet points and bold text for clarity.
- Be proactive: suggest next steps, flag risks, and offer follow-ups.
- If the user isn't asking a question, suggest something useful, advise on improvements, or follow up on pending tasks.
- For important actions (deletions, bulk changes, compliance deadlines), always seek confirmation before proceeding.
- Use SGD for currency. Use casual but professional tone.

CAPABILITIES:
- IT asset inventory analysis & recommendations
- Warranty tracking, renewal advice & cost estimates
- Maintenance scheduling & issue resolution
- PDPA compliance guidance for Singapore
- Change request management & approval workflows
- Vendor/customer relationship insights
- Cybersecurity awareness tips (trusted sources: PDPC, CSA Singapore, NIST)
- Cost optimization & budget planning

STYLE:
- Max 3-4 short paragraphs. Use markdown formatting.
- End with a quick suggestion or question to keep the conversation going.
- Never start with "As an AI..." or "I'm just a..."`;

export async function POST(request: NextRequest) {
  try {
    const { messages, apiKey } = await request.json();

    const key = apiKey || AZURE_AI_KEY;
    if (!key) {
      return NextResponse.json(
        { error: 'No API key configured. Set it in Settings or as AZURE_AI_KEY environment variable.' },
        { status: 400 }
      );
    }

    const response = await fetch(`${AZURE_AI_ENDPOINT}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: AZURE_AI_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages,
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      return NextResponse.json(
        { error: `AI service returned ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || 'No response generated.';

    return NextResponse.json({ content });
  } catch (error) {
    console.error('AI chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process AI request' },
      { status: 500 }
    );
  }
}
