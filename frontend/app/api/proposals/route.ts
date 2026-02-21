import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Try to read from processed-files-pm.json first (new PredictionMarketDAO proposals)
    const pmFilePath = path.join(process.cwd(), '..', 'processed-files-pm.json');
    const oldFilePath = path.join(process.cwd(), '..', 'processed-files.json');
    
    let proposals = [];
    
    // Load from PredictionMarketDAO file
    if (fs.existsSync(pmFilePath)) {
      const pmContent = fs.readFileSync(pmFilePath, 'utf-8');
      const pmData = JSON.parse(pmContent);
      proposals = [...proposals, ...pmData];
    }
    
    // Also load from old file for backwards compatibility
    if (fs.existsSync(oldFilePath)) {
      const oldContent = fs.readFileSync(oldFilePath, 'utf-8');
      const oldData = JSON.parse(oldContent);
      proposals = [...proposals, ...oldData];
    }
    
    return NextResponse.json({ proposals });
  } catch (error) {
    console.error('Error reading proposals:', error);
    return NextResponse.json({ proposals: [] });
  }
}
