const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const {
  CONVERSATION_STATES,
  processUserMessage,
  getInitialMessage,
} = require("../utils/chatbot");

const router = express.Router();

// Store active conversations in memory (in production, use Redis or DB)
const conversations = new Map();

/**
 * Start a new chatbot conversation
 */
router.post("/start", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Initialize or get existing conversation
    if (!conversations.has(userId)) {
      conversations.set(userId, {
        userId,
        state: CONVERSATION_STATES.WELCOME,
        collectedData: {},
        messages: [],
        startedAt: new Date(),
      });
    }

    const conversation = conversations.get(userId);
    const initialMessage = getInitialMessage();

    // Add bot message to history
    conversation.messages.push({
      type: "bot",
      text: initialMessage.text,
      timestamp: new Date(),
    });

    return res.json({
      success: true,
      message: initialMessage.text,
      quickReplies: initialMessage.quickReplies,
      state: conversation.state,
    });
  } catch (error) {
    console.error("Error starting chatbot conversation:", error);
    return res.status(500).json({
      success: false,
      message: "Error starting conversation",
    });
  }
});

/**
 * Send a message and get chatbot response
 */
router.post("/message", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    // Get or initialize conversation
    if (!conversations.has(userId)) {
      return res.status(400).json({
        success: false,
        message: "No active conversation. Start a new one first.",
      });
    }

    const conversation = conversations.get(userId);

    // Add user message to history
    conversation.messages.push({
      type: "user",
      text: message.trim(),
      timestamp: new Date(),
    });

    // Process the message
    const result = await processUserMessage(
      userId,
      message,
      conversation.state,
      conversation.collectedData
    );

    if (!result.success) {
      // Invalid input, return error but keep same state
      conversation.messages.push({
        type: "bot",
        text: result.error,
        timestamp: new Date(),
      });

      return res.json({
        success: false,
        message: result.error,
        state: conversation.state,
      });
    }

    // Update conversation state and data
    conversation.state = result.nextState;
    conversation.collectedData = result.collectedData;

    // Add bot response to history
    conversation.messages.push({
      type: "bot",
      text: result.botResponse.text,
      timestamp: new Date(),
    });

    const isCompleted = result.nextState === CONVERSATION_STATES.COMPLETED;

    const response = {
      success: true,
      message: result.botResponse.text,
      quickReplies: result.botResponse.quickReplies,
      state: result.nextState,
      isCompleted,
    };

    // If conversation is completed, clean up
    if (isCompleted) {
      setTimeout(() => {
        conversations.delete(userId);
      }, 5000); // Keep for 5 seconds for UI to finish
    }

    return res.json(response);
  } catch (error) {
    console.error("Error processing chatbot message:", error);
    return res.status(500).json({
      success: false,
      message: "Error processing message",
    });
  }
});

/**
 * Get conversation history
 */
router.get("/history", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    const conversation = conversations.get(userId);

    if (!conversation) {
      return res.json({
        success: true,
        messages: [],
      });
    }

    return res.json({
      success: true,
      messages: conversation.messages,
      state: conversation.state,
      collectedData: conversation.collectedData,
    });
  } catch (error) {
    console.error("Error fetching conversation history:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching history",
    });
  }
});

/**
 * End conversation and clean up
 */
router.post("/end", protect, async (req, res) => {
  try {
    const userId = req.user.id;
    conversations.delete(userId);

    return res.json({
      success: true,
      message: "Conversation ended",
    });
  } catch (error) {
    console.error("Error ending chatbot conversation:", error);
    return res.status(500).json({
      success: false,
      message: "Error ending conversation",
    });
  }
});

module.exports = router;
