// src/components/ChatAgent.js
import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { AuthContext } from "../AuthContext";

const ChatAgent = ({ isOpen, onClose }) => {
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
      setMessages([welcomeMessage]);
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
      setMessages([fallbackMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  // Focus input when chat opens and send welcome message
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);

      // Send welcome message to Dialogflow when chat opens for the first time
      if (!hasInitialized) {
        setHasInitialized(true);
        sendWelcomeMessage();
      }
    }
  }, [isOpen, hasInitialized, sendWelcomeMessage]);

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
    return timestamp.toLocaleTimeString([], {
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
    sendMessage(action);
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
