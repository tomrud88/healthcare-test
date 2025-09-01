// src/components/ChatAgent.js
import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { useChatContext } from "../ChatContext";

const ChatAgent = ({ isOpen, onClose, pendingMessage }) => {
  const navigate = useNavigate();
  const { externalMessages, clearExternalMessages } = useChatContext();
  const [messages, setMessages] = useState([]); // Start with empty messages
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false); // Track if welcome message sent
  const [sessionId] = useState(
    () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { currentUser } = useContext(AuthContext);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Function to send welcome message to Dialogflow
  const sendWelcomeMessage = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:3001/dialogflow-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId,
          queryInput: {
            text: {
              text: "hello", // Trigger welcome intent
            },
            languageCode: "en",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Extract response text from Dialogflow
      let botResponseText =
        "👋 Hello! I'm your healthcare assistant. How can I help you today?";

      if (data.queryResult && data.queryResult.responseMessages) {
        const responseMessages = data.queryResult.responseMessages;
        const textResponse = responseMessages.find((msg) => msg.text);
        if (textResponse && textResponse.text && textResponse.text.text) {
          botResponseText = textResponse.text.text.join(" ");
        }
      }

      // Add bot welcome message to chat
      const welcomeMessage = {
        id: Date.now(),
        text: botResponseText,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [welcomeMessage, ...prev]); // Prepend welcome message instead of replacing all
    } catch (error) {
      console.error("Error getting welcome message from Dialogflow:", error);

      // Fallback welcome message if Dialogflow is unavailable
      const fallbackMessage = {
        id: Date.now(),
        text: "👋 Hello! I'm your healthcare assistant. How can I help you today?\n\n• Book appointments\n• Find doctors\n• General health questions\n• And much more!\n\n(Note: AI assistant is currently offline, but I can still help you navigate the site!)",
        isBot: true,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [fallbackMessage, ...prev]); // Prepend welcome message instead of replacing all
    } finally {
      setIsLoading(false);
      // Auto-focus the input field after welcome message
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [sessionId]);

  // Focus input when chat opens and send welcome message
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);

      // Send welcome message to Dialogflow when chat opens for the first time
      // But wait a bit to allow external messages to load first
      if (!hasInitialized) {
        setTimeout(() => {
          setHasInitialized(true);
          sendWelcomeMessage();
        }, 200); // Small delay to let external messages load first
      }
    }
  }, [isOpen, hasInitialized, sendWelcomeMessage]);

  // Handle external messages from other components
  useEffect(() => {
    if (externalMessages.length > 0) {
      console.log("External messages received:", externalMessages); // Debug log

      // Add external messages to the chat history permanently
      setMessages((prev) => {
        // Check if these messages are already in the chat to avoid duplicates
        const existingIds = new Set(prev.map((msg) => msg.id));
        const newMessages = externalMessages
          .filter((msg) => !existingIds.has(msg.id))
          .map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp), // Convert timestamp back to Date object
            isBot: false, // Make sure it shows as user message (confirmation)
          }));

        console.log("Adding new messages to chat:", newMessages); // Debug log

        if (newMessages.length > 0) {
          clearExternalMessages(); // Clear from external queue after adding to main chat
          return [...prev, ...newMessages];
        }
        return prev;
      });
    }
  }, [externalMessages, clearExternalMessages]);

  // Load external messages when chat first opens
  useEffect(() => {
    if (isOpen && externalMessages.length > 0) {
      // This will trigger the effect above to load any pending external messages
    }
  }, [isOpen, externalMessages.length]);

  // Handle pending message from FloatingChatButton
  useEffect(() => {
    if (pendingMessage && isOpen) {
      console.log("ChatAgent: Adding pending message to chat:", pendingMessage);
      const messageToAdd = {
        id: pendingMessage.id || `pending-${Date.now()}`,
        text: pendingMessage.text,
        isBot: false, // Show as user message (confirmation)
        timestamp: new Date(pendingMessage.timestamp || new Date()),
        isExternal: true,
      };

      // Add the message to chat
      setMessages((prev) => {
        // Check if message already exists
        const exists = prev.some((msg) => msg.id === messageToAdd.id);
        if (!exists) {
          console.log("ChatAgent: Adding message to chat:", messageToAdd);
          return [...prev, messageToAdd];
        }
        console.log("ChatAgent: Message already exists, skipping");
        return prev;
      });
    }
  }, [pendingMessage, isOpen]);

  const sendMessage = async (messageText) => {
    if (!messageText.trim()) return;

    // Add user message to chat
    const userMessage = {
      id: Date.now(),
      text: messageText,
      isBot: false,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // Call local proxy server
      const response = await fetch("http://localhost:3001/dialogflow-proxy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId,
          queryInput: {
            text: {
              text: messageText,
            },
            languageCode: "en",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Extract response text from Dialogflow
      let botResponseText =
        "Sorry, I didn't understand that. Could you please rephrase?";

      if (data.queryResult && data.queryResult.responseMessages) {
        const responseMessages = data.queryResult.responseMessages;
        const textResponse = responseMessages.find((msg) => msg.text);
        if (textResponse && textResponse.text && textResponse.text.text) {
          botResponseText = textResponse.text.text.join(" ");
        }
      }

      // Add bot response to chat
      const botMessage = {
        id: Date.now() + 1,
        text: botResponseText,
        isBot: true,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error communicating with chat agent:", error);

      // Add error message to chat
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment, or contact our support team if the issue persists.",
        isBot: true,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Auto-focus the input field after bot responds
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(inputMessage);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (timestamp) => {
    // Ensure timestamp is a Date object
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const quickActions = [
    "Book an appointment",
    "Find a doctor",
    "View my appointments",
    "What services do you offer?",
    "Office hours and location",
  ];

  const handleQuickAction = (action) => {
    if (action === "Book an appointment") {
      // Add user message to chat
      const userMessage = {
        id: Date.now(),
        text: action,
        isBot: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add bot response message
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          text: "📋 Taking you to the booking page where you can book your appointment with our specialists...",
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);

        // Navigate after showing the message for 2 seconds
        setTimeout(() => {
          navigate("/book-appointment");
          onClose(); // Close the chat when navigating
        }, 2000);
      }, 500);
    } else if (action === "Find a doctor") {
      // Add user message to chat
      const userMessage = {
        id: Date.now(),
        text: action,
        isBot: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add bot response message
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          text: "👩‍⚕️ Taking you to our doctors page where you can browse all available specialists...",
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);

        // Navigate after showing the message for 2 seconds
        setTimeout(() => {
          navigate("/doctors");
          onClose(); // Close the chat when navigating
        }, 2000);
      }, 500);
    } else if (action === "View my appointments") {
      // Add user message to chat
      const userMessage = {
        id: Date.now(),
        text: action,
        isBot: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add bot response message
      setTimeout(() => {
        const botMessage = {
          id: Date.now() + 1,
          text: "📅 Taking you to your appointments page...",
          isBot: true,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);

        // Navigate after showing the message for 1.5 seconds
        setTimeout(() => {
          navigate("/my-appointments");
          onClose(); // Close the chat when navigating
        }, 1500);
      }, 500);
    } else {
      sendMessage(action);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 lg:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-25 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Chat Window */}
      <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 w-full max-w-md h-[600px] flex flex-col animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xl">🏥</span>
            </div>
            <div>
              <h3 className="font-semibold">Healthcare Assistant</h3>
              <p className="text-xs opacity-90">Online • Ready to help</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.isBot ? "justify-start" : "justify-end"
              }`}
            >
              <div
                className={`max-w-[80%] ${
                  message.isBot ? "order-1" : "order-2"
                }`}
              >
                {message.isBot && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-xs">🤖</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Healthcare Bot
                    </span>
                  </div>
                )}
                <div
                  className={`px-4 py-2 rounded-2xl whitespace-pre-wrap ${
                    message.isBot
                      ? message.isError
                        ? "bg-red-100 text-red-800 border border-red-200"
                        : "bg-white text-gray-800 border border-gray-200 shadow-sm"
                      : "bg-blue-600 text-white"
                  }`}
                >
                  {message.text}
                </div>
                <div
                  className={`text-xs text-gray-400 mt-1 ${
                    message.isBot ? "text-left" : "text-right"
                  }`}
                >
                  {formatTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[80%]">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center">
                    <span className="text-xs">🤖</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Healthcare Bot is typing...
                  </span>
                </div>
                <div className="bg-white border border-gray-200 rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && !isLoading && (
          <div className="p-4 border-t border-gray-200 bg-white">
            <p className="text-xs text-gray-500 mb-2">Quick actions:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickAction(action)}
                  className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors border border-blue-200"
                  disabled={isLoading}
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-2xl">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            </button>
          </form>
          {currentUser && (
            <p className="text-xs text-gray-500 mt-2">
              Logged in as {currentUser.email.split("@")[0]}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatAgent;
