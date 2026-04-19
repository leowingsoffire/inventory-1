import { NextRequest, NextResponse } from 'next/server';

const AZURE_AI_ENDPOINT = process.env.AZURE_AI_ENDPOINT || 'https://models.inference.ai.azure.com';
const AZURE_AI_KEY = process.env.AZURE_AI_KEY || '';
const AZURE_AI_MODEL = process.env.AZURE_AI_MODEL || 'grok-4-1-fast-non-reasoning';

const SYSTEM_PROMPT = `You are an intelligent IT asset management assistant for Unitech IT System, a Singapore-based SME IT company. You help with:
- IT asset inventory analysis and recommendations
- Warranty tracking and renewal advice
- Maintenance scheduling and issue resolution
- Cost optimization for IT assets
- Department asset allocation insights
- Change request management
- Vendor and customer relationship management

Provide concise, actionable responses with specific data points where relevant. Use Singapore Dollar (SGD) for currency. Format responses with markdown for readability.`;

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
