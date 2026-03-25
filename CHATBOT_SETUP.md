# Chatbot Onboarding System - Implementation Guide

## Overview
The chatbot system enables an interactive conversational flow that guides users through profile completion immediately after registration.

## Architecture

### Backend Components

#### 1. **utils/chatbot.js** - Conversation Logic
Manages the chatbot conversation flow with the following states:
- `WELCOME` - Initial greeting and introduction
- `COLLECTING_FACULTY` - Asks for faculty selection
- `COLLECTING_YEAR` - Asks for academic year
- `COLLECTING_SEMESTER` - Asks for semester
- `COLLECTING_FULL_NAME` - Optional: Asks for full name
- `COLLECTING_BIO` - Optional: Asks for bio
- `COMPLETED` - Conversation finished

**Key Functions:**
- `getBotMessage(state, userData)` - Returns the bot's message for a given state
- `processUserMessage(userId, userMessage, currentState, collectedData)` - Processes user input and validates it
- `getInitialMessage()` - Gets the initial welcome message

#### 2. **routes/chatbotRoutes.js** - API Endpoints
Provides REST endpoints for the chatbot:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chatbot/start` | POST | Initialize a new chat conversation |
| `/api/chatbot/message` | POST | Send a user message and get bot response |
| `/api/chatbot/history` | GET | Retrieve message history |
| `/api/chatbot/end` | POST | End the conversation |

**Request/Response Format:**

```javascript
// Start conversation
POST /api/chatbot/start
Response: {
  success: true,
  message: "Welcome message...",
  quickReplies: ["Reply 1", "Reply 2"],
  state: "welcome"
}

// Send message
POST /api/chatbot/message
Body: { message: "User's response" }
Response: {
  success: true,
  message: "Bot response...",
  quickReplies: ["Option 1", "Option 2"],
  state: "next_state",
  isCompleted: false
}
```

### Frontend Components

#### 1. **lib/chatService.js** - API Service
Client-side service for communicating with the chatbot backend:
- `startChatbot()` - Initialize conversation
- `sendMessage(message)` - Send user message
- `getChatHistory()` - Fetch message history
- `endChatbot()` - Close conversation

#### 2. **components/Chatbot.jsx** - UI Component
Beautiful, interactive chatbot interface with:
- Real-time message display
- Quick reply buttons
- Typing indicators
- Auto-scroll to latest messages
- Error handling and display
- Loading states
- Smooth animations

**Props:**
```javascript
<Chatbot 
  isOpen={boolean}           // Controls visibility
  onClose={function}         // Called when user closes chatbot
  onComplete={function}      // Called when conversation completes
/>
```

#### 3. **pages/Register.jsx** - Integration
Modified to show the chatbot after successful registration:
1. User completes registration form
2. On success, chatbot is displayed
3. User completes chatbot conversation
4. User is redirected to login/dashboard

## Flow Diagram

```
User Registers 
    ↓
Registration Successful
    ↓
Chatbot Appears (Welcome Message)
    ↓
User Answers Questions:
  • Faculty
  • Year
  • Semester
  • Name (optional)
  • Bio (optional)
    ↓
Data Saved to User Profile
    ↓
Chatbot Completes
    ↓
User Redirected to Dashboard/Login
```

## User Profile Data Collection

The chatbot collects (and updates the database with) the following user fields:

| Field | Type | Required | Source |
|-------|------|----------|--------|
| faculty | String | Yes | Dropdown question |
| year | String | Yes | Dropdown question |
| semester | String | Yes | Dropdown question |
| fullName | String | No | Text input (optional) |
| bio | String | No | Text input (optional) |

## Conversation Example

```
Bot: "Hi there! 👋 Welcome to MindMate! I'm here to help you complete your profile..."
User: "Let's go!"

Bot: "Great! Let's start with your faculty. Which one are you in? Options: FOC, FOB, FOE, FAS, FOL"
User: "FOC"

Bot: "Perfect! Now, what year are you in? Options: Year 1, Year 2, Year 3, Year 4"
User: "Year 2"

Bot: "Almost there! Which semester are you currently in? Options: Semester 1, Semester 2"
User: "Semester 1"

Bot: "Great! What's your full name? (This helps personalize your experience)"
User: "John Doe"

Bot: "Would you like to add a short bio? Tell us a bit about yourself in 1-2 sentences (optional)"
User: "I'm passionate about technology and learning"

Bot: "🎉 Awesome! Your profile is all set, John! You're ready to explore MindMate..."
```

## Validation Rules

### Faculty
- Must be one of: FOC, FOB, FOE, FAS, FOL
- Case-insensitive matching

### Year
- Must be one of: Year 1, Year 2, Year 3, Year 4
- Case-insensitive matching

### Semester
- Must be one of: Semester 1, Semester 2
- Case-insensitive matching

### Full Name
- Minimum 2 characters
- Trimmed of whitespace

### Bio
- Maximum 300 characters
- Optional field

## Error Handling

If a user provides invalid input:
1. Error message is returned
2. Conversation state remains the same
3. User is prompted to try again
4. No data is updated

Example:
```javascript
{
  success: false,
  error: "Please select a valid faculty: FOC, FOB, FOE, FAS, FOL",
  nextState: "collecting_faculty"  // Same state, try again
}
```

## State Management

Conversations are stored in memory during active sessions with the following structure:

```javascript
{
  userId: "user_id_string",
  state: "current_state",
  collectedData: {
    faculty: "FOC",
    year: "Year 2",
    semester: "Semester 1",
    fullName: "John Doe",
    bio: "..."
  },
  messages: [
    { type: "bot", text: "...", timestamp: Date },
    { type: "user", text: "...", timestamp: Date }
  ],
  startedAt: Date
}
```

## Implementation Checklist

- [x] Backend chatbot logic (utils/chatbot.js)
- [x] API routes (routes/chatbotRoutes.js)
- [x] Server integration (server.js)
- [x] Frontend chat service (lib/chatService.js)
- [x] Chatbot UI component (components/Chatbot.jsx)
- [x] Register page integration (pages/Register.jsx)

## Security Features

✅ **Authentication Protected**: All endpoints require JWT token
✅ **Input Validation**: Strict validation of user inputs against predefined options
✅ **Server-side Processing**: All logic happens on backend, not client-side
✅ **Database Storage**: Profile updates are saved to MongoDB
✅ **Session Isolation**: Each user has isolated conversation state

## Testing the Feature

1. **Start the backend server:**
   ```bash
   cd Backend
   npm run dev
   ```

2. **Start the frontend server:**
   ```bash
   cd Frontend
   npm run dev
   ```

3. **Register a new account:**
   - Go to Register page
   - Fill in all required fields
   - Click "Create Account"

4. **Complete the chatbot:**
   - The chatbot should automatically appear
   - Answer the questions conversationally
   - Verify that data is saved to your profile

## Future Enhancements

Potential improvements:
- [ ] Persist conversations to database for analytics
- [ ] Add conversation sentiment analysis
- [ ] Integrate with AI/ML for response generation
- [ ] Add keyboard shortcuts for quick replies
- [ ] Multi-language support
- [ ] Chatbot analytics dashboard
- [ ] Advanced error recovery
- [ ] Context-aware follow-up questions

## API Response Examples

### Successful Message Processing
```json
{
  "success": true,
  "message": "Perfect! Now, what year are you in?",
  "quickReplies": ["Year 1", "Year 2", "Year 3", "Year 4"],
  "state": "collecting_year",
  "isCompleted": false
}
```

### Validation Error
```json
{
  "success": false,
  "message": "Please select a valid faculty: FOC, FOB, FOE, FAS, FOL",
  "state": "collecting_faculty"
}
```

### Conversation Complete
```json
{
  "success": true,
  "message": "🎉 Awesome! Your profile is all set!",
  "quickReplies": ["Go to Dashboard"],
  "state": "completed",
  "isCompleted": true
}
```

## Troubleshooting

### Chatbot doesn't appear after registration
- Check browser console for errors
- Verify backend is running on http://localhost:5000
- Check backend logs for API errors
- Ensure JWT token is being properly sent

### Messages not sending
- Check network tab for failed requests
- Verify `/api/chatbot/message` endpoint exists
- Check backend authentication middleware
- Look for error messages in browser console

### Profile not updating
- Check if conversation reaches "completed" state
- Verify MongoDB connection
- Check backend logs for save errors
- Ensure user data is being collected properly

## Contact & Support

For issues or questions about the chatbot system, please refer to the backend logging or check the component code for detailed comments.
