# SmartDoc Q&A & MCQ Exam Helper

SmartDoc Q&A is a full-stack AI-powered web application that allows users to upload documents (PDF, DOCX, TXT), extract their text, and interact with them in two ways:
1. **AI Chat**: Have a conversation with the document, asking questions where answers are strictly grounded in the document context.
2. **MCQ Exam**: Generate interactive multiple-choice quizzes based on the document's content with custom difficulty levels and question counts.

---

## Tech Stack

*   **Frontend**: React (Vite), Tailwind CSS v4, Axios, React Router, Lucide Icons
*   **Backend**: Django, Django REST Framework (DRF), SimpleJWT (Token Auth), SQLite
*   **AI Integration**: Google GenAI SDK (`gemini-2.5-flash` for chat/quiz generation, `text-embedding-004` for vector retrieval)

---

## Features

*   **Secure Authentication**: JWT-based user registration, login, and token refresh.
*   **Document Parsing & Churning**: Fast text extraction from PDF, DOCX, and TXT files with smart sliding-window chunking.
*   **Vector Search RAG**: Semantic similarity search of document chunks matching user queries for accurate grounded chat.
*   **Interactive Quiz Mode**: Customize exam difficulty (Easy, Medium, Hard) and size (5-30 questions).
*   **Anti-Cheat Guardrails**: Correct answers and explanations are hidden from client inspection and only sent upon answering.
*   **Quiz Dashboard**: Track quiz score percentage, elapsed time, and review detailed question-by-question correct/wrong explanations.

---

## Installation & Setup

### Prerequisites

*   Python 3.10+
*   Node.js 18+
*   A Gemini API Key (obtained from Google AI Studio)

### Step 1: Clone and Configure Environment

1.  Clone the repository and enter the project folder.
2.  Set up your environment variables:
    ```bash
    export GEMINI_API_KEY="your-gemini-api-key-here"
    ```

### Step 2: Backend Setup

1.  Navigate to the `backend` directory:
    ```bash
    cd backend
    ```
2.  Create and activate a virtual environment:
    ```bash
    python3 -m venv ../venv
    source ../venv/bin/activate
    ```
3.  Install dependencies:
    ```bash
    pip install -r ../requirements.txt
    ```
4.  Run migrations:
    ```bash
    python manage.py migrate
    ```
5.  Start the development server:
    ```bash
    python manage.py runserver
    ```
    The API will run on `http://127.0.0.1:8000/`.

### Step 3: Frontend Setup

1.  Open a new terminal session and navigate to the `frontend` directory:
    ```bash
    cd frontend
    ```
2.  Install packages:
    ```bash
    npm install
    ```
3.  Start the Vite development server:
    ```bash
    npm run dev
    ```
    The application will run on `http://localhost:5173/`.

---

## Running Tests

To run the automated Django test suite covering authentication, document parsing, embeddings similarity, chat generation, and quiz APIs:
```bash
cd backend
python manage.py test
```
