import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const template = [
    'ean',
    '7791234567890',
    '8806095130521',
    '7501031311309',
  ].join('\n');

  return new NextResponse(template, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="template-eans.csv"',
    },
  });
}
