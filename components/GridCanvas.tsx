'use client';

import { useEffect, useRef, useState, useCallback } from 'react';


interface GridCanvasProps {
  imageUrl: string | null;
  rows: number;
  columns: number;
  onGridLinesChange?: (
    lines: { position: number; isHorizontal: boolean }[],
    width: number,
    height: number
  ) => void;
}

export default function GridCanvas({ 
  imageUrl, 
  rows, 
  columns, 
  onGridLinesChange 
}: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [gridLines, setGridLines] = useState<{ position: number; isHorizontal: boolean }[]>([]);
  const [activeLine, setActiveLine] = useState<number | null>(null);
  const [hoveredLine, setHoveredLine] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Initialize or update grid lines when rows/columns change
  useEffect(() => {
    if (imageSize.width === 0 || imageSize.height === 0) return;

    const newGridLines: { position: number; isHorizontal: boolean }[] = [];
    
    // Create horizontal lines
    for (let i = 1; i < rows; i++) {
      newGridLines.push({
        position: (i / rows) * imageSize.height,
        isHorizontal: true
      });
    }
    
    // Create vertical lines
    for (let i = 1; i < columns; i++) {
      newGridLines.push({
        position: (i / columns) * imageSize.width,
        isHorizontal: false
      });
    }
    
    setGridLines(newGridLines);
    
    // Notify parent component of grid line changes
    if (onGridLinesChange) {
      onGridLinesChange(newGridLines, imageSize.width, imageSize.height);
    }
  }, [rows, columns, imageSize, onGridLinesChange]);

  // Load image only once when URL changes
  useEffect(() => {
    if (!imageUrl) return;

    // Clean up previous image
    if (imageRef.current) {
      imageRef.current.onload = null;
      imageRef.current.onerror = null;
    }

    setImageLoaded(false);
    
    const img = new Image();
    imageRef.current = img;
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    
    img.onload = () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      canvas.width = img.width;
      canvas.height = img.height;
      
      setImageSize({ width: img.width, height: img.height });
      setImageLoaded(true);
    };
    
    img.onerror = () => {
      console.error('Failed to load image');
    };
  }, [imageUrl]);

  // Redraw canvas when necessary
  useEffect(() => {
    if (imageLoaded) {
      drawCanvas();
    }
  }, [imageLoaded, gridLines, hoveredLine, activeLine]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the image
    if (imageRef.current && imageLoaded) {
      ctx.drawImage(imageRef.current, 0, 0);
    }

    // Draw grid lines
    gridLines.forEach((line, index) => {
      ctx.beginPath();
      
      // Set line style based on state (active, hovered, or normal)
      if (index === activeLine) {
        ctx.strokeStyle = 'rgba(0, 120, 255, 0.9)';
        ctx.lineWidth = 3;
      } else if (index === hoveredLine) {
        ctx.strokeStyle = 'rgba(255, 100, 0, 0.8)';
        ctx.lineWidth = 2.5;
      } else {
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.lineWidth = 2;
      }

      if (line.isHorizontal) {
        ctx.moveTo(0, line.position);
        ctx.lineTo(canvas.width, line.position);
      } else {
        ctx.moveTo(line.position, 0);
        ctx.lineTo(line.position, canvas.height);
      }
      
      ctx.stroke();
    });
  }, [gridLines, hoveredLine, activeLine, imageLoaded]);

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault(); // Prevent default behavior
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Find the closest line to the mouse position
    let closestLine = -1;
    let minDistance = 10; // Minimum distance to detect a line (in pixels)
    
    gridLines.forEach((line, index) => {
      let distance;
      if (line.isHorizontal) {
        distance = Math.abs(y - line.position);
      } else {
        distance = Math.abs(x - line.position);
      }
      
      if (distance < minDistance) {
        minDistance = distance;
        closestLine = index;
      }
    });
    
    if (closestLine !== -1) {
      setActiveLine(closestLine);
    }
  }, [gridLines]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvas.width / rect.width);
    const y = (e.clientY - rect.top) * (canvas.height / rect.height);
    
    // Update cursor style based on nearby lines
    let nearestLine = -1;
    let minDistance = 10;
    
    gridLines.forEach((line, index) => {
      let distance;
      if (line.isHorizontal) {
        distance = Math.abs(y - line.position);
      } else {
        distance = Math.abs(x - line.position);
      }
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestLine = index;
      }
    });
    
    // Update hovered line
    setHoveredLine(nearestLine);
    
    // Update cursor style
    if (nearestLine !== -1) {
      const isHorizontal = gridLines[nearestLine].isHorizontal;
      canvas.style.cursor = isHorizontal ? 'ns-resize' : 'ew-resize';
    } else {
      canvas.style.cursor = 'default';
    }
    
    // Handle dragging
    if (activeLine !== null) {
      e.preventDefault(); // Prevent default behavior
      const updatedLines = [...gridLines];
      const line = updatedLines[activeLine];
      
      if (line.isHorizontal) {
        // Constrain to image boundaries
        const newPosition = Math.max(0, Math.min(y, imageSize.height));
        updatedLines[activeLine] = { ...line, position: newPosition };
      } else {
        // Constrain to image boundaries
        const newPosition = Math.max(0, Math.min(x, imageSize.width));
        updatedLines[activeLine] = { ...line, position: newPosition };
      }
      
      setGridLines(updatedLines);
      
      // Notify parent component of grid line changes
      if (onGridLinesChange) {
        onGridLinesChange(updatedLines, imageSize.width, imageSize.height);
      }
    }
  }, [gridLines, activeLine, imageSize.width, imageSize.height, onGridLinesChange]);

  const handleMouseUp = useCallback(() => {
    setActiveLine(null);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredLine(null);
    setActiveLine(null);
  }, []);

  return (
    <div className="relative w-full border rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-900">
      {!imageLoaded && imageUrl && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="max-w-full h-auto"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
    </div>
  );
}