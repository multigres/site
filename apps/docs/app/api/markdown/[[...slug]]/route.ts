import { type NextRequest, NextResponse } from 'next/server';
import { source } from '@/lib/source';
import { notFound } from 'next/navigation';
import fs from 'fs/promises';
import path from 'path';

export const revalidate = false;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug?: string[] }> }
) {
  const { slug } = await params;
  const page = source.getPage(slug);
  if (!page) notFound();

  // Read the raw MDX file
  const filePath = path.join(process.cwd(), 'content/docs', page.path);

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/markdown',
      },
    });
  } catch {
    notFound();
  }
}

export function generateStaticParams() {
  return source.generateParams();
}
