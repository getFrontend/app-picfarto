import JSZip from 'jszip';
import { saveAs } from 'file-saver';

/**
 * Cuts an image into a grid of smaller images based on grid line positions
 * @param imageUrl - URL of the image to cut
 * @param gridLines - Array of grid line positions
 * @param imageWidth - Width of the original image
 * @param imageHeight - Height of the original image
 * @returns Promise with an array of image data URLs
 */
export async function cutImageWithGridLines(
  imageUrl: string, 
  gridLines: { position: number; isHorizontal: boolean }[],
  imageWidth: number,
  imageHeight: number
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS issues
    img.src = imageUrl;
    
    img.onload = () => {
      // Sort grid lines by position and type
      const horizontalLines = gridLines
        .filter(line => line.isHorizontal)
        .map(line => line.position)
        .sort((a, b) => a - b);
      
      const verticalLines = gridLines
        .filter(line => !line.isHorizontal)
        .map(line => line.position)
        .sort((a, b) => a - b);
      
      // Add boundaries
      const allHorizontalPositions = [0, ...horizontalLines, imageHeight];
      const allVerticalPositions = [0, ...verticalLines, imageWidth];
      
      const gridImages: string[] = [];
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Cut the image into grid cells
      for (let i = 0; i < allHorizontalPositions.length - 1; i++) {
        for (let j = 0; j < allVerticalPositions.length - 1; j++) {
          const startX = allVerticalPositions[j];
          const startY = allHorizontalPositions[i];
          const cellWidth = allVerticalPositions[j + 1] - startX;
          const cellHeight = allHorizontalPositions[i + 1] - startY;
          
          // Set canvas size to cell dimensions
          canvas.width = cellWidth;
          canvas.height = cellHeight;
          
          // Clear canvas
          ctx.clearRect(0, 0, cellWidth, cellHeight);
          
          // Draw the portion of the image for this cell
          ctx.drawImage(
            img,
            startX, // Source x
            startY, // Source y
            cellWidth, // Source width
            cellHeight, // Source height
            0, // Destination x
            0, // Destination y
            cellWidth, // Destination width
            cellHeight // Destination height
          );
          
          // Convert to data URL and add to array
          const dataUrl = canvas.toDataURL('image/png');
          gridImages.push(dataUrl);
        }
      }
      
      resolve(gridImages);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
  });
}

// Keep the original function for backward compatibility
export async function cutImageIntoGrid(imageUrl: string, rows: number, columns: number): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous'; // Handle CORS issues
    img.src = imageUrl;
    
    img.onload = () => {
      const gridImages: string[] = [];
      
      // Calculate the width and height of each grid cell
      const cellWidth = img.width / columns;
      const cellHeight = img.height / rows;
      
      // Create a canvas for cutting the image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }
      
      // Set the canvas size to the cell size
      canvas.width = cellWidth;
      canvas.height = cellHeight;
      
      // Cut the image into grid cells
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < columns; col++) {
          // Clear the canvas for the new cell
          ctx.clearRect(0, 0, cellWidth, cellHeight);
          
          // Draw the portion of the image for this cell
          ctx.drawImage(
            img,
            col * cellWidth, // Source x
            row * cellHeight, // Source y
            cellWidth, // Source width
            cellHeight, // Source height
            0, // Destination x
            0, // Destination y
            cellWidth, // Destination width
            cellHeight // Destination height
          );
          
          // Convert the canvas to a data URL and add to the array
          const dataUrl = canvas.toDataURL('image/png');
          gridImages.push(dataUrl);
        }
      }
      
      resolve(gridImages);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
  });
}

/**
 * Creates a zip file containing all the grid images
 * @param gridImages - Array of image data URLs
 * @param fileName - Name for the zip file (without extension)
 */
export async function createAndDownloadZip(gridImages: string[], fileName: string = 'grid-images'): Promise<void> {
  const zip = new JSZip();
  
  // Add each image to the zip file
  gridImages.forEach((dataUrl, index) => {
    // Convert data URL to blob
    const data = dataUrl.split(',')[1];
    const blob = b64toBlob(data, 'image/png');
    
    // Add to zip with a numbered filename
    zip.file(`image_${index + 1}.png`, blob);
  });
  
  // Generate the zip file and trigger download
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  saveAs(zipBlob, `${fileName}.zip`);
}

// Helper function to convert base64 to Blob
function b64toBlob(b64Data: string, contentType: string = '', sliceSize: number = 512): Blob {
  const byteCharacters = atob(b64Data);
  const byteArrays = [];

  for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
    const slice = byteCharacters.slice(offset, offset + sliceSize);
    const byteNumbers = new Array(slice.length);
    
    for (let i = 0; i < slice.length; i++) {
      byteNumbers[i] = slice.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    byteArrays.push(byteArray);
  }

  return new Blob(byteArrays, { type: contentType });
}