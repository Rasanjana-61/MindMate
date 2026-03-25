import React, { useState, useEffect, useRef } from "react";
import { Send, X, Loader } from "lucide-react";
import {
  processMessage,
  getInitialMessage,
  saveChatbotData,
  CONVERSATION_STATES,
} from "../lib/preLoginChatbot";

export default function PreLoginChatbot({ isOpen = false, onClose, onComplete }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [quickReplies, setQuickReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentState, setCurrentState] = useState("welcome");
  const [collectedData, setCollectedData] = useState({});
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  // Initialize chat on open
  useEffect(() => {
    if (isOpen) {
      initializeChat();
    }
  }, [isOpen]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initializeChat = () => {
    setIsLoading(true);
    setError("");
    
    const initialMessage = getInitialMessage();
    setMessages([
      {
        type: "bot",
        text: initialMessage.text,
        timestamp: new Date(),
      },
    ]);
    setQuickReplies(initialMessage.quickReplies);
    setCurrentState("welcome");
    setCollectedData({});
    setIsLoading(false);
  };

  const handleSendMessage = async (message = inputValue) => {
    if (!message.trim()) return;

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text: message.trim(),
        timestamp: new Date(),
      },
    ]);
    setInputValue("");
    setIsLoading(true);
    setError("");

    try {
      // Process the message
      const result = processMessage(message, currentState, collectedData);

      if (!result.success) {
        // Validation error
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: result.error,
            timestamp: new Date(),
          },
        ]);
        setIsLoading(false);
        return;
      }

      // Update state
      setCurrentState(result.nextState);
      setCollectedData(result.collectedData);

      // Add bot response
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: result.botMessage,
          timestamp: new Date(),
        },
      ]);
      setQuickReplies(result.quickReplies);

      // If conversation completed, save and notify
      if (result.nextState === CONVERSATION_STATES.COMPLETED) {
        // Save to localStorage
        console.log('📝 Saving chatbot data to localStorage:', result.collectedData);
        saveChatbotData(result.collectedData);
        
        // Wait a moment then complete
        setTimeout(() => {
          console.log('✅ Calling onComplete with data:', result.collectedData);
          if (onComplete) onComplete(result.collectedData);
        }, 1500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (reply) => {
    handleSendMessage(reply);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">
              💬
            </div>
            <div>
              <h3 className="font-semibold text-lg">MindMate Guide</h3>
              <p className="text-xs text-blue-100">Get to know you better</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader className="animate-spin mx-auto mb-2 text-blue-600" size={32} />
                <p className="text-gray-500">Starting conversation...</p>
              </div>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-xs px-4 py-3 rounded-lg ${
                  msg.type === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.type === "user" ? "text-blue-100" : "text-gray-500"
                  }`}
                >
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 px-4 py-3 rounded-lg rounded-bl-none flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {quickReplies.length > 0 && !isLoading && (
          <div className="px-4 py-2 flex flex-wrap gap-2 border-t">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickReply(reply)}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-200 transition"
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-4 py-2 bg-red-50 border-t border-red-200">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        {/* Input Area */}
        {currentState !== "completed" && (
          <div className="border-t px-4 py-3 flex gap-2 bg-white rounded-b-2xl">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type your answer..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              <Send size={18} />
            </button>
          </div>
        )}

        {/* Completion Message */}
        {currentState === "completed" && (
          <div className="border-t px-4 py-4 bg-white rounded-b-2xl">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm"
            >
              Go to Register
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
