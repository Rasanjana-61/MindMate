/**
 * Pre-login chatbot service
 * Allows users to chat before authentication
 */

export const CONVERSATION_STATES = {
  WELCOME: "welcome",
  COLLECTING_STUDENT_ID: "collecting_student_id",
  COLLECTING_UNIVERSITY_MAIL: "collecting_university_mail",
  COLLECTING_FACULTY: "collecting_faculty",
  COLLECTING_YEAR: "collecting_year",
  COLLECTING_SEMESTER: "collecting_semester",
  COLLECTING_FULL_NAME: "collecting_full_name",
  COLLECTING_BIO: "collecting_bio",
  COMPLETED: "completed",
};

const FACULTIES = ["FOC", "FOB", "FOE", "FAS", "FOL"];
const YEARS = ["Year 1", "Year 2", "Year 3", "Year 4"];
const SEMESTERS = ["Semester 1", "Semester 2"];

// Bot messages for each state
const BOT_MESSAGES = {
  [CONVERSATION_STATES.WELCOME]: {
    text: "Hi there! 👋 Welcome to MindMate! I'm here to help you get started. Before you register, let me learn a bit about you so we can personalize your experience.",
    quickReplies: ["Let's begin!", "Tell me more"],
  },
  [CONVERSATION_STATES.COLLECTING_STUDENT_ID]: {
    text: "What's your student ID? (Usually 10 characters)",
    quickReplies: ["Skip for now"],
  },
  [CONVERSATION_STATES.COLLECTING_UNIVERSITY_MAIL]: {
    text: "What's your university email address?",
    quickReplies: ["Skip for now"],
  },
  [CONVERSATION_STATES.COLLECTING_FACULTY]: {
    text: `Great! Which faculty are you in?\n\nOptions: ${FACULTIES.join(", ")}`,
    quickReplies: FACULTIES,
  },
  [CONVERSATION_STATES.COLLECTING_YEAR]: {
    text: `Perfect! What year are you in?\n\nOptions: ${YEARS.join(", ")}`,
    quickReplies: YEARS,
  },
  [CONVERSATION_STATES.COLLECTING_SEMESTER]: {
    text: `Excellent! Which semester are you currently in?\n\nOptions: ${SEMESTERS.join(", ")}`,
    quickReplies: SEMESTERS,
  },
  [CONVERSATION_STATES.COLLECTING_FULL_NAME]: {
    text: "What's your full name? (This helps personalize your experience)",
    quickReplies: ["Skip for now"],
  },
  [CONVERSATION_STATES.COLLECTING_BIO]: {
    text: "Tell us a bit about yourself in 1-2 sentences (optional)",
    quickReplies: ["Skip for now"],
  },
  [CONVERSATION_STATES.COMPLETED]: {
    text: "🎉 Great! I've saved your preferences. Now let's get you registered!",
    quickReplies: ["Go to Register"],
  },
};

/**
 * Process user message and return next state
 */
export function processMessage(userMessage, currentState, collectedData = {}) {
  const message = userMessage.trim().toLowerCase();
  let nextState = currentState;
  let updatedData = { ...collectedData };
  let isValid = true;
  let errorMessage = "";

  switch (currentState) {
    case CONVERSATION_STATES.WELCOME:
      nextState = CONVERSATION_STATES.COLLECTING_STUDENT_ID;
      break;

    case CONVERSATION_STATES.COLLECTING_STUDENT_ID:
      if (message !== "skip for now") {
        if (userMessage.trim().length !== 10) {
          isValid = false;
          errorMessage = "Student ID must be exactly 10 characters";
        } else {
          updatedData.studentId = userMessage.trim().toUpperCase();
          console.log('✓ Student ID collected:', updatedData.studentId);
          nextState = CONVERSATION_STATES.COLLECTING_UNIVERSITY_MAIL;
        }
      } else {
        console.log('⊘ Student ID skipped');
        nextState = CONVERSATION_STATES.COLLECTING_UNIVERSITY_MAIL;
      }
      break;

    case CONVERSATION_STATES.COLLECTING_UNIVERSITY_MAIL:
      if (message !== "skip for now") {
        // Simple email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(userMessage.trim())) {
          isValid = false;
          errorMessage = "Please enter a valid email address";
        } else {
          updatedData.universityMail = userMessage.trim().toLowerCase();
          nextState = CONVERSATION_STATES.COLLECTING_FACULTY;
        }
      } else {
        nextState = CONVERSATION_STATES.COLLECTING_FACULTY;
      }
      break;

    case CONVERSATION_STATES.COLLECTING_FACULTY:
      const facultyMatch = FACULTIES.find((f) => f.toLowerCase() === message);
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
      const semesterMatch = SEMESTERS.find((s) => s.toLowerCase() === message);
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
        if (userMessage.trim().length < 2) {
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

  if (!isValid) {
    return {
      success: false,
      error: errorMessage,
      nextState: currentState,
      collectedData: updatedData,
    };
  }

  const botMessage = BOT_MESSAGES[nextState];

  return {
    success: true,
    nextState,
    botMessage: botMessage.text,
    quickReplies: botMessage.quickReplies || [],
    collectedData: updatedData,
  };
}

/**
 * Get initial bot message
 */
export function getInitialMessage() {
  return {
    text: BOT_MESSAGES[CONVERSATION_STATES.WELCOME].text,
    quickReplies: BOT_MESSAGES[CONVERSATION_STATES.WELCOME].quickReplies,
  };
}

/**
 * Save chatbot data to localStorage
 */
export function saveChatbotData(data) {
  localStorage.setItem("chatbotData", JSON.stringify(data));
}

/**
 * Get chatbot data from localStorage
 */
export function getChatbotData() {
  const data = localStorage.getItem("chatbotData");
  return data ? JSON.parse(data) : null;
}

/**
 * Clear chatbot data from localStorage
 */
export function clearChatbotData() {
  localStorage.removeItem("chatbotData");
}
