import { NextResponse } from 'next/server';
import { generateReply } from '@/services/ai-service';

export async function POST(request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error: AI API key not set' },
        { status: 500 }
      );
    }

    const body = await request.json();

    if (!body.reviewText || !body.summary) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: reviewText, summary' },
        { status: 400 }
      );
    }

    if (typeof body.reviewText !== 'string' || typeof body.summary !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Invalid field types' },
        { status: 400 }
      );
    }

    const reply = await generateReply(body.reviewText, body.summary, apiKey);

    if (!reply) {
      return NextResponse.json(
        { success: false, error: 'Failed to generate reply. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, reply });
  } catch (error) {
    console.error('Reply generation error:', error);
    return NextResponse.json(
      { success: false, error: 'An error occurred while generating the reply.' },
      { status: 500 }
    );
  }
}
