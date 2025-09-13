import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { fetchTableNames } from "@/api-integrations/fetchTableNames";
import { fetchTableData } from "@/api-integrations/fetchTableData";



const DatabaseSelection = () => {

  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setIsLoading(true);
    fetchTableNames()
      .then((tableList) => {
        setTables(tableList);
        setError("");
      })
      .catch((err) => {
        setError("Failed to fetch tables");
        setTables([]);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleTableSelect = async () => {
    if (!selectedTable) {
      toast({
        title: "No Table Selected",
        description: "Please select a table from the dropdown",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const result = await fetchTableData(selectedTable, 1000, 0);
      if (!result || !Array.isArray(result.data)) {
        throw new Error("No data found for this table");
      }
      navigate("/view-data", {
        state: {
          data: result.data,
          databaseName: selectedTable,
        },
      });
      toast({
        title: "Table Connected",
        description: `Successfully connected to table ${selectedTable}`,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch data. Please try again.";
      setError(errorMessage);
      toast({
        title: "Connection Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-glow opacity-30"></div>
      
      <div className="relative z-10 w-full max-w-md space-y-8 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <Database className="h-16 w-16 text-primary animate-glow" />
              <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
            </div>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Table Admin
          </h1>
          <p className="text-muted-foreground text-lg">
            Select a table to begin managing your data
          </p>
        </div>

        {/* Selection Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-elegant backdrop-blur-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Choose Table
              </label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="h-12 bg-background border-border hover:border-primary/50 transition-smooth">
                  <SelectValue placeholder="Select a table..." />
                </SelectTrigger>
                <SelectContent
                  className="bg-popover border-border min-w-[200px] max-w-[320px] max-h-[300px] overflow-y-auto"
                  style={{
                    top: 'unset',
                    bottom: 'unset',
                    direction: 'ltr',
                  }}
                  side="bottom"
                  align="start"
                  sideOffset={4}
                >
                  {tables.map((table) => (
                    <SelectItem key={table} value={table} className="focus:bg-accent truncate max-w-[280px]">
                      {table.replace(/_/g, " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive animate-slide-up">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button
              onClick={handleTableSelect}
              disabled={isLoading}
              variant="hero"
              size="lg"
              className="w-full h-12"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Database className="h-4 w-4" />
                  Connect to Table
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{tables.length}</div>
            <div className="text-sm text-muted-foreground">Available Tables</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">99.9%</div>
            <div className="text-sm text-muted-foreground">Uptime</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSelection;