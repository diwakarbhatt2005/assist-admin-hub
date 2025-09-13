import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Edit3, Save, Upload, ArrowLeft, Loader2, CheckCircle, X, Plus, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ChatBot } from "@/components/ChatBot";

const DataManagement = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [showInsertOptions, setShowInsertOptions] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [databaseName, setDatabaseName] = useState<string>("");
  const [columns, setColumns] = useState<string[]>([]);
  const [primaryKey, setPrimaryKey] = useState<string>("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [isCalculating, setIsCalculating] = useState(false);

  useEffect(() => {
    if (!location.state?.data) {
      navigate("/");
      return;
    }

    const { data: receivedData, databaseName: dbName } = location.state;
    setData(receivedData);
    setDatabaseName(dbName);
    
    if (receivedData.length > 0) {
      const cols = Object.keys(receivedData[0]);
      setColumns(cols);
      setPrimaryKey(cols[0]); // First column is primary key
    }
  }, [location.state, navigate]);

  const handleEdit = () => {
    setIsEditMode(true);
    setShowInsertOptions(false);
    toast({
      title: "Edit Mode Activated",
      description: "You can now modify existing data or insert new rows.",
    });
  };

  const handleUpdate = async () => {
    setSaving(true);
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Simulate potential failure (5% chance)
      if (Math.random() < 0.05) {
        throw new Error("Failed to update data in database");
      }

      setIsEditMode(false);
      setShowInsertOptions(false);
      toast({
        title: "Data Updated",
        description: "All changes have been successfully saved to the database.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: error instanceof Error ? error.message : "Failed to update data",
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
    const newRow: any = {};
    columns.forEach((col) => {
      if (col === primaryKey) {
        newRow[col] = Math.max(...data.map(row => parseInt(row[col]) || 0)) + 1;
      } else {
        newRow[col] = "";
      }
    });
    
    setData([...data, newRow]);
    setShowInsertOptions(false);
    toast({
      title: "New Row Added",
      description: "A new empty row has been added to the table.",
    });
  };

  const handleCellChange = (rowIndex: number, column: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [column]: value };
    setData(newData);
  };

  const handlePaste = (e: React.ClipboardEvent, rowIndex: number, colIndex: number) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text");
    const rows = pasteData.split("\n").filter(row => row.trim());
    const newData = [...data];

    rows.forEach((row, rIdx) => {
      const cells = row.split("\t");
      cells.forEach((cell, cIdx) => {
        const targetRowIndex = rowIndex + rIdx;
        const targetColIndex = colIndex + cIdx;
        
        if (targetRowIndex < newData.length && targetColIndex < columns.length) {
          const column = columns[targetColIndex];
          if (column !== primaryKey) { // Don't allow editing primary key
            newData[targetRowIndex] = { ...newData[targetRowIndex], [column]: cell.trim() };
          }
        }
      });
    });

    setData(newData);
    toast({
      title: "Data Pasted",
      description: `Pasted ${rows.length} rows of data`,
    });
  };

  const handleCSVImport = () => {
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
          const newRows = rows.slice(1).map((row, index) => {
            const cells = row.split(",");
            const newRow: any = {};
            columns.forEach((col, colIndex) => {
              if (col === primaryKey) {
                newRow[col] = Math.max(...data.map(r => parseInt(r[col]) || 0)) + index + 1;
              } else {
                newRow[col] = cells[colIndex]?.trim() || "";
              }
            });
            return newRow;
          });
          
          setData([...data, ...newRows]);
          setShowInsertOptions(false);
          toast({
            title: "CSV Imported",
            description: `Added ${newRows.length} new rows from CSV`,
          });
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
    } finally {
      setIsCalculating(false);
    }
  };

  if (!data.length) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-gradient-subtle">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
                className="text-muted-foreground hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {databaseName.replace(/_/g, " ")}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {data.length} records • {columns.length} columns
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isEditMode ? (
                <div className="flex gap-2">
                  <div className="relative">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleInsertClick}
                      className="bg-card"
                    >
                      <Plus className="h-4 w-4" />
                      Insert
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
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Row
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCSVImport}
                            className="w-full justify-start text-sm"
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Import CSV
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsEditMode(false);
                      setShowInsertOptions(false);
                    }}
                    className="bg-card"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </Button>
                  <Button
                    variant="success"
                    size="sm"
                    onClick={handleUpdate}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {isSaving ? "Updating..." : "Update"}
                  </Button>
                </div>
              ) : (
                <Button variant="hero" size="sm" onClick={handleEdit}>
                  <Edit3 className="h-4 w-4" />
                  Edit Data
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div className="container mx-auto px-6 py-6">
        <div className="bg-card border border-border rounded-xl shadow-elegant overflow-hidden">
          <div className="overflow-x-auto max-h-[600px]">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/50 backdrop-blur-sm">
                <TableRow>
                  {columns.map((column) => (
                    <TableHead key={column} className="font-semibold text-foreground">
                      {column}
                      {column === primaryKey && (
                        <span className="ml-2 text-xs text-primary font-normal">(PK)</span>
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row, rowIndex) => (
                  <TableRow key={rowIndex} className="hover:bg-muted/30">
                    {columns.map((column, colIndex) => (
                      <TableCell key={column} className="p-2">
                        {isEditMode && column !== primaryKey ? (
                          <Input
                            value={row[column] || ""}
                            onChange={(e) => handleCellChange(rowIndex, column, e.target.value)}
                            onPaste={(e) => handlePaste(e, rowIndex, colIndex)}
                            className="border-none bg-transparent h-8 p-1 focus-visible:ring-1 focus-visible:ring-primary"
                          />
                        ) : (
                          <span className={column === primaryKey ? "font-medium text-primary" : ""}>
                            {row[column]}
                          </span>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {isEditMode && (
          <div className="mt-4 p-4 bg-muted/20 border border-border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4 text-success" />
              <span>
                Edit mode active. You can modify existing data, add new rows, or import CSV files. 
                Primary key column ({primaryKey}) is protected from editing.
              </span>
            </div>
          </div>
        )}

        {/* Month-End Calculation Section */}
        <div className="mt-8 bg-card border border-border rounded-xl p-6 shadow-elegant">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-10 w-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <Calendar className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Month-End Calculation</h2>
              <p className="text-sm text-muted-foreground">Run financial calculations for specific months</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Month</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select month..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {[
                    "January", "February", "March", "April", "May", "June",
                    "July", "August", "September", "October", "November", "December"
                  ].map((month) => (
                    <SelectItem key={month} value={month} className="focus:bg-accent">
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Year</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select year..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                    <SelectItem key={year} value={year.toString()} className="focus:bg-accent">
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleMonthEndCalculation}
              disabled={isCalculating || !selectedMonth || !selectedYear}
              variant="hero"
              size="lg"
              className="h-12"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calendar className="h-4 w-4" />
                  Calculate Month-End
                </>
              )}
            </Button>
          </div>
        </div>
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
        databaseName={databaseName}
        data={data}
      />
    </div>
  );
};

export default DataManagement;