import React, { useState, useEffect, useRef } from "react";
import { Send, X, Loader } from "lucide-react";
import { startChatbot, sendMessage, endChatbot } from "../lib/chatService";
import chatbotIcon from "../assets/chatbot-icon.svg";

export default function Chatbot({ isOpen = true, onClose, onComplete }) {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [quickReplies, setQuickReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isChatStarted, setIsChatStarted] = useState(false);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  // Initialize chat on open
  useEffect(() => {
    if (isOpen && !isChatStarted) {
      initializeChat();
    }
  }, [isOpen, isChatStarted]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      setError("");
      const data = await startChatbot();
      
      setMessages([
        {
          type: "bot",
          text: data.message,
          timestamp: new Date(),
        },
      ]);
      setQuickReplies(data.quickReplies || []);
      setIsChatStarted(true);
    } catch (err) {
      setError(err.message);
      console.error("Failed to start chatbot:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (message = inputValue) => {
    if (!message.trim()) return;

    // Add user message to chat
    const userMessage = {
      type: "user",
      text: message.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);
    setError("");

    try {
      const data = await sendMessage(message);

      // Add bot response
      const botMessage = {
        type: "bot",
        text: data.message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
      setQuickReplies(data.quickReplies || []);

      // If conversation is completed
      if (data.isCompleted) {
        setIsChatStarted(false);
        await endChatbot();
        
        // Call onComplete callback after a brief delay
        setTimeout(() => {
          if (onComplete) onComplete();
        }, 1500);
      }
    } catch (err) {
      setError(err.message);
      console.error("Failed to send message:", err);
      
      // Add error message to chat
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: `Sorry, I encountered an error: ${err.message}. Please try again.`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickReply = (reply) => {
    handleSendMessage(reply);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-end z-50">
      {/* Chatbot Container */}
      <div className="w-full md:w-96 h-full md:h-[90vh] md:rounded-t-2xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#7BAE7F] to-[#4F7D5C] text-white px-6 py-4 rounded-t-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <img src={chatbotIcon} alt="MindMate" className="w-7 h-7" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">MindMate Guide</h3>
              <p className="text-xs" style={{ color: '#D4E8D5' }}>Let's complete your profile</p>
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
          {messages.length === 0 && !isChatStarted && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Loader className="animate-spin mx-auto mb-2" size={32} style={{ color: '#7BAE7F' }} />
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
                className={`max-w-[80%] px-4 py-3 rounded-lg ${
                  msg.type === "user"
                    ? "text-white rounded-br-none"
                    : "bg-gray-100 text-gray-800 rounded-bl-none"
                }`}
                style={{
                  backgroundColor: msg.type === "user" ? '#7BAE7F' : undefined
                }}
              >
                <p className="text-sm leading-relaxed">{msg.text}</p>
                <p
                  className={`text-xs mt-1 ${
                    msg.type === "user" ? "" : "text-gray-500"
                  }`}
                  style={{
                    color: msg.type === "user" ? '#D4E8D5' : undefined
                  }}
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
              <div className="bg-gray-100 px-4 py-3 rounded-lg rounded-bl-none flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies */}
        {quickReplies.length > 0 && !isLoading && (
          <div className="px-4 pb-2 flex flex-wrap gap-2">
            {quickReplies.map((reply, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickReply(reply)}
                className="px-3 py-2 rounded-full text-sm font-medium transition"
                style={{
                  backgroundColor: '#E8F3E9',
                  color: '#7BAE7F'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#D4E8D5'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#E8F3E9'}
              >
                {reply}
              </button>
            ))}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="px-4 pb-2 bg-red-50 border-l-4 border-red-500">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Input Area */}
        {isChatStarted && (
          <div className="border-t px-4 py-3 flex gap-2">
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
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 disabled:bg-gray-100"
              onFocus={(e) => {
                e.target.style.borderColor = '#7BAE7F';
                e.target.style.boxShadow = '0 0 0 2px rgba(123, 174, 127, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputValue.trim()}
              className="p-2 text-white rounded-lg transition"
              style={{
                backgroundColor: isLoading || !inputValue.trim() ? '#d1d5db' : '#7BAE7F'
              }}
              onMouseEnter={(e) => {
                if (!isLoading && inputValue.trim()) {
                  e.target.style.backgroundColor = '#4F7D5C';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLoading && inputValue.trim()) {
                  e.target.style.backgroundColor = '#7BAE7F';
                }
              }}
            >
              <Send size={20} />
            </button>
          </div>
        )}

        {/* Completion Message */}
        {!isChatStarted && messages.length > 0 && (
          <div className="border-t px-4 py-4">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 text-white rounded-lg transition font-medium"
              style={{ backgroundColor: '#7BAE7F' }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#4F7D5C'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#7BAE7F'}
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
