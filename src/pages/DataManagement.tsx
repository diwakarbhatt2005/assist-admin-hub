import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Edit3, Save, Upload, ArrowLeft, Loader2, CheckCircle, X, Plus, Calendar } from "lucide-react";
import { Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChatBot } from "@/components/ChatBot";
import {insertApi} from "@/api-integrations/insertApi";
import {updateTableDataApi} from "@/api-integrations/updateTableDataApi";
import { downloadFullMonthReport } from "@/api-integrations/fullMonthReport";
import { downloadShortMonthReport } from "@/api-integrations/shortMonthReport";

// Call commissions API after insert/update and show toast if it fails
async function callCommissionsApi(tableName: string, operation: string, affectedRows: any[], toastFn?: any) {
  if (!affectedRows || affectedRows.length === 0) return;
  try {
    const res = await fetch('https://mentify.srv880406.hstgr.cloud/api/calculate-commissions', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table_name: tableName,
        operation,
        affected_rows: affectedRows,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      if (toastFn) toastFn({
        title: 'Commissions Error',
        description: data?.detail || 'Failed to calculate commissions',
        variant: 'destructive',
      });
    }
  } catch (err) {
    if (toastFn) toastFn({
      title: 'Commissions Error',
      description: err instanceof Error ? err.message : 'Failed to calculate commissions',
      variant: 'destructive',
    });
  }
}

const DataManagement = () => {
  const [showDownloadOptions, setShowDownloadOptions] = useState(false);

  // Download helpers
  const downloadCSV = (filename: string, rows: any[], cols: string[]) => {
    if (!rows || rows.length === 0) {
      toast({ title: "No Data", description: "There is no data to download.", variant: "destructive" });
      return;
    }
    const csvRows = [];
    csvRows.push(cols.join(","));
    rows.forEach(row => {
      const vals = cols.map(col => {
        const val = row[col] ?? "";
        if (typeof val === "string" && (val.includes(",") || val.includes('"') || val.includes('\n'))) {
          return '"' + val.replace(/"/g, '""') + '"';
        }
        return val;
      });
      csvRows.push(vals.join(","));
    });
    const csvContent = csvRows.join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Report Downloaded", description: `CSV report has been downloaded.` });
  };

  const handleDownloadMonthReport = async () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: "Select Month & Year",
        description: "Please select both month and year to download the report.",
        variant: "destructive",
      });
      return;
    }
    // Format: YYYY-MM
    const monthNum = ("0" + (new Date(Date.parse(selectedMonth + " 1, 2000")).getMonth() + 1)).slice(-2);
    const reportMonth = `${selectedYear}-${monthNum}`;
    try {
      await downloadFullMonthReport(reportMonth, true);
      toast({ title: "Report Downloaded", description: `PDF report for ${selectedMonth} ${selectedYear} downloaded.` });
    } catch (err) {
      toast({ title: "Download Failed", description: err instanceof Error ? err.message : "Failed to download report", variant: "destructive" });
    }
    setShowDownloadOptions(false);
  };
  const handleDownloadShortReport = async () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: "Select Month & Year",
        description: "Please select both month and year to download the short report.",
        variant: "destructive",
      });
      return;
    }
    // Format: YYYY-MM
    const monthNum = ("0" + (new Date(Date.parse(selectedMonth + " 1, 2000")).getMonth() + 1)).slice(-2);
    const reportMonth = `${selectedYear}-${monthNum}`;
    try {
      await downloadShortMonthReport(reportMonth);
      toast({ title: "Short Report Downloaded", description: `PDF short report for ${selectedMonth} ${selectedYear} downloaded.` });
    } catch (err) {
      toast({ title: "Download Failed", description: err instanceof Error ? err.message : "Failed to download short report", variant: "destructive" });
    }
    setShowDownloadOptions(false);
  };
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false); // true when Update is clicked
  // Row-level edit state: index of row being edited, or null
  const [editRowIndex, setEditRowIndex] = useState<number | null>(null);
  const [isSaving, setSaving] = useState(false);
  const [showInsertOptions, setShowInsertOptions] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [tableName, setTableName] = useState<string>("");
  const [columns, setColumns] = useState<string[]>([]);
  const [primaryKey, setPrimaryKey] = useState<string>("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");

  // Keep a ref of the original data to detect new rows
  const originalDataRef = useRef<any[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!location.state?.data) {
      navigate("/");
      return;
    }

    const { data: receivedData, databaseName: tblName } = location.state;
  setData(receivedData);
  originalDataRef.current = receivedData;
    setTableName(tblName);
    if (receivedData.length > 0) {
      const cols = Object.keys(receivedData[0]);
      setColumns(cols);
      setPrimaryKey(cols[0]); // First column is primary key
    }
  }, [location.state, navigate]);

  const handleEdit = () => {
    setIsEditMode(true);
    setIsUpdateMode(false);
    setShowInsertOptions(false);
    toast({
      title: "Edit Mode Activated",
      description: "You can now manage data. Use Insert or Update.",
    });
  };

  const handleUpdateMode = () => {
    setIsUpdateMode(true);
    toast({
      title: "Update Mode Enabled",
      description: "Primary key is locked. You can edit other fields.",
    });
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      // Find new rows (not present in originalDataRef)
      const orig = originalDataRef.current;
      const origPKs = new Set(orig.map(row => row[primaryKey]));
      let newRows = data.filter(row => !origPKs.has(row[primaryKey]));
      // Clean new rows: remove PK if blank/null/undefined so backend can auto-generate
      newRows = newRows.map(row => {
        const cleanRow = { ...row };
        if (
          cleanRow[primaryKey] === undefined ||
          cleanRow[primaryKey] === null ||
          cleanRow[primaryKey] === ''
        ) {
          delete cleanRow[primaryKey];
        }
        // Convert null values to empty string, remove undefined
        Object.keys(cleanRow).forEach(key => {
          if (cleanRow[key] === null) {
            cleanRow[key] = '';
          } else if (cleanRow[key] === undefined || cleanRow[key] === '') {
            delete cleanRow[key];
          }
        });
        return cleanRow;
      });

      // Find updated rows (present in originalDataRef, but changed)
      let updatedRows = data.filter(row => origPKs.has(row[primaryKey]));
      // Only send updates for rows that have changed
      updatedRows = updatedRows.filter(row => {
        const origRow = orig.find(r => r[primaryKey] === row[primaryKey]);
        if (!origRow) return false;
        // Compare non-PK fields
        return columns.some(col => col !== primaryKey && row[col] !== origRow[col]);
      });
      // Prepare updates: each must include PK and changed fields only
      let updates = updatedRows.map(row => {
        const updateObj = { [primaryKey]: row[primaryKey] };
        columns.forEach(col => {
          if (col !== primaryKey && row[col] !== undefined && row[col] !== null && row[col] !== "") {
            updateObj[col] = row[col];
          }
        });
        return updateObj;
      });
      // Filter out updates with missing/blank PK
      const invalidUpdates = updates.filter(u => !u[primaryKey]);
      updates = updates.filter(u => u[primaryKey]);
      if (invalidUpdates.length > 0) {
        toast({
          title: "Update Error",
          description: `Skipped ${invalidUpdates.length} row(s) with missing primary key.`,
          variant: "destructive",
        });
      }
      if (newRows.length > 0) {
        await insertApi(tableName, newRows, primaryKey);
        toast({
          title: "Rows Inserted",
          description: `${newRows.length} new row(s) inserted successfully!`,
          variant: "default",
        });
        // Call commissions API after insert
        await callCommissionsApi(tableName, 'insert', newRows, toast);
      }
      if (updates.length > 0) {
        await updateTableDataApi(tableName, primaryKey, updates);
        toast({
          title: "Rows Updated",
          description: `${updates.length} row(s) updated successfully!`,
          variant: "default",
        });
        // Call commissions API after update
        await callCommissionsApi(tableName, 'update', updates, toast);
      }
      if (newRows.length === 0 && updates.length === 0) {
        toast({
          title: "No Changes",
          description: "No new or updated rows to save.",
        });
      }
      setIsEditMode(false);
      setShowInsertOptions(false);
      setIsUpdateMode(false);
      // Update originalDataRef to include new data
      originalDataRef.current = [...data];
    } catch (error) {
      toast({
        title: "Save Failed",
        description: error instanceof Error ? error.message : "Failed to save data",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInsertClick = () => {
    setShowInsertOptions(!showInsertOptions);
  };

  const handleAddRow = () => {
    // Only add a new row if not immediately followed by a paste event
    // Use a flag to skip adding a blank row if a paste is about to happen
    if ((window as any)._skipNextAddRow) {
      (window as any)._skipNextAddRow = false;
      setShowInsertOptions(false);
      setIsUpdateMode(true);
      return;
    }
    const newRow: any = {};
    columns.forEach((col) => {
      newRow[col] = "";
    });
    setData([newRow, ...data]);
    setShowInsertOptions(false);
    setIsUpdateMode(true);
    toast({
      title: "New Row Added",
      description: "A new empty row has been added to the top of the table.",
    });
  };

  const handleCellChange = (rowIndex: number, column: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [column]: value };
    setData(newData);
  };

  // Save changes for a single row
  const handleSaveRow = async (rowIndex: number) => {
    setSaving(true);
    try {
      // Simulate API call for single row update
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setEditRowIndex(null);
      toast({
        title: "Row Updated",
        description: `Row ${rowIndex + 1} updated successfully!`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update row",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent, rowIndex: number, colIndex: number) => {
    // If pasting at the top and the first row is blank, remove it (for add row + paste flow)
    let workingData = data;
    if (rowIndex === 0 && data.length > 0 && columns.every(col => !data[0][col])) {
      workingData = data.slice(1);
      (window as any)._skipNextAddRow = true;
    }
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    // Split and filter out only truly empty lines (not lines with tabs or commas)
    const rows = pasteData.split("\n").filter(row => row.replace(/[\t,]/g, '').trim() !== '');
    if (rows.length === 0) return;

    // Helper: detect delimiter (tab or comma)
    function detectDelimiter(row: string) {
      // Prefer tab if present, else comma
      if (row.includes('\t')) return '\t';
      if (row.includes(',')) return ',';
      return '\t';
    }

    // Helper: parse a CSV row into cells, handling quoted commas
    function parseCSVRow(row: string): string[] {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          if (inQuotes && row[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    }

    // If more than one row, insert new rows at the top
    if (rows.length > 1) {
      // For pasted/uploaded data, allow PK to be set if present in the data
      const newRows = rows.map((row) => {
        const delimiter = detectDelimiter(row);
        let cells: string[];
        if (delimiter === ',') {
          cells = parseCSVRow(row);
        } else {
          cells = row.split(delimiter);
        }
        const newRow: any = {};
        let cellIdx = 0;
        columns.forEach((col) => {
          // Always take value from pasted data, including PK
          newRow[col] = cells[cellIdx]?.trim() || "";
          cellIdx++;
        });
        // Only add row if at least one cell is non-empty (excluding PK)
        const hasAnyData = columns.some(col => col !== primaryKey && newRow[col] && newRow[col].trim() !== "");
        return hasAnyData ? newRow : null;
      }).filter(Boolean);
      let finalData = [...newRows, ...workingData];
      // After paste, if first row is blank and more than one row, remove it
      if (finalData.length > 1 && columns.every(col => !finalData[0][col])) {
        finalData = finalData.slice(1);
      }
      if (newRows.length > 0) {
        setData(finalData);
        toast({
          title: "Bulk Data Pasted",
          description: `Added ${newRows.length} new rows from paste`,
        });
      }
      return;
    }

    // Single row paste: update existing row/columns, but always leave PK blank for new rows
    const newData = [...data];
    rows.forEach((row, rIdx) => {
      const delimiter = detectDelimiter(row);
      let cells: string[];
      if (delimiter === ',') {
        cells = parseCSVRow(row);
      } else {
        cells = row.split(delimiter);
      }
      const targetRowIndex = rowIndex + rIdx;
      if (targetRowIndex < newData.length) {
        const rowObj = { ...newData[targetRowIndex] };
        let cellIdx = 0;
        // Align pasted cells to the correct starting column
        columns.forEach((col, colIdx) => {
          if (col === primaryKey && (!newData[targetRowIndex][primaryKey] || newData[targetRowIndex][primaryKey] === "")) {
            rowObj[col] = "";
          } else if (col !== primaryKey && colIdx >= colIndex && cellIdx < cells.length) {
            rowObj[col] = cells[cellIdx]?.trim() || "";
            cellIdx++;
          }
        });
        newData[targetRowIndex] = rowObj;
      }
    });
    setData(newData);
    toast({
      title: "Data Pasted",
      description: `Pasted ${rows.length} row(s) of data`,
    });
  };

  const handleCSVImport = () => {
    // Helper: parse a CSV row into cells, handling quoted commas
    function parseCSVRow(row: string): string[] {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < row.length; i++) {
        const char = row[i];
        if (char === '"') {
          if (inQuotes && row[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current);
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current);
      return result;
    }

    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const csv = event.target?.result as string;
          const rows = csv.split("\n").filter(row => row.trim());
          if (rows.length < 2) return;
          const csvHeaders = parseCSVRow(rows[0]).map(h => h.trim());
          const newRows = rows.slice(1).map((row, index) => {
            const cells = parseCSVRow(row);
            const newRow: any = {};
            columns.forEach((col) => {
              // Find the index of this column in the CSV header
              const csvIdx = csvHeaders.findIndex(h => h.toLowerCase() === col.toLowerCase());
              newRow[col] = csvIdx !== -1 ? (cells[csvIdx]?.trim() || "") : "";
            });
            // Only add row if at least one cell is non-empty (excluding PK)
            const hasAnyData = columns.some(col => col !== primaryKey && newRow[col] && newRow[col].trim() !== "");
            return hasAnyData ? newRow : null;
          }).filter(Boolean);
          if (newRows.length > 0) {
            setData([...data, ...newRows]);
            setIsUpdateMode(true);
            toast({
              title: "CSV Imported",
              description: `Added ${newRows.length} new rows from CSV`,
            });
          } else {
            toast({
              title: "CSV Import",
              description: `No valid data rows found in CSV!`,
              variant: "destructive",
            });
          }
          setShowInsertOptions(false);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleMonthEndCalculation = async () => {
    if (!selectedMonth || !selectedYear) {
      toast({
        title: "Missing Information",
        description: "Please select both month and year for calculation.",
        variant: "destructive",
      });
      return;
    }

    setIsCalculating(true);
    try {
      // Simulate month-end calculation API call
      await new Promise((resolve) => setTimeout(resolve, 3000));
      
      toast({
        title: "Calculation Complete",
        description: `Month-end calculation for ${selectedMonth} ${selectedYear} has been completed successfully.`,
      });
    } catch (error) {
      toast({
        title: "Calculation Failed",
        description: "Failed to complete month-end calculation. Please try again.",
        variant: "destructive",
      });
    }
    setIsCalculating(false);
  };

  // Removed leftover Month-End Calculation section code

  // (No JSX here)
  return (
    <div className="min-h-screen bg-background">
      {/* Heading and Back Button */}
      <div className="w-full flex items-center justify-between px-6 pt-6 pb-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{tableName || "Table"}</h1>
        </div>
      </div>

      {/* Action Bar: Insert, Update, Cancel, Save, Edit, Upload CSV, Month-End */}
      <div className="w-full px-6">
  <div className="flex flex-wrap gap-2 items-center bg-card border border-border rounded-xl shadow-elegant p-4 mb-4 overflow-visible">
            {/* Download Report Dropdown */}
            <div className="relative">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDownloadOptions((v) => !v)}
                className="bg-card"
              >
                <Download className="h-4 w-4" /> Download Report
              </Button>
              {showDownloadOptions && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-popover border border-border rounded-lg shadow-elegant z-10 animate-slide-up">
                  <div className="p-2 space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadMonthReport}
                      className="w-full justify-start text-sm"
                    >
                      📅 Download Month Report
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDownloadShortReport}
                      className="w-full justify-start text-sm"
                    >
                      📝 Download Monthly Short Report
                    </Button>
                  </div>
                </div>
              )}
            </div>
          {isEditMode ? (
            <>
              {/* Insert Dropdown */}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleInsertClick}
                  className="bg-card"
                >
                  <Plus className="h-4 w-4" /> Insert
                </Button>
                {showInsertOptions && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-elegant z-10 animate-slide-up">
                    <div className="p-2 space-y-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleAddRow}
                        className="w-full justify-start text-sm"
                      >
                        <Plus className="h-4 w-4 mr-2" /> Add New Row
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCSVImport}
                        className="w-full justify-start text-sm"
                      >
                        <Upload className="h-4 w-4 mr-2" /> Upload CSV
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              {/* Update Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleUpdateMode}
                disabled={isUpdateMode}
              >
                <span style={{fontSize:'1.2em',marginRight:4}}>🔄</span>Update
              </Button>
              {/* Cancel Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditMode(false);
                  setIsUpdateMode(false);
                  setShowInsertOptions(false);
                }}
                className="bg-card"
              >
                <X className="h-4 w-4" /> Cancel
              </Button>
              {/* Save Changes Button: only enabled in update mode */}
              <Button
                variant="success"
                size="sm"
                onClick={handleUpdate}
                disabled={!isUpdateMode || isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Changes
              </Button>
            </>
          ) : (
            <Button variant="hero" size="sm" onClick={handleEdit}>
              <Edit3 className="h-4 w-4" /> Edit Data
            </Button>
          )}

          {/* Month-End Calculation Section (compact) */}
          <div className="flex items-center gap-2 ml-auto">
            <label className="text-sm font-medium">Month:</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="text-sm font-medium">Year:</label>
            <div className="bg-zinc-900 rounded flex items-center px-2 h-8">
              <Select
                value={selectedYear}
                onValueChange={setSelectedYear}
              >
                <SelectTrigger className="w-24 h-7 bg-zinc-900 text-white border-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-none">
                  <SelectValue placeholder="Year" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 text-white">
                  {Array.from({ length: 2025 - 2000 + 1 }, (_, i) => {
                    const year = (2025 - i).toString();
                    return (
                      <SelectItem key={year} value={year} className="text-sm">
                        {year}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <Button
              variant="default"
              size="sm"
              onClick={handleMonthEndCalculation}
              disabled={isCalculating || !selectedMonth || !selectedYear}
            >
              {isCalculating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
              Month-End
            </Button>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full px-6 pb-4">
        <div className="bg-card border border-border rounded-xl shadow-elegant overflow-hidden">
          <div className="overflow-x-auto max-h-[900px]">
            <table
              className="w-full text-sm max-w-full border-collapse"
              style={{ fontSize: '13px', tableLayout: 'auto' }}
            >
              <thead className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                <tr>
                  {columns.map((column) => (
                    <th
                      key={column}
                      className="font-semibold text-foreground border border-border px-3 py-2 text-left whitespace-nowrap"
                      style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                    >
                      {column}
                      {column === primaryKey && (
                        <span className="ml-2 text-xs text-primary font-normal">(PK)</span>
                      )}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-muted/30">
                    {columns.map((column, colIndex) => (
                      <td
                        key={column}
                        className="border border-border px-3 py-2 text-left whitespace-nowrap"
                        style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}
                      >
                        {isEditMode ? (
                          <Input
                            value={row[column] || ""}
                            onChange={(e) => handleCellChange(rowIndex, column, e.target.value)}
                            onPaste={(e) => handlePaste(e, rowIndex, colIndex)}
                            disabled={
                              isUpdateMode && column === primaryKey &&
                              originalDataRef.current.some(origRow => origRow[primaryKey] === row[primaryKey])
                            }
                            className={
                              column === primaryKey
                                ? "border-none bg-transparent h-8 p-1 text-primary font-medium text-sm"
                                : "border-none bg-transparent h-8 p-1 focus-visible:ring-1 focus-visible:ring-primary text-sm"
                            }
                            style={{ fontSize: '13px', minWidth: 0 }}
                          />
                        ) : (
                          <span className={column === primaryKey ? "font-medium text-primary" : ""}>
                            {String(row[column])?.length > 40
                              ? String(row[column]).slice(0, 37) + '...'
                              : String(row[column])}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {isEditMode && (
          <div className="mt-4 p-4 bg-muted/20 border border-border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>
                Edit mode active. You can modify existing data, add new rows, or import CSV files. <br />
                <b>Primary key column ({primaryKey}) is locked during update, but you can enter it when inserting new rows.</b>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* AI Chatbot */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          variant="hero"
          size="icon"
          className="h-14 w-14 rounded-full shadow-glow animate-glow"
          onClick={() => setIsChatOpen(true)}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
      </div>

      <ChatBot 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)} 
        databaseName={tableName}
        data={data}
      />
    </div>
  );
};

export default DataManagement;