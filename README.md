# ⚡ CodeQuest — AI-Powered Coding Interview Platform

**A full-stack coding interview preparation platform** with 50+ DSA problems, AI-powered code review, mock interviews with resume-based question generation, real-time code execution, and an intelligent evaluation system.

> Built with **Next.js 14** + **Express.js** + **MongoDB** + **Google Gemini AI** — a production-ready platform for mastering coding interviews.

![Next.js](https://img.shields.io/badge/Frontend-Next.js_14-000000?style=flat-square&logo=next.js)
![Express](https://img.shields.io/badge/Backend-Express.js-000000?style=flat-square&logo=express)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248?style=flat-square&logo=mongodb)
![Gemini](https://img.shields.io/badge/AI-Google_Gemini-4285F4?style=flat-square&logo=google)
![Monaco](https://img.shields.io/badge/Editor-Monaco-007ACC?style=flat-square&logo=visual-studio-code)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

> **Developed by [Pranav Thanavel](https://github.com/pranav24547)**

---

## ✨ Features

### 🧩 Core Platform
- **Online Code Editor** — Monaco Editor with syntax highlighting, multi-language support (JavaScript, Python, C++, Java)
- **50 Coding Problems** — Curated DSA problems across Easy, Medium & Hard with test cases and hidden test cases
- **Real-time Code Execution** — Sandboxed execution with test case validation and output display
- **User Authentication** — JWT-based login/register with profile management and session handling

### 🤖 AI-Powered Intelligence
- **Solution Quality Review** — AI analyzes your code for correctness, complexity, and suggests improvements
- **Weak-Topic Detection** — Identifies topics you need to practice more based on submission history
- **Hint System** — AI provides contextual hints without spoiling solutions
- **Mistake Explanation** — AI explains what went wrong when tests fail with actionable feedback

### 🎤 Mock Interview Simulator
- **AI-Generated Questions** — Dynamic interview questions with timer and scoring
- **Resume-Based Filtering** — Upload your resume and get interview questions tailored to your skills and experience
- **Detailed Evaluation** — Correctness score, efficiency analysis, time/space complexity, strengths & weaknesses
- **Multi-level Fallback** — Dedicated AI evaluation → general review → client-side analysis for reliability

### 📊 Analytics & Rankings
- **Global Leaderboard** — Rankings with rating system based on problem difficulty and speed
- **Personal Dashboard** — Stats, topic strength bars, submission history, and progress tracking
- **Acceptance Rates** — Realistic acceptance percentages for each problem

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 14, React 18, Monaco Editor, CSS Modules, Recharts |
| **Backend** | Node.js, Express.js, JWT Authentication, bcrypt |
| **Database** | MongoDB Atlas (Mongoose ODM) |
| **AI Engine** | Google Gemini 1.5 Flash (Free Tier) |
| **Code Execution** | Node.js VM (Sandboxed) |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account ([Free Tier](https://www.mongodb.com/atlas)) or local MongoDB
- [Gemini API Key](https://aistudio.google.com/apikey) (free)

### 1. Clone & Setup
```bash
git clone https://github.com/pranav24547/Coding-Platform.git
cd "Coding Platform"
```

### 2. Backend Setup
```bash
cd server
npm install
cp ../.env.example .env
# Edit .env with your MongoDB URI and Gemini API key
node index.js
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

### 4. Seed Problems Database
```bash
# POST request to seed 50 coding problems
curl -X POST http://localhost:5000/api/problems/seed
```

### 5. Open the App
Visit **http://localhost:3000** 🚀

---

## 📁 Project Structure

```
Coding Platform/
├── client/                     # Next.js Frontend
│   └── src/
│       ├── app/
│       │   ├── page.js         # Landing page
│       │   ├── login/          # Login page
│       │   ├── register/       # Register page
│       │   ├── problems/       # Problem list + detail with editor
│       │   ├── dashboard/      # User stats & analytics
│       │   ├── leaderboard/    # Global rankings
│       │   └── mock-interview/ # AI mock interviews with resume upload
│       ├── components/         # Reusable components
│       └── lib/                # API client, auth context, code runner
│
├── server/                     # Express Backend
│   ├── models/                 # Mongoose schemas (User, Problem, etc.)
│   ├── routes/                 # API routes (auth, problems, AI, execute)
│   ├── services/               # AI service & execution engine
│   ├── middleware/              # Auth & error handling middleware
│   ├── data/                   # Seed data (50 problems)
│   └── index.js                # Server entry point
│
├── .env.example                # Environment template
└── README.md
```

---

## 🔑 Environment Variables

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/codequest

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Google Gemini AI
GEMINI_API_KEY=your-gemini-api-key

# Server
PORT=5000
CLIENT_URL=http://localhost:3000
```

---

## 🎯 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create account |
| `POST` | `/api/auth/login` | Sign in |
| `GET` | `/api/problems` | List problems (with filters) |
| `GET` | `/api/problems/:slug` | Get problem detail |
| `POST` | `/api/problems/seed` | Seed 50 problems |
| `POST` | `/api/submissions/submit` | Submit solution |
| `POST` | `/api/execute` | Execute code |
| `POST` | `/api/ai/review` | AI code review |
| `POST` | `/api/ai/hint` | Get contextual hint |
| `POST` | `/api/ai/mock-interview` | Generate interview question |
| `POST` | `/api/ai/mock-interview/resume` | Resume-based question generation |
| `POST` | `/api/ai/mock-interview/evaluate` | Evaluate interview answer |
| `GET` | `/api/leaderboard/global` | Global rankings |

---

## 📊 Problem Categories

| Difficulty | Count | Topics Covered |
|------------|-------|----------------|
| 🟢 **Easy** | 18 | Arrays, Strings, Linked Lists, Trees, Math, Hash Tables, Two Pointers |
| 🟡 **Medium** | 27 | Dynamic Programming, Graphs, Sliding Window, Sorting, Recursion, Stack, Greedy |
| 🔴 **Hard** | 5 | LRU Cache, Trapping Rain Water, Median of Two Sorted Arrays, Merge K Lists |

---

## �️ Screenshots

### Problems List
50 curated DSA problems with difficulty tags, topics, and acceptance rates.

### Code Editor
Monaco Editor with syntax highlighting, multiple language support, and real-time execution.

### Mock Interview
AI-generated questions with timer, resume upload, code submission, and detailed evaluation with scoring.

---

## �📄 License

MIT License — Built for learning and interview preparation. Feel free to use and modify.

---

## 👨‍💻 Author

**Pranav Thanavel** — [GitHub](https://github.com/pranav24547)

---

⭐ **If you find this project helpful, consider giving it a star on GitHub!**
