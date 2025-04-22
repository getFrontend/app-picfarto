"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface GridControlsProps {
  onGridChange: (rows: number, columns: number) => void;
  onCutClick: () => void;
  onResetGrid?: () => void; // New prop for resetting grid lines
  disabled: boolean;
  initialRows?: number;
  initialColumns?: number;
}

export default function GridControls({
  onGridChange,
  onCutClick,
  onResetGrid,
  disabled,
  initialRows = 3,
  initialColumns = 3,
}: GridControlsProps) {
  // Use initialRows and initialColumns from props
  const [rows, setRows] = useState(initialRows);
  const [columns, setColumns] = useState(initialColumns);

  // Update local state when props change
  useEffect(() => {
    setRows(initialRows);
  }, [initialRows]);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Handle row changes with debouncing to prevent jumps
  const handleRowChange = useCallback(
    (value: number[]) => {
      if (value[0] !== rows) {
        setRows(value[0]);
      }
    },
    [rows]
  );

  // Handle column changes with debouncing to prevent jumps
  const handleColumnChange = useCallback(
    (value: number[]) => {
      if (value[0] !== columns) {
        setColumns(value[0]);
      }
    },
    [columns]
  );

  // Only call onGridChange when rows or columns actually change
  useEffect(() => {
    onGridChange(rows, columns);
  }, [rows, columns, onGridChange]);

  // Handle reset button click
  const handleResetClick = () => {
    if (onResetGrid) {
      onResetGrid();
    }
  };

  return (
    <motion.div
      className="flex flex-col gap-4 w-full max-w-md p-4 border rounded-lg bg-white dark:bg-gray-800 shadow-sm"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, type: "spring" }}
    >
      <div className="flex justify-between items-center mb-2">
        <motion.h2
          className="text-lg font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          Grid Settings
        </motion.h2>

        {onResetGrid && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetClick}
            disabled={disabled}
            className="text-xs"
          >
            Reset Grid
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <Label htmlFor="rows" className="mb-4 block">
            Rows: {rows}
          </Label>
          <Slider
            id="rows"
            min={2}
            max={10}
            step={1}
            value={[rows]}
            onValueChange={handleRowChange}
            disabled={disabled}
            className="w-full"
          />
        </div>

        <div>
          <Label htmlFor="columns" className="mb-4 block">
            Columns: {columns}
          </Label>
          <Slider
            id="columns"
            min={2}
            max={10}
            step={1}
            value={[columns]}
            onValueChange={handleColumnChange}
            disabled={disabled}
            className="w-full"
          />
        </div>
      </div>

      <motion.div
        className="mt-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-sm text-center text-gray-500 dark:text-gray-400 mb-3">
          App will create {rows * columns} image
          {rows * columns !== 1 ? "s" : ""}
        </p>
        <p className="text-xs text-blue-500 dark:text-blue-400 mb-3">
          💡Tip: Hover over grid lines to adjust them precisely with your mouse
        </p>
        <Button onClick={onCutClick} disabled={disabled} className="w-full">
          Cut Image into Grid
        </Button>
      </motion.div>
    </motion.div>
  );
}
