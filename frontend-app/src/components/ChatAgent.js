import React, {
  useState,
  useRef,
  useEffect,
  useContext,
  useCallback,
} from "react";
import { AuthContext } from "../AuthContext";
import { useChatContext } from "../ChatContext";
import MedicalReportUploader from "./MedicalReportUploader";

// Helper: Split long text into chunks of <= 200 characters (try to split by sentence)
function splitTextForSpeech(text, maxLength = 200) {
  if (!text || text.length <= maxLength) return [text];
  const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
  const chunks = [];
  let current = "";
  for (const sentence of sentences) {
    if ((current + sentence).length > maxLength) {
      if (current) chunks.push(current);
      current = sentence;
    } else {
      current += sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

const ChatAgent = ({ isOpen, onClose, pendingMessage }) => {
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [showUploader, setShowUploader] = useState(false);

  const lastSpokenIdRef = useRef(null);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const speechChunksRef = useRef([]);
  const speechChunkIndexRef = useRef(0);

  const { externalMessages, clearExternalMessages } = useChatContext();
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasInitialized, setHasInitialized] = useState(false);
  const [sessionId] = useState(
    () => `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  );

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const { currentUser } = useContext(AuthContext);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setSpeakingMessageId(null);
    }
  }, []);

  const speakText = useCallback(
    (text, messageId = null) => {
      if (!speechEnabled) return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }
      if (!text) return;

      window.speechSynthesis.cancel();
      setSpeakingMessageId(messageId);
      const chunks = splitTextForSpeech(text, 200);
      speechChunksRef.current = chunks;
      speechChunkIndexRef.current = 0;

      const speakChunk = () => {
        const chunk = speechChunksRef.current[speechChunkIndexRef.current];
        if (!chunk) {
          setSpeakingMessageId(null);
          return;
        }
        const utterance = new window.SpeechSynthesisUtterance(chunk);
        utterance.lang = "en-US";
        utterance.onend = () => {
          speechChunkIndexRef.current += 1;
          if (speechChunkIndexRef.current < speechChunksRef.current.length) {
            speakChunk();
          } else {
            setSpeakingMessageId(null);
          }
        };
        window.speechSynthesis.speak(utterance);
      };

      speakChunk();
    },
    [speechEnabled]
  );

  useEffect(() => {
    if (!speechEnabled) {
      stopSpeech();
    }
  }, [speechEnabled, stopSpeech]);

  useEffect(() => {
    if (!speechEnabled) return;
    const botMessages = messages.filter(
      (msg) => msg.isBot && msg.text && msg.text.trim()
    );
    if (botMessages.length === 0) return;
    const latestBotMsg = botMessages[botMessages.length - 1];
    if (lastSpokenIdRef.current !== latestBotMsg.id) {
      const timer = setTimeout(() => {
        speakText(latestBotMsg.text, latestBotMsg.id);
        lastSpokenIdRef.current = latestBotMsg.id;
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [messages, speechEnabled, speakText]);

  const sendWelcomeMessage = useCallback(async () => {
    setIsLoading(true);

    try {
      const apiEndpoint =
        "https://us-central1-healthcare-poc-477108.cloudfunctions.net/dialogflowProxy";

      const response = await fetch(apiEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sessionId: sessionId,
          queryInput: {
            text: { text: "hello" },
            languageCode: "en",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log("=== FULL DIALOGFLOW RESPONSE ===");
      console.log(JSON.stringify(data, null, 2));

      let botResponseText =
        "👋 Hello! I'm your Health Consultant. How can I help you today?";
      let richContent = null;

      if (data.queryResult && data.queryResult.responseMessages) {
        const responseMessages = data.queryResult.responseMessages;

        console.log("=== RESPONSE MESSAGES ===");
        console.log(JSON.stringify(responseMessages, null, 2));

        const textResponse = responseMessages.find((msg) => msg.text);
        if (textResponse && textResponse.text && textResponse.text.text) {
          botResponseText = textResponse.text.text.join(" ");
        }

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

      const welcomeMessage = {
        id: Date.now(),
        text: botResponseText,
        isBot: true,
        timestamp: new Date(),
        richContent,
      };
      setMessages((prev) => [...prev, welcomeMessage]);
    } catch (error) {
      console.error("Error getting welcome message from Dialogflow:", error);

      const fallbackMessage = {
        id: Date.now(),
        text: "👋 Hello! I'm your Health Consultant. How can I help you today?\n\n• Book appointments\n• Find doctors\n• General health questions\n• And much more!\n\n(Note: AI assistant is currently offline, but I can still help you navigate the site!)",
        isBot: true,
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, fallbackMessage]);
    } finally {
      setIsLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [sessionId]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      if (!hasInitialized) {
        setTimeout(() => {
          setHasInitialized(true);
          sendWelcomeMessage();
        }, 200);
      }
    } else {
      stopSpeech();
    }
  }, [isOpen, hasInitialized, sendWelcomeMessage, stopSpeech]);

  useEffect(() => {
    if (isOpen) {
      setSpeechEnabled(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (externalMessages.length > 0) {
      console.log("External messages received:", externalMessages);
      setMessages((prev) => {
        const existingIds = new Set(prev.map((msg) => msg.id));
        const newMessages = externalMessages
          .filter((msg) => !existingIds.has(msg.id))
          .map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            isBot: false,
          }));

        console.log("Adding new messages to chat:", newMessages);

        if (newMessages.length > 0) {
          clearExternalMessages();
          return [...prev, ...newMessages];
        }
        return prev;
      });
    }
  }, [externalMessages, clearExternalMessages]);

  useEffect(() => {
    if (pendingMessage && isOpen) {
      console.log("ChatAgent: Adding pending message to chat:", pendingMessage);
      const messageToAdd = {
        id: pendingMessage.id || `pending-${Date.now()}`,
        text: pendingMessage.text,
        isBot: false,
        timestamp: new Date(pendingMessage.timestamp || new Date()),
        isExternal: true,
      };

      setMessages((prev) => {
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
      const apiEndpoint =
        "https://us-central1-healthcare-poc-477108.cloudfunctions.net/dialogflowProxy";

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

      console.log("=== FULL DIALOGFLOW RESPONSE (after upload) ===");
      console.log(JSON.stringify(data, null, 2));

      // Check for session parameters (webhook response)
      const sessionParams = data.queryResult?.parameters;
      let hasSessionParams = false;

      if (sessionParams?.doctor_summary) {
        console.log("=== FOUND DOCTOR SUMMARY IN SESSION PARAMS ===");
        hasSessionParams = true;

        // Display doctor summary
        const botMessages = [];

        if (sessionParams.doctor_summary) {
          botMessages.push({
            id: Date.now() + Math.random(),
            text: "👨‍⚕️ Doctor Summary:\n\n" + sessionParams.doctor_summary,
            isBot: true,
            timestamp: new Date(),
          });
        }

        if (sessionParams.consultation_message) {
          botMessages.push({
            id: Date.now() + Math.random(),
            text: "📅 " + sessionParams.consultation_message,
            isBot: true,
            timestamp: new Date(),
          });
        }

        if (sessionParams.should_book_consultation) {
          botMessages.push({
            id: Date.now() + Math.random(),
            text: "Based on your report, a consultation is recommended.\nLet's schedule it now. 📆\n\nWhat specialty, treatment, or scan are you looking for?",
            isBot: true,
            timestamp: new Date(),
          });
        }

        setMessages((prev) => [...prev, ...botMessages]);
        setIsLoading(false);
        return;
      }

      // Only process response messages if we didn't handle session params
      if (
        !hasSessionParams &&
        data.queryResult &&
        data.queryResult.responseMessages
      ) {
        const responseMessages = data.queryResult.responseMessages;

        console.log("=== RESPONSE MESSAGES (sendMessage) ===");
        console.log(JSON.stringify(responseMessages, null, 2));

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
              text: "",
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
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const handleChipClick = (chipText) => {
    if (chipText === "Upload Reports") {
      setShowUploader(true);
      sendMessage("Upload Reports");
    } else {
      sendMessage(chipText);
    }
  };

  const handleFileUploaded = async (fileUrl) => {
    setShowUploader(false);

    setIsLoading(true);

    // Show user confirmation that upload happened

    setMessages((prev) => [
      ...prev,

      {
        id: Date.now(),

        text: `I have uploaded my medical report. File URL: ${fileUrl}`,

        isBot: false,

        timestamp: new Date(),
      },
    ]);

    try {
      const apiEndpoint =
        "https://us-central1-healthcare-poc-477108.cloudfunctions.net/dialogflowProxy";

      const response = await fetch(apiEndpoint, {
        method: "POST",

        headers: { "Content-Type": "application/json" },

        body: JSON.stringify({
          sessionId: sessionId,

          queryInput: {
            text: {
              text: fileUrl, // Send URL directly like the simulator does
            },

            languageCode: "en",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      console.log("=== FULL DIALOGFLOW RESPONSE (after upload) ===");

      console.log(JSON.stringify(data, null, 2));

      if (data.queryResult && data.queryResult.responseMessages) {
        const responseMessages = data.queryResult.responseMessages;

        console.log("=== RESPONSE MESSAGES (after upload) ===");

        console.log(JSON.stringify(responseMessages, null, 2));

        const botMessages = [];

        responseMessages.forEach((msg) => {
          if (msg.text && msg.text.text) {
            msg.text.text.forEach((line) => {
              if (line && line.trim()) {
                botMessages.push({
                  id: Date.now() + Math.random(),

                  text: line,

                  isBot: true,

                  timestamp: new Date(),
                });
              }
            });
          }

          if (msg.payload) {
            botMessages.push({
              id: Date.now() + Math.random(),

              text: "",

              isBot: true,

              timestamp: new Date(),

              richContent: msg.payload,
            });
          }
        });

        if (botMessages.length > 0) {
          setMessages((prev) => [...prev, ...botMessages]);
        } else {
          setMessages((prev) => [
            ...prev,

            {
              id: Date.now() + 1,

              text: "No response received from the assistant.",

              isBot: true,

              timestamp: new Date(),

              isError: true,
            },
          ]);
        }
      }
    } catch (err) {
      console.error("Error processing uploaded file:", err);

      setMessages((prev) => [
        ...prev,

        {
          id: Date.now() + 1,

          text: "Error: " + (err.message || "Failed to process uploaded file."),

          isBot: true,

          timestamp: new Date(),

          isError: true,
        },
      ]);
    }

    setIsLoading(false);
  };

  const startVoiceInput = () => {
    const SpeechRecognition =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputMessage(transcript);
    };

    recognition.start();
  };

  const handleClose = () => {
    stopSpeech();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 lg:p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-blue-200/60 flex flex-col h-[min(90vh,700px)]">
        <div
          className="bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-3 rounded-t-2xl flex items-center justify-between gap-3"
          style={{
            background: "linear-gradient(135deg, #5B73FF 0%, #445CE0 100%)",
          }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xl">👩‍⚕️</span>
            </div>
            <div>
              <h3 className="font-semibold">AI Health Assistant</h3>
              <p className="text-xs opacity-90">Online • Ready to help</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSpeechEnabled((prev) => !prev)}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors duration-200"
            >
              {speechEnabled ? "🔊 Speech On" : "🔇 Speech Off"}
            </button>
            <button
              type="button"
              onClick={startVoiceInput}
              disabled={isListening}
              className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isListening ? "Listening…" : "🎤 Voice"}
            </button>
            <button
              onClick={handleClose}
              className="text-white/80 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
              aria-label="Close chat"
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
        </div>

        <div
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
          aria-live="polite"
        >
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
                      <span className="text-xs">👩‍⚕️</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      Healthcare Bot
                    </span>
                  </div>
                )}
                {message.text && message.text.trim() ? (
                  <div
                    className={`px-4 py-2 rounded-2xl whitespace-pre-wrap flex gap-3 items-start ${
                      message.isBot
                        ? message.isError
                          ? "bg-red-100 text-red-800 border border-red-200"
                          : "bg-white text-gray-800 border border-gray-200 shadow-sm"
                        : "bg-blue-600 text-white"
                    }`}
                    style={{
                      outline:
                        message.isBot && message.id === speakingMessageId
                          ? "2px solid #5B73FF"
                          : "none",
                    }}
                  >
                    <span className="flex-1">{message.text}</span>
                    {message.isBot && (
                      <div className="flex items-center gap-2">
                        <button
                          aria-label="Play message"
                          className={`text-blue-600 hover:text-blue-700 text-lg ${
                            message.id === speakingMessageId && speechEnabled
                              ? "animate-pulse"
                              : ""
                          }`}
                          onClick={() => speakText(message.text, message.id)}
                          disabled={!speechEnabled}
                        >
                          ▶
                        </button>
                        <button
                          aria-label="Stop speech"
                          className="text-blue-600 hover:text-blue-700 text-lg"
                          onClick={stopSpeech}
                          disabled={!speechEnabled}
                        >
                          ■
                        </button>
                      </div>
                    )}
                  </div>
                ) : null}

                {message.isBot && message.richContent && (
                  <div className="mt-2">
                    {message.richContent.richContent &&
                      message.richContent.richContent.map(
                        (section, sectionIndex) => (
                          <div key={sectionIndex}>
                            {section.map((item, itemIndex) => {
                              if (item.type === "chips" && item.options) {
                                return (
                                  <div
                                    key={itemIndex}
                                    className="flex flex-wrap gap-2 mt-2"
                                  >
                                    {item.options.map((option, optionIndex) => (
                                      <button
                                        key={optionIndex}
                                        onClick={() =>
                                          handleChipClick(option.text)
                                        }
                                        className="px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-sm border border-blue-200 transition-colors duration-200"
                                      >
                                        {option.text}
                                      </button>
                                    ))}
                                  </div>
                                );
                              }
                              if (item.type === "button") {
                                if (item.link) {
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
                                }
                                if (item.event) {
                                  return (
                                    <button
                                      key={itemIndex}
                                      onClick={() =>
                                        alert(
                                          "Event triggered: " +
                                            (item.event.name || "")
                                        )
                                      }
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

          {showUploader && (
            <div className="flex justify-start">
              <div className="max-w-[80%]">
                <div className="bg-white border border-blue-200 rounded-2xl px-4 py-4 shadow-sm">
                  <p className="text-sm font-semibold text-blue-700 mb-3">
                    Upload medical report
                  </p>
                  <MedicalReportUploader onFileUploaded={handleFileUploaded} />
                  <button
                    type="button"
                    onClick={() => setShowUploader(false)}
                    className="mt-3 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Cancel upload
                  </button>
                </div>
              </div>
            </div>
          )}

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
              type="button"
              onClick={startVoiceInput}
              disabled={isListening}
              className="px-4 py-2 w-12 h-12 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors duration-300 shadow-md flex items-center justify-center text-lg disabled:opacity-60 disabled:cursor-not-allowed"
            >
              🎤
            </button>
            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="px-4 py-2 w-12 h-12 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-lg"
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
