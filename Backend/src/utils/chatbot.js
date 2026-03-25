/**
 * Chatbot conversation flow for onboarding
 * Guides users through profile completion after registration
 */

const { User, FACULTIES, YEARS, SEMESTERS } = require("../models/User");

// Conversation states
const CONVERSATION_STATES = {
  WELCOME: "welcome",
  COLLECTING_FACULTY: "collecting_faculty",
  COLLECTING_YEAR: "collecting_year",
  COLLECTING_SEMESTER: "collecting_semester",
  COLLECTING_FULL_NAME: "collecting_full_name",
  COLLECTING_BIO: "collecting_bio",
  COMPLETED: "completed",
};

/**
 * Get next chatbot message based on conversation state
 */
function getBotMessage(state, userData = {}) {
  const messages = {
    [CONVERSATION_STATES.WELCOME]: {
      text: "Hi there! 👋 Welcome to MindMate! I'm here to help you complete your profile. Let's get started with a few quick questions.",
      quickReplies: ["Let's go!", "Tell me more"],
    },
    [CONVERSATION_STATES.COLLECTING_FACULTY]: {
      text: `Great! Let's start with your faculty. Which one are you in?\n\nOptions: ${FACULTIES.join(", ")}`,
      quickReplies: FACULTIES,
    },
    [CONVERSATION_STATES.COLLECTING_YEAR]: {
      text: `Perfect! Now, what year are you in?\n\nOptions: ${YEARS.join(", ")}`,
      quickReplies: YEARS,
    },
    [CONVERSATION_STATES.COLLECTING_SEMESTER]: {
      text: `Almost there! Which semester are you currently in?\n\nOptions: ${SEMESTERS.join(", ")}`,
      quickReplies: SEMESTERS,
    },
    [CONVERSATION_STATES.COLLECTING_FULL_NAME]: {
      text: "Great! What's your full name? (This helps personalize your experience)",
      quickReplies: ["Skip for now"],
    },
    [CONVERSATION_STATES.COLLECTING_BIO]: {
      text: "Would you like to add a short bio? Tell us a bit about yourself in 1-2 sentences (optional)",
      quickReplies: ["Skip for now"],
    },
    [CONVERSATION_STATES.COMPLETED]: {
      text: `🎉 Awesome! Your profile is all set, ${userData.fullName || "Student"}! You're ready to explore MindMate and start your wellness journey.`,
      quickReplies: ["Go to Dashboard"],
    },
  };

  return messages[state] || { text: "How can I help you?", quickReplies: [] };
}

/**
 * Process user input and return next state and bot response
 */
async function processUserMessage(userId, userMessage, currentState, collectedData = {}) {
  const message = userMessage.trim().toLowerCase();

  // Validate user exists
  const user = await User.findById(userId);
  if (!user) {
    return {
      success: false,
      error: "User not found",
      nextState: currentState,
    };
  }

  let nextState = currentState;
  let updatedData = { ...collectedData };
  let isValid = true;
  let errorMessage = "";

  // Process based on current state
  switch (currentState) {
    case CONVERSATION_STATES.WELCOME:
      nextState = CONVERSATION_STATES.COLLECTING_FACULTY;
      break;

    case CONVERSATION_STATES.COLLECTING_FACULTY:
      const facultyMatch = FACULTIES.find(
        (f) => f.toLowerCase() === message
      );
      if (facultyMatch) {
        updatedData.faculty = facultyMatch;
        nextState = CONVERSATION_STATES.COLLECTING_YEAR;
      } else {
        isValid = false;
        errorMessage = `Please select a valid faculty: ${FACULTIES.join(", ")}`;
      }
      break;

    case CONVERSATION_STATES.COLLECTING_YEAR:
      const yearMatch = YEARS.find((y) => y.toLowerCase() === message);
      if (yearMatch) {
        updatedData.year = yearMatch;
        nextState = CONVERSATION_STATES.COLLECTING_SEMESTER;
      } else {
        isValid = false;
        errorMessage = `Please select a valid year: ${YEARS.join(", ")}`;
      }
      break;

    case CONVERSATION_STATES.COLLECTING_SEMESTER:
      const semesterMatch = SEMESTERS.find(
        (s) => s.toLowerCase() === message
      );
      if (semesterMatch) {
        updatedData.semester = semesterMatch;
        nextState = CONVERSATION_STATES.COLLECTING_FULL_NAME;
      } else {
        isValid = false;
        errorMessage = `Please select a valid semester: ${SEMESTERS.join(", ")}`;
      }
      break;

    case CONVERSATION_STATES.COLLECTING_FULL_NAME:
      if (message !== "skip for now") {
        if (message.length < 2) {
          isValid = false;
          errorMessage = "Please enter a valid name";
        } else {
          updatedData.fullName = userMessage.trim();
          nextState = CONVERSATION_STATES.COLLECTING_BIO;
        }
      } else {
        nextState = CONVERSATION_STATES.COLLECTING_BIO;
      }
      break;

    case CONVERSATION_STATES.COLLECTING_BIO:
      if (message !== "skip for now") {
        if (userMessage.length > 300) {
          isValid = false;
          errorMessage = "Bio should be 300 characters or less";
        } else {
          updatedData.bio = userMessage.trim();
        }
      }
      nextState = CONVERSATION_STATES.COMPLETED;
      break;

    default:
      nextState = CONVERSATION_STATES.WELCOME;
  }

  // If validation failed, keep the same state
  if (!isValid) {
    return {
      success: false,
      error: errorMessage,
      nextState: currentState,
      collectedData: updatedData,
    };
  }

  // If we've completed the conversation, update the user in the database
  if (nextState === CONVERSATION_STATES.COMPLETED) {
    try {
      const updateData = {};
      if (updatedData.faculty) updateData.faculty = updatedData.faculty;
      if (updatedData.year) updateData.year = updatedData.year;
      if (updatedData.semester) updateData.semester = updatedData.semester;
      if (updatedData.fullName) updateData.fullName = updatedData.fullName;
      if (updatedData.bio) updateData.bio = updatedData.bio;

      Object.assign(user, updateData);
      await user.save();
    } catch (error) {
      console.error("Error updating user profile:", error);
      return {
        success: false,
        error: "Failed to save profile",
        nextState: currentState,
      };
    }
  }

  // Get next bot message
  const botResponse = getBotMessage(nextState, updatedData);

  return {
    success: true,
    nextState,
    botResponse,
    collectedData: updatedData,
  };
}

/**
 * Get initial welcome message for new conversation
 */
function getInitialMessage() {
  return getBotMessage(CONVERSATION_STATES.WELCOME);
}

module.exports = {
  CONVERSATION_STATES,
  getBotMessage,
  processUserMessage,
  getInitialMessage,
};
