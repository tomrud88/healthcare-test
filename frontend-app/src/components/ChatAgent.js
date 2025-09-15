// src/components/ChatAgent.js
import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { AuthContext } from "../AuthContext";
import { useChatContext } from "../ChatContext";

const ChatAgent = ({ isOpen, onClose, pendingMessage }) => {
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
      // Use production endpoint when deployed, localhost for development
      const apiEndpoint =
        process.env.NODE_ENV === "production"
          ? "https://us-central1-healthcare-patient-portal.cloudfunctions.net/dialogflowProxy"
          : "http://localhost:3001/dialogflow-proxy";

      const response = await fetch(apiEndpoint, {
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

      // Debug: Log the full response to see what we're getting
      console.log("=== FULL DIALOGFLOW RESPONSE ===");
      console.log(JSON.stringify(data, null, 2));

      // Extract response text from Dialogflow
      let botResponseText =
        "👋 Hello! I'm your Health Consultant. How can I help you today?";
      let richContent = null;

      if (data.queryResult && data.queryResult.responseMessages) {
        const responseMessages = data.queryResult.responseMessages;

        console.log("=== RESPONSE MESSAGES ===");
        console.log(JSON.stringify(responseMessages, null, 2));

        // Look for text response
        const textResponse = responseMessages.find((msg) => msg.text);
        if (textResponse && textResponse.text && textResponse.text.text) {
          botResponseText = textResponse.text.text.join(" ");
        }

        // Look for custom payload (rich content)
        const payloadResponse = responseMessages.find((msg) => msg.payload);
        if (payloadResponse && payloadResponse.payload) {
          console.log("=== FOUND RICH CONTENT ===");
          console.log(JSON.stringify(payloadResponse.payload, null, 2));
          richContent = payloadResponse.payload;
        } else {
          console.log("=== NO RICH CONTENT FOUND ===");
          console.log(
            "Available response message types:",
            responseMessages.map((msg) => Object.keys(msg))
          );
        }
      }

      // Add bot welcome message to chat
      const welcomeMessage = {
        id: Date.now(),
        text: botResponseText,
        isBot: true,
        timestamp: new Date(),
        richContent: richContent,
      };
      setMessages((prev) => [welcomeMessage, ...prev]); // Prepend welcome message instead of replacing all
    } catch (error) {
      console.error("Error getting welcome message from Dialogflow:", error);

      // Fallback welcome message if Dialogflow is unavailable
      const fallbackMessage = {
        id: Date.now(),
        text: "👋 Hello! I'm your Health Consultant. How can I help you today?\n\n• Book appointments\n• Find doctors\n• General health questions\n• And much more!\n\n(Note: AI assistant is currently offline, but I can still help you navigate the site!)",
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
      // Use production endpoint when deployed, localhost for development
      const apiEndpoint =
        process.env.NODE_ENV === "production"
          ? "https://us-central1-healthcare-patient-portal.cloudfunctions.net/dialogflowProxy"
          : "http://localhost:3001/dialogflow-proxy";

      // Call proxy server
      const response = await fetch(apiEndpoint, {
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

      // Debug: Log the full response to see what we're getting
      console.log("=== FULL DIALOGFLOW RESPONSE (sendMessage) ===");
      console.log(JSON.stringify(data, null, 2));

      // Extract response text from Dialogflow
      let botResponseText =
        "Sorry, I didn't understand that. Could you please rephrase?";
      let richContent = null;

      if (data.queryResult && data.queryResult.responseMessages) {
        const responseMessages = data.queryResult.responseMessages;

        console.log("=== RESPONSE MESSAGES (sendMessage) ===");
        console.log(JSON.stringify(responseMessages, null, 2));

        // Map all text responses to bot messages
        const botMessages = [];
        responseMessages.forEach((msg) => {
          if (msg.text && msg.text.text) {
            botMessages.push({
              id: Date.now() + Math.random(),
              text: msg.text.text.join(" "),
              isBot: true,
              timestamp: new Date(),
            });
          }
          if (msg.payload) {
            botMessages.push({
              id: Date.now() + Math.random(),
              text: "", // No text, just rich content
              isBot: true,
              timestamp: new Date(),
              richContent: msg.payload,
            });
          }
        });
        setMessages((prev) => [...prev, ...botMessages]);
      }
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
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xl">👩‍⚕️</span>
            </div>
            <div>
              <h3 className="font-semibold">AI Health Assistant</h3>
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
                    <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-xs">👩‍⚕️</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Healthcare Bot
                    </span>
                  </div>
                )}
                {/* Only render message bubble if text is not empty */}
                {message.text && message.text.trim() ? (
                  <div
                    className={`px-4 py-2 rounded-2xl whitespace-pre-wrap ${
                      message.isBot
                        ? message.isError
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-white text-gray-800 border border-gray-200 shadow-sm"
                        : "bg-green-600 text-white"
                    }`}
                  >
                    {message.text}
                  </div>
                ) : null}

                {/* Rich content (chips) */}
                {message.isBot && message.richContent && (
                  <div className="mt-2">
                    {message.richContent.richContent &&
                      message.richContent.richContent.map(
                        (section, sectionIndex) => (
                          <div key={sectionIndex}>
                            {section.map((item, itemIndex) => {
                              // Render chips
                              if (item.type === "chips" && item.options) {
                                return (
                                  <div
                                    key={itemIndex}
                                    className="flex flex-wrap gap-2 mt-2"
                                  >
                                    {item.options.map((option, optionIndex) => (
                                      <button
                                        key={optionIndex}
                                        onClick={() => sendMessage(option.text)}
                                        className="px-3 py-1 bg-green-50 hover:bg-green-100 text-green-700 rounded-full text-sm border border-green-200 transition-colors duration-200"
                                      >
                                        {option.text}
                                      </button>
                                    ))}
                                  </div>
                                );
                              }
                              // Render buttons
                              if (item.type === "button") {
                                if (item.link) {
                                  // External link button
                                  return (
                                    <a
                                      key={itemIndex}
                                      href={item.link}
                                      target={
                                        item.newWindow ? "_blank" : "_self"
                                      }
                                      rel="noopener noreferrer"
                                      className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-sm border border-blue-200 transition-colors duration-200 inline-block mr-2 mt-2"
                                    >
                                      {item.text}
                                    </a>
                                  );
                                } else if (item.event) {
                                  // Event button (can be handled with a callback if needed)
                                  return (
                                    <button
                                      key={itemIndex}
                                      onClick={() => {
                                        // TODO: handle custom event if needed
                                        alert(
                                          "Event triggered: " +
                                            (item.event.name || "")
                                        ); // Replace with real handler
                                      }}
                                      className="px-3 py-1 bg-yellow-50 hover:bg-yellow-100 text-yellow-700 rounded-full text-sm border border-yellow-200 transition-colors duration-200 mr-2 mt-2"
                                    >
                                      {item.text}
                                    </button>
                                  );
                                }
                              }
                              return null;
                            })}
                          </div>
                        )
                      )}
                  </div>
                )}
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
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                    <span className="text-xs">👩‍⚕️</span>
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
              className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
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
