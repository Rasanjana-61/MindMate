# 🧠 MindMate

> An AI-powered Mental Health Support Platform designed to provide emotional assistance, mental wellness tracking, and personalized guidance through intelligent conversations.

![GitHub stars](https://img.shields.io/github/stars/Rasanjana-61/MindMate?style=social)
![GitHub forks](https://img.shields.io/github/forks/Rasanjana-61/MindMate?style=social)
![License](https://img.shields.io/badge/license-MIT-blue)

---

## 📖 Overview

MindMate is a modern mental health assistance platform that helps users manage their emotional well-being through AI-powered conversations, mood tracking, and personalized recommendations.

The platform provides a safe and user-friendly environment where users can interact with an intelligent chatbot, monitor their mental health progress, and access wellness resources.

---

## ✨ Features

### 🤖 AI Mental Health Assistant

* AI-powered chatbot support
* Personalized mental wellness guidance
* Context-aware conversations
* Emotional support responses

### 😊 Mood Tracking

* Daily mood recording
* Mood history visualization
* Progress monitoring
* Mental wellness insights

### 📊 Analytics Dashboard

* User mood statistics
* Emotional trend analysis
* Mental health reports
* Visual charts and graphs

### 🔐 Authentication & Security

* User registration
* Secure login system
* Protected routes
* User profile management

### 📱 Responsive Design

* Mobile-friendly interface
* Tablet support
* Desktop optimized
* Modern UI/UX experience

---

## 🏗️ System Architecture

```text
┌─────────────┐
│  Frontend   │
│   ReactJS   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Backend   │
│ Node/Express│
└──────┬──────┘
       │
 ┌─────┴─────┐
 ▼           ▼
MongoDB    AI Service
Database   (Gemini/OpenAI)
```

---

## 🛠️ Tech Stack

### Frontend

* React.js
* JavaScript
* HTML5
* CSS3
* Tailwind CSS
* Axios

### Backend

* Node.js
* Express.js
* REST API

### Database

* MongoDB

### Authentication

* JWT Authentication
* Firebase Authentication (if applicable)

### AI Integration

* Google Gemini API
* OpenAI API (if applicable)

### Deployment

* Vercel
* Render
* MongoDB Atlas

---

## 📂 Project Structure

```bash
MindMate/
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── assets/
│   │   └── App.js
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── models/
│   ├── middleware/
│   ├── config/
│   └── server.js
│
├── screenshots/
├── README.md
└── package.json
```

---

## 🚀 Installation Guide

### Prerequisites

Make sure you have installed:

* Node.js
* npm
* MongoDB
* Git

---

### 1️⃣ Clone Repository

```bash
git clone https://github.com/Rasanjana-61/MindMate.git

cd MindMate
```

---

### 2️⃣ Install Frontend Dependencies

```bash
cd frontend

npm install
```

---

### 3️⃣ Install Backend Dependencies

```bash
cd backend

npm install
```

---

### 4️⃣ Configure Environment Variables

Create a `.env` file inside the backend folder.

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

GEMINI_API_KEY=your_gemini_api_key
```

---

### 5️⃣ Run Backend

```bash
npm run dev
```

or

```bash
npm start
```

---

### 6️⃣ Run Frontend

```bash
npm start
```

---

## 🌐 API Endpoints

### Authentication

```http
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
```

### Mood Tracking

```http
POST /api/mood/add
GET  /api/mood/history
DELETE /api/mood/delete/:id
```

### AI Chat

```http
POST /api/chat/message
GET  /api/chat/history
```

---

## 📸 Screenshots

### 🏠 Home Page

Add screenshot here:

```markdown
![Home Page](screenshots/home.png)
```

### 🤖 AI Chat

```markdown
![AI Chat](screenshots/chat.png)
```

### 📊 Dashboard

```markdown
![Dashboard](screenshots/dashboard.png)
```

---

## 🔮 Future Improvements

* Voice-based AI assistant
* Real-time emotion detection
* Video counseling integration
* Mental health assessment tests
* Appointment booking system
* Multi-language support
* Push notifications

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repository
2. Create your feature branch

```bash
git checkout -b feature/NewFeature
```

3. Commit your changes

```bash
git commit -m "Add new feature"
```

4. Push to branch

```bash
git push origin feature/NewFeature
```

5. Open a Pull Request

---

## 📝 License

This project is licensed under the MIT License.

---

GitHub: https://github.com/Rasanjana-61

---

## ⭐ Support

If you like this project:

⭐ Star the repository

🍴 Fork the repository

📢 Share with others

---

### 💙 "Your Mental Health Matters"

MindMate is built to support emotional well-being through technology and make mental health assistance more accessible for everyone.
