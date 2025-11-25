"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { signedFetch } from "@/lib/client-hmac";

interface ParsedRow {
  [key: string]: string | number | null;
}

interface UploadStats {
  total: number;
  valid: number;
  inserted: number;
  skipped: number;
}

export default function XlsxReaderPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [rowCount, setRowCount] = useState<number | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [data, setData] = useState<ParsedRow[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{
    success: boolean;
    message: string;
    stats?: UploadStats;
    error?: string;
  } | null>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      alert("Please upload an Excel file (.xlsx or .xls)");
      return;
    }

    setIsProcessing(true);
    setFileName(file.name);
    setRowCount(null);
    setHeaders([]);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });

      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error("No sheets found in the Excel file");
      }

      const worksheet = workbook.Sheets[firstSheetName];
      if (!worksheet) {
        throw new Error(`Worksheet "${firstSheetName}" not found`);
      }

      // Convert sheet to JSON with header row
      const jsonData = XLSX.utils.sheet_to_json<ParsedRow>(worksheet, {
        raw: false,
        defval: null,
      });

      if (jsonData.length === 0) {
        console.warn("No data found in the Excel file");
        alert("No data found in the Excel file");
        setIsProcessing(false);
        return;
      }

      // Extract headers from the first row
      const firstRow = jsonData[0];
      if (!firstRow) {
        throw new Error("First row is undefined");
      }
      const extractedHeaders = Object.keys(firstRow);
      setHeaders(extractedHeaders);
      setRowCount(jsonData.length);

      // Console log the JSON data
      console.log("=== XLSX File Data ===");
      console.log(`File: ${file.name}`);
      console.log(`Sheet: ${firstSheetName}`);
      console.log(`Total Rows: ${jsonData.length}`);
      console.log(`Headers:`, extractedHeaders);
      console.log("=== Data (JSON) ===");
      console.log(JSON.stringify(jsonData, null, 2));
      console.log("=== End of Data ===");

      // Also log each row individually for easier inspection
      jsonData.forEach((row, index) => {
        console.log(`Row ${index + 1}:`, row);
      });
      setData(jsonData);
      setUploadStatus(null);
      console.log("pollingStations", JSON.stringify(jsonData, null, 2));
    } catch (error) {
      console.error("Error reading XLSX file:", error);
      alert(
        `Error reading file: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUploadToMongoDB = async () => {
    if (data.length === 0) {
      alert("No data to upload");
      return;
    }

    setIsUploading(true);
    setUploadStatus(null);

    try {
      const response = await signedFetch("/api/xlsx-upload", {
        method: "POST",
        body: JSON.stringify({
          data,
          collectionName: "AC177",
        }),
      });

      const result = await response.json();

      if (result.success) {
        setUploadStatus({
          success: true,
          message: result.message || "Data uploaded successfully",
          stats: result.stats,
        });
      } else {
        setUploadStatus({
          success: false,
          message: "Upload failed",
          error: result.error || "Unknown error",
          stats: result.stats,
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setUploadStatus({
        success: false,
        message: "Upload failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-8xl">
        <div className="bg-white rounded-lg shadow-md p-6 lg:p-8">
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
            XLSX File Reader
          </h1>
          <p className="text-gray-600 mb-6">
            Upload an Excel file (.xlsx or .xls) to read its content and view it
            as JSON in the console.
          </p>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="xlsx-file-input"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Excel File
              </label>
              <input
                id="xlsx-file-input"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileUpload}
                disabled={isProcessing}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            {isProcessing && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                <span>Processing file...</span>
              </div>
            )}

            {fileName && !isProcessing && (
              <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm text-green-800">
                  <span className="font-semibold">File processed:</span>{" "}
                  {fileName}
                </p>
                {rowCount !== null && (
                  <p className="text-sm text-green-800 mt-1">
                    <span className="font-semibold">Rows found:</span>{" "}
                    {rowCount}
                  </p>
                )}
                {headers.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm font-semibold text-green-800 mb-1">
                      Headers:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {headers.map((header, index) => (
                        <span
                          key={index}
                          className="inline-block px-2 py-1 bg-green-100 text-green-800 text-xs rounded"
                        >
                          {header}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h2 className="text-sm font-semibold text-blue-900 mb-2">
                Instructions:
              </h2>
              <ol className="text-sm text-blue-800 list-decimal list-inside space-y-1">
                <li>
                  Click "Choose File" and select an Excel file (.xlsx or .xls)
                </li>
                <li>The file will be processed automatically</li>
                <li>
                  Open your browser&apos;s Developer Console (F12 or
                  Cmd+Option+I)
                </li>
                <li>View the JSON data mapped to headers in the console</li>
              </ol>
            </div>
            {data.length > 0 && (
              <>
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-semibold text-yellow-900 mb-1">
                        Upload to MongoDB
                      </h2>
                      <p className="text-xs text-yellow-800">
                        Upload {data.length} records to AC177 collection
                      </p>
                    </div>
                    <button
                      onClick={handleUploadToMongoDB}
                      disabled={isUploading}
                      className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isUploading ? (
                        <span className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Uploading...
                        </span>
                      ) : (
                        "Upload to MongoDB"
                      )}
                    </button>
                  </div>
                </div>

                {uploadStatus && (
                  <div
                    className={`mt-4 p-4 rounded-md border ${
                      uploadStatus.success
                        ? "bg-green-50 border-green-200"
                        : "bg-red-50 border-red-200"
                    }`}
                  >
                    <p
                      className={`text-sm font-semibold mb-2 ${
                        uploadStatus.success ? "text-green-800" : "text-red-800"
                      }`}
                    >
                      {uploadStatus.success ? "✓ " : "✗ "}
                      {uploadStatus.message}
                    </p>
                    {uploadStatus.error && (
                      <p className="text-sm text-red-700 mb-2">
                        Error: {uploadStatus.error}
                      </p>
                    )}
                    {uploadStatus.stats && (
                      <div className="text-xs text-gray-700 space-y-1">
                        <p>
                          Total: {uploadStatus.stats.total} | Valid:{" "}
                          {uploadStatus.stats.valid} | Inserted:{" "}
                          {uploadStatus.stats.inserted} | Skipped:{" "}
                          {uploadStatus.stats.skipped}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {data.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md overflow-x-auto">
                <h2 className="text-sm font-semibold text-blue-900 mb-2">
                  Data Preview (First 1000 records):
                </h2>
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-blue-100">
                      <th>#</th>
                      {headers.map((header, index) => (
                        <th
                          key={index}
                          className="border border-blue-200 px-4 py-2 text-left text-sm font-semibold"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.slice(0, 1000).map((row, index) => (
                      <tr key={index} className="hover:bg-blue-50">
                        <td className="border border-blue-200 px-4 py-2 text-left text-sm">
                          {index + 1}
                        </td>
                        {headers.map((header, headerIndex) => (
                          <td
                            key={headerIndex}
                            className="border border-blue-200 px-4 py-2 text-left text-sm"
                          >
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
