import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/markdown', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Unsupported file type. Allowed: Images, PDF, Markdown, Plain Text.' }, { status: 400 });
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File size exceeds 5MB limit.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save locally under public/uploads
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    
    // Create dir if not exists
    await fs.mkdir(uploadDir, { recursive: true });

    // Generate unique name
    const uniqueName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}${path.extname(file.name)}`;
    const filePath = path.join(uploadDir, uniqueName);
    
    await fs.writeFile(filePath, buffer);

    const url = `/uploads/${uniqueName}`;

    return NextResponse.json({
      success: true,
      url,
      name: file.name,
      size: file.size
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
