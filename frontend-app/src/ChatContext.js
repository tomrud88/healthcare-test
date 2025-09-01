// src/ChatContext.js
import React, { createContext, useContext, useState } from "react";

const ChatContext = createContext();

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};

export const ChatProvider = ({ children }) => {
  // Load persisted external messages from localStorage
  const [externalMessages, setExternalMessages] = useState(() => {
    try {
      const saved = localStorage.getItem("chatExternalMessages");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [shouldAutoOpen, setShouldAutoOpen] = useState(false);

  const addExternalMessage = (message, autoOpen = false) => {
    const timestamp = new Date(); // Use Date object instead of string
    const messageWithId = {
      id: `external-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: message,
      isUser: true,
      timestamp: timestamp.toISOString(), // Store as string for localStorage
      isExternal: true, // Flag to identify external messages
    };

    const updatedMessages = [...externalMessages, messageWithId];
    setExternalMessages(updatedMessages);

    // Persist to localStorage
    try {
      localStorage.setItem(
        "chatExternalMessages",
        JSON.stringify(updatedMessages)
      );
    } catch (error) {
      console.error("Failed to save external messages to localStorage:", error);
    }

    // Set auto-open flag if this is an important message
    if (autoOpen) {
      setShouldAutoOpen(true);
    }
  };

  const clearExternalMessages = () => {
    setExternalMessages([]);
    // Clear from localStorage
    try {
      localStorage.removeItem("chatExternalMessages");
    } catch (error) {
      console.error(
        "Failed to clear external messages from localStorage:",
        error
      );
    }
  };

  const clearAutoOpen = () => {
    setShouldAutoOpen(false);
  };

  const value = {
    externalMessages,
    addExternalMessage,
    clearExternalMessages,
    shouldAutoOpen,
    clearAutoOpen,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export default ChatContext;
