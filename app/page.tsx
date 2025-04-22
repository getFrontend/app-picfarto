"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ImageUploader from "@/components/ImageUploader";
import GridControls from "@/components/GridControls";
import GridCanvas from "@/components/GridCanvas";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import {
  cutImageIntoGrid,
  cutImageWithGridLines,
  createAndDownloadZip,
} from "@/utils/imageProcessing";
import Image from "next/image";

export default function Home() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [rows, setRows] = useState(3);
  const [columns, setColumns] = useState(3);
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadReady, setDownloadReady] = useState(false);
  const [gridImages, setGridImages] = useState<string[]>([]);
  const [gridLines, setGridLines] = useState<
    { position: number; isHorizontal: boolean }[]
  >([]);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });

  const handleImageUpload = useCallback((file: File, url: string) => {
    setImageFile(file);
    setImageUrl(url);
    setDownloadReady(false);
    setGridImages([]);
  }, []);

  const handleGridChange = useCallback(
    (newRows: number, newColumns: number) => {
      setRows(newRows);
      setColumns(newColumns);
    },
    []
  );

  const handleGridLinesChange = useCallback(
    (
      lines: { position: number; isHorizontal: boolean }[],
      width: number,
      height: number
    ) => {
      setGridLines(lines);
      setImageSize({ width, height });
    },
    []
  );

  const handleClientSideCut = useCallback(async () => {
    if (!imageUrl) return;

    setIsProcessing(true);
    try {
      // Use the custom grid lines if available, otherwise fall back to the original method
      let images;
      if (gridLines.length > 0 && imageSize.width > 0 && imageSize.height > 0) {
        images = await cutImageWithGridLines(
          imageUrl,
          gridLines,
          imageSize.width,
          imageSize.height
        );
      } else {
        images = await cutImageIntoGrid(imageUrl, rows, columns);
      }

      setGridImages(images);
      setDownloadReady(true);
    } catch (error) {
      console.error("Error cutting image:", error);
      alert("Failed to cut image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  }, [imageUrl, gridLines, imageSize.width, imageSize.height, rows, columns]);

  const handleServerSideCut = useCallback(async () => {
    if (!imageFile) return;

    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("rows", rows.toString());
      formData.append("columns", columns.toString());

      const response = await fetch("/api/cut-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Server processing failed");
      }

      // Download the zip file directly
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "grid-images.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error processing image on server:", error);
      alert(
        "Failed to process image on server. Falling back to client-side processing..."
      );
      // Fall back to client-side processing
      await handleClientSideCut();
    } finally {
      setIsProcessing(false);
    }
  }, [imageFile, rows, columns, handleClientSideCut]);

  const handleDownload = useCallback(async () => {
    if (gridImages.length === 0) return;

    try {
      await createAndDownloadZip(gridImages);
    } catch (error) {
      console.error("Error creating zip file:", error);
      alert("Failed to create zip file. Please try again.");
    }
  }, [gridImages]);

  const resetImage = useCallback(() => {
    setImageFile(null);
    setImageUrl(null);
    setDownloadReady(false);
    setGridImages([]);
  }, []);

  // Add this function after the handleGridLinesChange function
  // Update the handleResetGrid function to properly reset the grid
  const handleResetGrid = useCallback(() => {
    // Recreate grid lines based on current rows and columns
    if (imageSize.width === 0 || imageSize.height === 0 || !imageUrl) {
      console.log("Cannot reset grid: missing image dimensions or URL");
      return;
    }

    const newGridLines: { position: number; isHorizontal: boolean }[] = [];

    // Create horizontal lines
    for (let i = 1; i < rows; i++) {
      newGridLines.push({
        position: (i / rows) * imageSize.height,
        isHorizontal: true,
      });
    }

    // Create vertical lines
    for (let i = 1; i < columns; i++) {
      newGridLines.push({
        position: (i / columns) * imageSize.width,
        isHorizontal: false,
      });
    }

    // Update grid lines state
    setGridLines(newGridLines);

    // Notify that grid lines have been reset
    console.log("Grid reset to default positions");
  }, [rows, columns, imageSize, imageUrl]);

  return (
    <motion.div
      className="min-h-screen p-8 max-w-6xl mx-auto"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.header
        className="mb-8 text-center relative"
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.1, type: "spring" }}
      >
        <div className="absolute right-0 top-0">
          <ThemeToggle />
        </div>
        <h1 className="flex gap-2 items-center justify-center mb-2">
          <Image src="/images/logo-picfarto.png" alt="Logo Picfarto" width={42} height={42} />
          <span className="text-3xl font-bold mb-2">Image Grid Cutter</span>
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Upload an image, set your grid dimensions, and download the cut pieces
        </p>
      </motion.header>

      <main className="flex flex-col gap-8">
        <AnimatePresence mode="wait">
          {!imageUrl ? (
            <motion.div
              key="uploader"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ImageUploader onImageUpload={handleImageUpload} />
            </motion.div>
          ) : (
            <motion.div
              key="editor"
              className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex flex-col gap-4">
                <GridCanvas
                  imageUrl={imageUrl}
                  rows={rows}
                  columns={columns}
                  onGridLinesChange={handleGridLinesChange}
                />

                <div className="flex flex-wrap gap-4 justify-center">
                  <Button variant="outline" onClick={resetImage}>
                    Upload Different Image
                  </Button>

                  {downloadReady && (
                    <Button variant="default" onClick={handleDownload}>
                      Download Zip
                    </Button>
                  )}
                </div>
              </div>

              <div>
                <GridControls
                  onGridChange={handleGridChange}
                  onCutClick={handleClientSideCut}
                  onResetGrid={handleResetGrid}
                  disabled={isProcessing || !imageUrl}
                  initialRows={rows}
                  initialColumns={columns}
                />

                {/* Add server-side processing option */}
                {imageUrl && (
                  <div className="mt-4">
                    <Button
                      variant="secondary"
                      onClick={handleServerSideCut}
                      disabled={isProcessing || !imageUrl}
                      className="w-full"
                    >
                      Process on Server (Faster for large images)
                    </Button>
                  </div>
                )}

                <AnimatePresence>
                  {isProcessing && (
                    <motion.div
                      className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md text-center"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.div
                        className="inline-block w-6 h-6 border-2 border-current border-t-transparent text-blue-600 dark:text-blue-400 rounded-full mb-2"
                        animate={{ rotate: 360 }}
                        transition={{
                          repeat: Infinity,
                          duration: 1,
                          ease: "linear",
                        }}
                      />
                      <p>Processing image...</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <motion.footer
        className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <p>© {new Date().getFullYear()} Image Grid Cutter App</p>
      </motion.footer>
    </motion.div>
  );
}
