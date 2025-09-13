import { useState } from "react";
import ThemeSwitcher from "./ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, Send, Bot, User, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { fetchChatbotResponse } from "@/api-integrations/chatbotApi";

// Defines the structure for a single chat message
interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// Defines the properties (props) the ChatBot component expects
interface ChatBotProps {
  isOpen: boolean;
  onClose: () => void;
  databaseName: string;
  data: any[]; // Data from the database that the chatbot might use
}

export const ChatBot = ({ isOpen, onClose, databaseName, data }: ChatBotProps) => {
  // State to hold all the chat messages
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      text: `Hello! I'm your AI assistant for the ${databaseName} database. I can help you analyze data, answer questions, or provide insights. What would you like to know?`,
      isUser: false,
      timestamp: new Date(),
    },
  ]);

  // State for the text input field
  const [inputValue, setInputValue] = useState("");
  // State to show a "typing..." indicator
  const [isTyping, setIsTyping] = useState(false);

  // Function to handle sending a message
  const handleSend = async () => {
    // Don't send if the input is empty
    if (!inputValue.trim()) return;

    // Create a new message object for the user's message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    // Add the user's message to the chat and clear the input
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true); // Show the "AI is thinking..." indicator

    // Call the external API to get the chatbot's response
    const answer = await fetchChatbotResponse(inputValue);

    // Create a new message object for the bot's response
    const botResponse: Message = {
      id: (Date.now() + 1).toString(),
      text: answer,
      isUser: false,
      timestamp: new Date(),
    };

    // Add the bot's response to the chat
    setMessages(prev => [...prev, botResponse]);
    setIsTyping(false); // Hide the "AI is thinking..." indicator
  };

  // Function to allow sending message with the "Enter" key
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault(); // Prevent adding a new line
      handleSend();
    }
  };

  // If the chat window is not supposed to be open, don't render anything
  if (!isOpen) return null;

  // Render the chat window UI
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
            <div className="flex items-center gap-2">
              <ThemeSwitcher />
              <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Messages Area */}
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
            {/* "AI is thinking..." indicator */}
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

          {/* Input Field */}
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