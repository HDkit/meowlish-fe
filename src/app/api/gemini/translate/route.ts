import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { text } = await req.json();
    if (!text) return NextResponse.json({ error: 'Missing text' }, { status: 400 });

    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=vi&dt=t&q=${encodeURIComponent(text)}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Translation API error: ${response.status}`);

    const data = await response.json();
    const translation = data?.[0]?.map((part: any) => part?.[0]).filter(Boolean).join('') || '';

    return NextResponse.json({ translation });
  } catch (err: any) {
    console.error('Translation error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
