import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const rows = parseInt(formData.get('rows') as string);
    const columns = parseInt(formData.get('columns') as string);

    if (!imageFile || !rows || !columns) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Convert file to buffer
    const buffer = Buffer.from(await imageFile.arrayBuffer());
    
    // Load image with sharp
    const image = sharp(buffer);
    const metadata = await image.metadata();
    
    if (!metadata.width || !metadata.height) {
      return NextResponse.json(
        { error: 'Could not get image dimensions' },
        { status: 400 }
      );
    }

    // Calculate dimensions for each grid cell
    const cellWidth = Math.floor(metadata.width / columns);
    const cellHeight = Math.floor(metadata.height / rows);
    
    // Create a zip file
    const zip = new JSZip();
    
    // Cut image into grid cells
    const promises = [];
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        const left = col * cellWidth;
        const top = row * cellHeight;
        
        const extractPromise = image
          .clone()
          .extract({
            left,
            top,
            width: cellWidth,
            height: cellHeight
          })
          .toBuffer()
          .then(cellBuffer => {
            // Add the cell image to the zip file
            const filename = `image_${row * columns + col + 1}.png`;
            zip.file(filename, cellBuffer);
          });
        
        promises.push(extractPromise);
      }
    }
    
    // Wait for all extractions to complete
    await Promise.all(promises);
    
    // Generate the zip file
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    
    // Return the zip file
    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="grid-images.zip"`
      }
    });
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    );
  }
}