# 🎓 AI-Powered Quiz Dashboard

A modern, feature-rich quiz application with AI-powered quiz generation from PDF documents using Google's Gemini AI.

## ✨ Features

### 🏠 Home Dashboard
- Clean, modern interface with gradient backgrounds
- Easy navigation between quiz and admin sections
- Quick guide for users

### 📖 Quiz Taking
- **Interactive Quiz Interface**
  - Progress tracking (Question X/Total)
  - 💡 **Hint System** - Get helpful hints without giving away the answer
  - ✅/❌ **Instant Feedback** - Know if your answer is correct immediately
  - 📝 **Explanations** - Learn why the correct answer is right
  - Beautiful animations and transitions
  
### ⚙️ Admin Panel (Password Protected)
- **Password**: `admin123`
- Two methods to create quizzes:

#### 🤖 AI-Powered Generation
- **Upload PDF documents**
- **Automatic quiz generation** using Google Gemini AI
- Generates 30 questions automatically with:
  - Multiple choice options
  - Helpful hints
  - Detailed explanations
  - Proper validation

#### ✍️ Manual JSON Entry
- Add questions in bulk using JSON format
- Collapsible instructions
- Format validation
- Example templates provided

## 🚀 Getting Started

### 1. Setup
1. Open `index.html` in your web browser
2. No installation required!

### 2. Taking a Quiz
1. Click **"Take Quiz"** from the home page
2. Read each question carefully
3. Click **"Show Hint"** if you need help (optional)
4. Select your answer
5. Click **"Submit Answer"**
6. See instant feedback with explanation
7. Click **"Next Question"** to continue
8. View your final score and performance

### 3. Admin Access - AI Generation

1. Click **"Admin Panel"**
2. Enter password: `admin123`
3. Click **"AI Generate from PDF"** tab
4. **Get your Gemini API Key**:
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Create a new API key (free tier available)
   - Copy the API key
5. Paste your API key in the field
6. Click **"Click to select PDF file"** to upload a PDF
7. Click **"Generate 30 Quiz Questions with AI"**
8. Wait for AI to process (15-30 seconds)
9. Click **"Yes"** to take the quiz immediately!

### 4. Admin Access - Manual Entry

1. Click **"Admin Panel"**
2. Enter password: `admin123`
3. Click **"Manual JSON Entry"** tab
4. Click **"Show Instructions"** for format details
5. Paste your JSON array of questions
6. Click **"Save Questions"**

## 📝 JSON Format

```json
[
  {
    "question": "What is 2 + 2?",
    "hint": "Think about basic addition",
    "explanation": "2 + 2 equals 4 through simple addition",
    "options": [
      {"text": "3", "correct": false},
      {"text": "4", "correct": true},
      {"text": "5", "correct": false},
      {"text": "6", "correct": false}
    ]
  }
]
```

### Required Fields:
- `question`: String - The question text
- `options`: Array of 4 objects - The answer options
  - `text`: String - Option text
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
- Uses Google Gemini 2.0 Flash Exp model
- Analyzes PDF content intelligently
- Generates diverse questions covering different topics
- Automatically adds hints and explanations
- Validates all generated questions

### Score Display
- Shows correct/incorrect count
- Displays percentage score
- Color-coded performance:
  - 🏆 90%+ - Outstanding!
  - 🌟 70-89% - Excellent!
  - 👍 50-69% - Good effort!
  - 📚 Below 50% - Keep practicing!

## 🔒 Security Notes

- Admin password is `admin123` (for demo purposes)
- In production, use server-side authentication
- API keys are stored locally in browser only
- No data is sent to external servers (except Gemini API)

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
- Verify API key is correct
- Check internet connection
- Ensure you have API quota remaining
- Try with a smaller PDF

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
