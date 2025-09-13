import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Database, Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Mock data for different databases
const mockDatabases = {
  db1: [
    { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", department: "IT" },
    { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User", department: "Marketing" },
    { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "Manager", department: "Sales" },
    { id: 4, name: "Alice Brown", email: "alice@example.com", role: "User", department: "HR" },
    { id: 5, name: "Charlie Wilson", email: "charlie@example.com", role: "Admin", department: "Finance" },
  ],
  db2: [
    { productId: 101, productName: "Laptop Pro", category: "Electronics", price: 1299.99, stock: 45 },
    { productId: 102, productName: "Wireless Mouse", category: "Accessories", price: 29.99, stock: 120 },
    { productId: 103, productName: "Gaming Chair", category: "Furniture", price: 399.99, stock: 23 },
    { productId: 104, productName: "4K Monitor", category: "Electronics", price: 599.99, stock: 67 },
    { productId: 105, productName: "Mechanical Keyboard", category: "Accessories", price: 149.99, stock: 89 },
  ],
  Student_Data: [
    { studentId: 1001, firstName: "Emma", lastName: "Davis", grade: 95, subject: "Mathematics", semester: "Fall 2024" },
    { studentId: 1002, firstName: "Liam", lastName: "Garcia", grade: 87, subject: "Physics", semester: "Fall 2024" },
    { studentId: 1003, firstName: "Olivia", lastName: "Rodriguez", grade: 92, subject: "Chemistry", semester: "Fall 2024" },
    { studentId: 1004, firstName: "Noah", lastName: "Martinez", grade: 89, subject: "Biology", semester: "Fall 2024" },
    { studentId: 1005, firstName: "Sophia", lastName: "Anderson", grade: 94, subject: "Computer Science", semester: "Fall 2024" },
  ],
  Business_Analytics: [
    { quarter: "Q1 2024", revenue: 125000, expenses: 85000, profit: 40000, growth: "8.5%" },
    { quarter: "Q2 2024", revenue: 142000, expenses: 95000, profit: 47000, growth: "13.6%" },
    { quarter: "Q3 2024", revenue: 158000, expenses: 105000, profit: 53000, growth: "11.3%" },
    { quarter: "Q4 2024", revenue: 175000, expenses: 115000, profit: 60000, growth: "10.8%" },
  ],
};

const DatabaseSelection = () => {
  const [selectedDatabase, setSelectedDatabase] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const databases = Object.keys(mockDatabases);

  const handleDatabaseSelect = async () => {
    if (!selectedDatabase) {
      toast({
        title: "No Database Selected",
        description: "Please select a database from the dropdown",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Simulate API call delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Simulate potential API failure (10% chance)
      if (Math.random() < 0.1) {
        throw new Error("Failed to connect to database server");
      }

      const data = mockDatabases[selectedDatabase as keyof typeof mockDatabases];
      
      navigate("/view-data", { 
        state: { 
          data, 
          databaseName: selectedDatabase 
        } 
      });

      toast({
        title: "Database Connected",
        description: `Successfully connected to ${selectedDatabase}`,
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
            Database Admin
          </h1>
          <p className="text-muted-foreground text-lg">
            Select a database to begin managing your data
          </p>
        </div>

        {/* Selection Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-elegant backdrop-blur-sm">
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Choose Database
              </label>
              <Select value={selectedDatabase} onValueChange={setSelectedDatabase}>
                <SelectTrigger className="h-12 bg-background border-border hover:border-primary/50 transition-smooth">
                  <SelectValue placeholder="Select a database..." />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {databases.map((db) => (
                    <SelectItem key={db} value={db} className="focus:bg-accent">
                      {db.replace(/_/g, " ")}
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
              onClick={handleDatabaseSelect}
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
                  Connect to Database
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-primary">{databases.length}</div>
            <div className="text-sm text-muted-foreground">Available Databases</div>
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