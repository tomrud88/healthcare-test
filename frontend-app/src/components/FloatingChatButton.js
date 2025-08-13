// src/components/FloatingChatButton.js
import React, { useState } from "react";
import ChatAgent from "./ChatAgent";

const FloatingChatButton = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const openChat = () => {
    setIsChatOpen(true);
  };

  return (
    <>
      {/* Floating Chat Button - Only shows when chat is closed */}
      {!isChatOpen && (
        <button
          onClick={openChat}
          className="group fixed bottom-6 right-6 w-16 h-16 rounded-full shadow-lg transition-all duration-300 transform hover:scale-110 z-50 bg-blue-600 hover:bg-blue-700"
          style={{ zIndex: 9999 }}
          aria-label="Open chat"
        >
          {/* Chat Icon */}
          <div className="flex items-center justify-center w-full h-full text-white">
            <svg
              className="w-7 h-7 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
              />
            </svg>
          </div>

          {/* Notification Dot */}
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse pointer-events-none">
            <span className="sr-only">New messages</span>
          </div>

          {/* Tooltip */}
          <div className="absolute right-full mr-3 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
            <div className="bg-gray-800 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
              Need help? Chat with us!
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-4 border-l-gray-800 border-t-4 border-t-transparent border-b-4 border-b-transparent"></div>
            </div>
          </div>

          {/* Pulse animation ring - positioned absolute inside button */}
          <div className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-75 pointer-events-none"></div>
        </button>
      )}

      {/* Chat Agent Component */}
      <ChatAgent isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
};

export default FloatingChatButton;
