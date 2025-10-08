# 🎓 AI-Powered Quiz Dashboard

A modern, feature-rich quiz application with AI-powered quiz generation from PDF documents using Google's Gemini AI.

## ✨ Features

### 🏠 Home Dashboard
- Clean, modern interface with light and dark modes.
- Easy navigation between quiz and admin sections.
- A quick guide for new users.

### 📖 Quiz Taking
- **Interactive Quiz Interface**:
  - Progress tracking for questions.
  - **Instant Feedback**: Click an answer to see if you're right or wrong immediately.
  - **Detailed Explanations**: After answering, view explanations for all four options to understand the reasoning.
  - **Hint System**: Get a helpful hint for each question.
  - Smooth animations and a user-friendly design.

### ⚙️ Admin Panel (Open Access in Demo)
No password is required in this demo build (previous password gating was removed for simplicity). Two methods to create quizzes:

#### 🤖 AI-Powered Generation
- **Upload PDF Documents**: Drag-and-drop or click to upload.
- **Customizable Quiz Length**: Choose how many questions to generate.
- **Automatic Quiz Generation**: Uses Google Gemini AI to create questions with:
  - Four multiple-choice options.
  - A correct answer marked.
  - A helpful hint.
  - A unique explanation for each of the four options.
- **On-Page Status**: Get real-time feedback on the generation process without disruptive popups.

#### ✍️ Manual JSON Entry
- Add questions in bulk using a specific JSON format.
- Collapsible instructions with a clear format guide.
- Real-time validation and status messages.

## 🚀 Getting Started

### 1. Setup
- Simply open `index.html` in your web browser. No installation is required!

### 2. Taking a Quiz
1. Click **"Take Quiz"** from the home page.
2. Read the question and consider the options.
3. Click on your chosen answer to see if it's correct.
4. Review the explanations provided for all options.
5. Click **"Next Question"** to continue.
6. At the end, view your final score and have the option to generate more questions from the same PDF if one was used.

### 3. Admin - AI Generation
1. Navigate to the **"Admin Panel"** (no password required in this demo).
2. Select the **"AI Generation"** tab.
3. **Get your Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey).
   - Create and copy your free API key.
4. Paste your API key into the designated field.
5. Upload a PDF document.
6. Set the desired number of questions.
7. Click **"Generate Quiz with AI"**.
8. The quiz will be generated and saved. You can then take it from the "Take Quiz" view.

### 4. Admin - Manual Entry
1. Go to the **"Admin Panel"** (no password required).
2. Select the **"Manual Entry"** tab.
3. Click **"Show Instructions"** to see the required JSON format.
4. Paste your JSON array into the text area.
5. Click **"Save Questions"**.

## 📝 JSON Format

The JSON must be an array of question objects. Each option within a question must have its own explanation.

```json
[
  {
    "question": "What is the capital of France?",
    "hint": "It's a famous European city known for art and romance.",
    "options": [
      {
        "text": "London",
        "correct": false,
        "explanation": "London is the capital of the United Kingdom, not France."
      },
      {
        "text": "Paris",
        "correct": true,
        "explanation": "Correct! Paris is the capital and most populous city of France."
      },
      {
        "text": "Berlin",
        "correct": false,
        "explanation": "Berlin is the capital of Germany."
      },
      {
        "text": "Madrid",
        "correct": false,
        "explanation": "Madrid is the capital of Spain."
      }
    ]
  }
]
```

### Required Fields:
- `question` (string): The question text.
- `hint` (string): A hint for the user.
- `options` (array of 4 objects): The answer choices.
  - `text` (string): The option's text.
  - `correct` (boolean): `true` for the correct answer, `false` otherwise.
  - `explanation` (string): An explanation specific to that option.

  - `correct`: Boolean - Only ONE should be true
- `hint`: String (optional) - A helpful hint
- `explanation`: String (optional) - Explanation of the correct answer

## 🎨 Features in Detail

### Hint System
- Click the 💡 button to toggle hints
- Hints provide guidance without revealing the answer
- Can be shown/hidden at any time

### Explanation System
- Automatic feedback after submitting an answer
- ✅ Green box for correct answers
- ❌ Red box for incorrect answers
- One-sentence explanation of why the answer is correct

### AI Generation
- Uses Google Gemini API (multi-model fallback sequence: 2.5 Pro → 1.5 Pro → 1.5 Flash → 1.5 Flash 8B)
- Analyzes PDF content intelligently
- Generates diverse, non-overlapping questions (regeneration enforces novelty)
- Automatically adds hints and explanations (or fills defaults)
- Robust JSON handling: repairs malformed output, salvages valid objects, and supplements missing questions
- Attempts supplemental batches until the exact requested count is reached; does not save partial sets

### Score Display
- Shows correct/incorrect count
- Displays percentage score
- Color-coded performance:
  - 🏆 90%+ - Outstanding!
  - 🌟 70-89% - Excellent!
  - 👍 50-69% - Good effort!
  - 📚 Below 50% - Keep practicing!

## 🔒 Security Notes

- Demo build: admin panel is open (no password). In production add real auth.
- API keys are kept client-side only for requests directly to Gemini.
- No server stores your data; quiz data lives in `localStorage`.

## 💡 Tips

1. **For Best Results with AI**:
   - Upload clear, well-formatted PDFs
   - PDFs with 10-50 pages work best
   - Educational content generates better questions
   
2. **For Manual Entry**:
   - Use the "Show Instructions" button
   - Copy the example template
   - Validate JSON before pasting (use jsonlint.com)
   - Include hints and explanations for better learning

3. **Taking Quizzes**:
   - Use hints strategically
   - Read explanations carefully
   - Retake quizzes to improve scores

## 🛠️ Technology Stack

- HTML5
- CSS3 (Modern gradients, animations, flexbox)
- JavaScript (ES6+)
- PDF.js (PDF parsing)
- Google Gemini AI API
- LocalStorage (for data persistence)

## 📱 Responsive Design

- Works on desktop, tablet, and mobile
- Adaptive layout
- Touch-friendly interface

## 🆘 Troubleshooting

### PDF Upload Issues
- Ensure the file is a valid PDF
- Check file size (< 10MB recommended)
- Try a different PDF if extraction fails

### AI Generation Issues
- Verify API key is correct / not expired
- Check network connectivity
- Ensure you have API quota remaining
- If you get fewer questions than requested, the app now tries multiple supplemental batches. If it still fails, try: (1) requesting fewer questions, (2) providing a richer / larger PDF, or (3) reducing repeated/boilerplate pages.

### Quiz Not Loading
- Check browser console for errors
- Clear browser cache and reload
- Ensure JavaScript is enabled

## 📄 License

Free to use for educational purposes.

## 🤝 Contributing

Feel free to fork, modify, and enhance!

---

**Made with ❤️ for better learning**
