import { OpenAI } from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const isGemini = !!process.env.GEMINI_API_KEY || (process.env.OPENAI_API_KEY?.startsWith('AIzaSy') ?? false);

const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY || '',
  baseURL: isGemini ? 'https://generativelanguage.googleapis.com/v1beta/openai/' : undefined,
});

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, context, image } = await req.json();

    const systemPrompt = `You are a highly experienced field service engineer with 20+ years of expertise. Your job is to guide junior engineers in diagnosing and fixing complex device issues. 
    
Device Context:
- Device Type: ${context.deviceType || 'Unknown'}
- Error Code: ${context.errorCode || 'None'}
- Symptoms: ${context.symptoms || 'Not described'}

Provide structured, clear, step-by-step solutions. 
AI responses must be structured as:
1. Problem Understanding
2. Possible Causes
3. Step-by-Step Resolution
4. When to Escalate

Avoid vague answers. Prioritize actionable guidance. If unsure, suggest escalation.
Reference any uploaded images in your response if provided. Analyze the image for error codes, physical damage, or device state.`;

    const formattedMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: any) => {
        if (m.role === 'user' && image) {
          return {
            role: 'user',
            content: [
              { type: 'text', text: m.content },
              { type: 'image_url', image_url: { url: image } }
            ]
          };
        }
        return m;
      })
    ];

    const response = await openai.chat.completions.create({
      model: isGemini ? 'gemini-1.5-flash' : 'gpt-4o',
      messages: formattedMessages,
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            controller.enqueue(new TextEncoder().encode(content));
          }
        }
        controller.close();
      },
    });

    return new Response(stream);
  } catch (error: any) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
