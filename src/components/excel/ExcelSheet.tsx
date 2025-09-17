'use client';

import React, { useState, useCallback } from 'react';
import { useRealtimeExcel } from '@/hooks/useRealtimeExcel';

interface RealtimeExcelProps {
  sheetId: string;
  userId: string;
  userName: string;
  companyId: string;
}

const RealtimeExcel: React.FC<RealtimeExcelProps> = ({
  sheetId,
  userId,
  userName,
  companyId,
}) => {
  const {
    worksheetData,
    collaborationState,
    isLoading,
    updateCell,
    exportToExcel,
  } = useRealtimeExcel({ sheetId, userId, userName, companyId });

  const [selectedCell, setSelectedCell] = useState<string | null>(null);

  const handleCellChange = useCallback(
    (rowIndex: number, colIndex: number, value: any) => {
      const address = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;
      updateCell(address, value);
    },
    [updateCell]
  );

  const handleExport = useCallback(async () => {
    try {
      const blob = await exportToExcel();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'sheet.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [exportToExcel]);

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="w-full h-full">
      {/* Collaboration Bar */}
      <div className="bg-gray-100 p-2 border-b flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium">Active Users:</span>
          {collaborationState.activeUsers.map((user) => (
            <div
              key={user.userId}
              className="flex items-center space-x-1 px-2 py-1 rounded text-sm"
              style={{ backgroundColor: user.color + '20', color: user.color }}
            >
              <div
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: user.color }}
              />
              <span>{user.userName}</span>
            </div>
          ))}
        </div>
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Export Excel
        </button>
      </div>

      {/* Excel Grid */}
      <div className="overflow-auto">
        <table className="border-collapse border border-gray-300">
          <thead>
            <tr>
              <th className="w-12 h-8 border border-gray-300 bg-gray-200"></th>
              {Array.from({ length: 26 }, (_, i) => (
                <th
                  key={i}
                  className="min-w-24 h-8 border border-gray-300 bg-gray-200 text-sm"
                >
                  {String.fromCharCode(65 + i)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from(
              { length: Math.max(50, worksheetData.length) },
              (_, rowIndex) => (
                <tr key={rowIndex}>
                  <td className="w-12 h-8 border border-gray-300 bg-gray-200 text-center text-sm">
                    {rowIndex + 1}
                  </td>
                  {Array.from({ length: 26 }, (_, colIndex) => {
                    const cellValue = worksheetData[rowIndex]?.[colIndex] || '';
                    const address = `${String.fromCharCode(65 + colIndex)}${rowIndex + 1}`;

                    return (
                      <td
                        key={colIndex}
                        className={`border border-gray-300 p-0 ${
                          selectedCell === address ? 'bg-blue-100' : ''
                        }`}
                      >
                        <input
                          type="text"
                          value={cellValue}
                          onChange={(e) =>
                            handleCellChange(rowIndex, colIndex, e.target.value)
                          }
                          onFocus={() => setSelectedCell(address)}
                          onBlur={() => setSelectedCell(null)}
                          className="w-full h-8 px-2 border-none outline-none bg-transparent"
                        />
                      </td>
                    );
                  })}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RealtimeExcel;
