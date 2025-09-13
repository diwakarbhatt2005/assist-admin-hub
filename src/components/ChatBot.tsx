import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  databaseName: string;
  data: any[];
}

export const ChatBot = ({ isOpen, onClose, databaseName, data }: ChatBotProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `Hello! I'm your AI assistant for the ${databaseName} database. I can help you analyze data, answer questions, or provide insights. What would you like to know?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const generateResponse = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    
    // Sample responses based on query content
    if (lowerQuery.includes("count") || lowerQuery.includes("how many")) {
      return `There are currently ${data.length} records in the ${databaseName} database.`;
    }
    
    if (lowerQuery.includes("column") || lowerQuery.includes("field")) {
      const columns = data.length > 0 ? Object.keys(data[0]) : [];
      return `The ${databaseName} database has ${columns.length} columns: ${columns.join(", ")}.`;
    }
    
    if (lowerQuery.includes("summary") || lowerQuery.includes("overview")) {
      const columns = data.length > 0 ? Object.keys(data[0]) : [];
      return `Database Summary for ${databaseName}:\n• Total records: ${data.length}\n• Columns: ${columns.length}\n• Primary key: ${columns[0] || "Not specified"}\n• Data types: Mixed (strings, numbers, dates)`;
    }
    
    if (lowerQuery.includes("export") || lowerQuery.includes("download")) {
      return "You can export data using the table's built-in features. In edit mode, you can also import CSV files to add new records.";
    }
    
    if (lowerQuery.includes("edit") || lowerQuery.includes("modify")) {
      return "To edit the data, click the 'Edit Data' button in the top toolbar. This will allow you to modify cells directly, paste data from spreadsheets, or import CSV files.";
    }
    
    if (lowerQuery.includes("help") || lowerQuery.includes("what can you do")) {
      return "I can help you with:\n• Database statistics and summaries\n• Column information\n• Data editing guidance\n• Export/import instructions\n• General database questions\n\nFeel free to ask me anything about your data!";
    }
    
    // Default response
    return `I understand you're asking about "${query}". Based on the current ${databaseName} database with ${data.length} records, I'd be happy to help! Could you be more specific about what information you'd like to know?`;
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: generateResponse(inputValue),
      isUser: false,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, botResponse]);
    setIsTyping(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
      <div className="fixed right-6 bottom-6 top-6 w-96 max-w-[calc(100vw-3rem)]">
        <div className="h-full bg-card border border-border rounded-xl shadow-elegant flex flex-col overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-gradient-subtle">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 bg-gradient-primary rounded-full flex items-center justify-center">
                <Bot className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">AI Assistant</h3>
                <p className="text-xs text-muted-foreground">{databaseName} Database</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3 animate-slide-up",
                  message.isUser ? "justify-end" : "justify-start"
                )}
              >
                {!message.isUser && (
                  <div className="h-6 w-6 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-line",
                    message.isUser
                      ? "bg-primary text-primary-foreground ml-auto"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.text}
                </div>
                {message.isUser && (
                  <div className="h-6 w-6 bg-secondary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="h-3 w-3 text-secondary-foreground" />
                  </div>
                )}
              </div>
            ))}
            
            {isTyping && (
              <div className="flex gap-3 animate-slide-up">
                <div className="h-6 w-6 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <Bot className="h-3 w-3 text-primary-foreground" />
                </div>
                <div className="bg-muted text-foreground rounded-lg px-3 py-2 text-sm flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  AI is thinking...
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border bg-gradient-subtle">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your data..."
                className="flex-1 bg-background border-border"
                disabled={isTyping}
              />
              <Button
                onClick={handleSend}
                disabled={!inputValue.trim() || isTyping}
                variant="default"
                size="icon"
                className="bg-gradient-primary hover:shadow-glow"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};