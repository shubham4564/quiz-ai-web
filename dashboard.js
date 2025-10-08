// ============================================
// THEME TOGGLE
// ============================================
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    // Update button text and icon
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    
    if (newTheme === 'dark') {
        themeIcon.textContent = '☀️';
        themeText.textContent = 'Light Mode';
    } else {
        themeIcon.textContent = '🌙';
        themeText.textContent = 'Dark Mode';
    }
}

// Load saved theme on page load
(function() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Update button on load
    const themeIcon = document.getElementById('theme-icon');
    const themeText = document.getElementById('theme-text');
    if (themeIcon && themeText) {
        if (savedTheme === 'dark') {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Light Mode';
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Dark Mode';
        }
    }
})();

// ============================================
// View switching functionality
// ============================================
function switchView(viewName) {
    // Remove active class from all buttons and views
    document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.view').forEach(view => view.classList.remove('active'));
    
    // Add active class to selected button and view
    document.querySelector(`[data-view="${viewName}"]`).classList.add('active');
    document.getElementById(`${viewName}-view`).classList.add('active');
    
    // If switching to quiz view, load the quiz
    if (viewName === 'quiz') {
        initQuiz();
    }
    
    // If switching to admin view, ensure login screen is shown
    if (viewName === 'admin') {
        document.getElementById('admin-login').style.display = 'block';
        document.getElementById('admin-content').style.display = 'none';
        document.getElementById('admin-password').value = '';
        document.getElementById('login-error').style.display = 'none';
    }
}

// Add event listeners to mode buttons
document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.getAttribute('data-view');
        switchView(view);
    });
});

// ============================================
// ADMIN PASSWORD PROTECTION
// ============================================
const ADMIN_PASSWORD = 'admin123'; // In production, this should be server-side

document.getElementById('login-btn').addEventListener('click', () => {
    const passwordInput = document.getElementById('admin-password');
    const loginError = document.getElementById('login-error');
    
    if (passwordInput.value === ADMIN_PASSWORD) {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-content').style.display = 'block';
        passwordInput.value = '';
        loginError.style.display = 'none';
    } else {
        loginError.textContent = '❌ Incorrect password. Please try again.';
        loginError.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
    }
});

// ============================================
// ADMIN PANEL TABS
// ============================================
document.querySelectorAll('.admin-tab-btn').forEach(button => {
    button.addEventListener('click', () => {
        const targetId = button.dataset.target;

        // Update button active state
        document.querySelectorAll('.admin-tab-btn').forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');

        // Update section visibility
        document.querySelectorAll('.admin-section').forEach(section => {
            if (section.id === targetId) {
                section.classList.add('active');
            } else {
                section.classList.remove('active');
            }
        });
    });
});


// ============================================
// DANGER ZONE FUNCTIONALITY
// ============================================
document.getElementById('clear-data-btn').addEventListener('click', () => {
    if (confirm('Are you sure you want to delete all quiz data? This action cannot be undone.')) {
        localStorage.removeItem('quizData');
        const status = document.getElementById('danger-zone-status');
        status.textContent = '✅ All quiz data has been cleared.';
        status.className = 'status-message success';
        status.style.display = 'block';
        setTimeout(() => {
            status.style.display = 'none';
        }, 3000);
    }
});


// ============================================
// INSTRUCTIONS TOGGLE
// ============================================
function toggleInstructions() {
    const panel = document.getElementById('instructions-panel');
    const icon = document.getElementById('instructions-icon');
    const text = document.getElementById('instructions-text');
    
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
        icon.textContent = '📕';
        text.textContent = 'Hide Instructions';
    } else {
        panel.style.display = 'none';
        icon.textContent = '📖';
        text.textContent = 'Show Instructions';
    }
}


// ============================================
// PDF UPLOAD HANDLER & DRAG-AND-DROP
// ============================================
let uploadedPDFContent = null;

// Setup Drag and Drop listeners
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('pdf-upload');
const fileNameDisplay = document.getElementById('file-name');

if (dropZone && fileInput && fileNameDisplay) {
    dropZone.addEventListener('click', () => fileInput.click());

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length) {
            handleFile(files[0]);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) {
            handleFile(e.target.files[0]);
        }
    });
}

function handleFile(file) {
    if (file && file.type === 'application/pdf') {
        fileNameDisplay.textContent = `📄 ${file.name}`;
        
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const typedarray = new Uint8Array(e.target.result);
                if (typeof pdfjsLib === 'undefined') {
                    await loadPDFJS();
                }
                
                const pdf = await pdfjsLib.getDocument(typedarray).promise;
                let fullText = '';
                
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    const pageText = textContent.items.map(item => item.str).join(' ');
                    fullText += pageText + '\n';
                }
                
                uploadedPDFContent = fullText;
                console.log('PDF content extracted successfully');
            } catch (error) {
                console.error('Error reading PDF:', error);
                alert('Error reading PDF file. Please try again.');
                fileNameDisplay.textContent = '';
                uploadedPDFContent = null;
            }
        };
        reader.readAsArrayBuffer(file);
    } else {
        alert('Please select a valid PDF file');
        fileNameDisplay.textContent = '';
        uploadedPDFContent = null;
    }
}

// This function is called by the onchange attribute in the HTML
function handlePDFUpload(event) {
    if (event.target.files.length) {
        handleFile(event.target.files[0]);
    }
}

// Load PDF.js library dynamically
function loadPDFJS() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = () => {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            resolve();
        };
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// ============================================
// AI QUIZ GENERATION
// ============================================
async function generateQuizFromPDF() {
    const apiKey = document.getElementById('gemini-api-key').value.trim();
    const numQuestions = document.getElementById('num-questions').value;
    
    if (!apiKey) {
        alert('⚠️ Please enter your Gemini API key');
        return;
    }
    
    if (!uploadedPDFContent) {
        alert('⚠️ Please upload a PDF file first');
        return;
    }
    
    // Show progress
    const progressDiv = document.getElementById('ai-progress');
    const progressText = document.getElementById('progress-text');
    const generateBtn = document.getElementById('generate-btn');
    
    progressDiv.style.display = 'flex';
    generateBtn.disabled = true;
    generateBtn.style.opacity = '0.6';
    progressText.textContent = 'Analyzing PDF content...';
    
    try {
        // Prepare the prompt
        const prompt = `
You are an expert quiz creator. Your task is to generate a series of multiple-choice questions based on the provided document content.

DOCUMENT CONTENT:
"""
${uploadedPDFContent.substring(0, 15000)}
"""

INSTRUCTIONS:
1.  Generate exactly ${numQuestions} multiple-choice questions from the document.
2.  Each question must have exactly 4 options.
3.  Exactly one option must be correct.
4.  Provide a brief, helpful hint for each question.
5.  Provide a one-sentence explanation for the correct answer.
6.  Your final output must be a single, valid JSON array of question objects. Do not include any other text, explanations, or markdown formatting outside of the JSON structure.

JSON OUTPUT FORMAT:
[
  {
    "question": "...",
    "hint": "...",
    "explanation": "...",
    "options": [
      {"text": "...", "correct": false},
      {"text": "...", "correct": true},
      {"text": "...", "correct": false},
      {"text": "...", "correct": false}
    ]
  }
]`;

        progressText.textContent = 'Sending request to Gemini AI...';
        
        // Call Gemini API (using Flash Exp as  2.5 Pro isn't available yet)
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 8192,
                }
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || `API request failed: ${response.status}`);
        }
        
        progressText.textContent = 'Processing AI response...';
        
        const data = await response.json();
        let generatedText = data.candidates[0].content.parts[0].text;
        
        // Clean up the response - remove markdown code blocks if present
        generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        
        // Parse the JSON
        const questions = JSON.parse(generatedText);
        
        // Validate
        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error('Invalid response format from AI');
        }
        
        progressText.textContent = 'Validating questions...';
        
        // Validate each question
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            if (!q.question || !q.options || q.options.length !== 4) {
                throw new Error(`Question ${i + 1} is invalid`);
            }
            // Ensure hint and explanation exist
            if (!q.hint) q.hint = 'Think carefully about the key concepts.';
            if (!q.explanation) q.explanation = 'This is the correct answer based on the document.';
        }
        
        // Save to localStorage
        localStorage.setItem('quizData', JSON.stringify(questions));
        
        progressText.textContent = `✅ Successfully generated ${questions.length} questions!`;
        
        setTimeout(() => {
            progressDiv.style.display = 'none';
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
            
            if (confirm(`🎉 ${questions.length} quiz questions generated successfully!\n\nWould you like to take the quiz now?`)) {
                switchView('quiz');
            }
        }, 2000);
        
    } catch (error) {
        console.error('Error generating quiz:', error);
        progressText.textContent = `❌ Error: ${error.message}`;
        generateBtn.disabled = false;
        generateBtn.style.opacity = '1';
        
        setTimeout(() => {
            progressDiv.style.display = 'none';
        }, 5000);
    }
}

// ============================================
// ADMIN PANEL FUNCTIONALITY
// ============================================
const submitQuestionsBtn = document.getElementById('submit-questions');
const questionsTextArea = document.getElementById('bulk-questions');
const statusMessage = document.getElementById('manual-entry-status');

submitQuestionsBtn.addEventListener('click', () => {
    const questionsText = questionsTextArea.value.trim();
    
    if (!questionsText) {
        showStatus("Error: Text area is empty. Please paste your JSON questions.", 'error');
        return;
    }

    try {
        // Parse the text as JSON
        const newQuestions = JSON.parse(questionsText);

        // Validate that it's an array
        if (!Array.isArray(newQuestions)) {
            throw new Error("Input must be a JSON array. Make sure your questions are wrapped in [ ] brackets.");
        }
        
        if (newQuestions.length === 0) {
            throw new Error("Array is empty. Please add at least one question.");
        }

        // Validate each question structure
        for (let i = 0; i < newQuestions.length; i++) {
            const q = newQuestions[i];
            
            if (!q.question || typeof q.question !== 'string') {
                throw new Error(`Question ${i + 1}: Missing or invalid "question" field.`);
            }
            
            if (!Array.isArray(q.options)) {
                throw new Error(`Question ${i + 1}: "options" must be an array.`);
            }
            
            if (q.options.length !== 4) {
                throw new Error(`Question ${i + 1}: Must have exactly 4 options (found ${q.options.length}).`);
            }
            
            let correctCount = 0;
            q.options.forEach((opt, idx) => {
                if (!opt.text || typeof opt.text !== 'string') {
                    throw new Error(`Question ${i + 1}, Option ${idx + 1}: Missing or invalid "text" field.`);
                }
                if (typeof opt.correct !== 'boolean') {
                    throw new Error(`Question ${i + 1}, Option ${idx + 1}: "correct" must be true or false.`);
                }
                if (opt.correct) correctCount++;
            });
            
            if (correctCount !== 1) {
                throw new Error(`Question ${i + 1}: Must have exactly one correct answer (found ${correctCount}).`);
            }
        }

        // Save to localStorage
        localStorage.setItem('quizData', JSON.stringify(newQuestions));

        showStatus(`✅ Success! ${newQuestions.length} question(s) have been saved.`, 'success');
        questionsTextArea.value = '';
        
        // Show success for 3 seconds, then prompt to take quiz
        setTimeout(() => {
            if (confirm('Questions saved! Would you like to take the quiz now?')) {
                switchView('quiz');
            }
        }, 1500);

    } catch (error) {
        showStatus(`❌ Error: ${error.message}`, 'error');
    }
});

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    statusMessage.style.display = 'block';

    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 5000);
}


// ============================================
// QUIZ FUNCTIONALITY
// ============================================
let quizData = [];
let currentQuiz = 0;
let score = 0;
let wrongCount = 0;
let skippedCount = 0;
let answeredQuestions = new Set(); // Track which questions were answered

const questionEl = document.getElementById('question');
const a_text = document.getElementById('a_text');
const b_text = document.getElementById('b_text');
const c_text = document.getElementById('c_text');
const d_text = document.getElementById('d_text');
const submitQuizBtn = document.getElementById('submit-quiz');

function initQuiz() {
    // Load questions from localStorage or use default
    const storedQuestions = localStorage.getItem('quizData');
    
    if (storedQuestions) {
        try {
            quizData = JSON.parse(storedQuestions);
        } catch (e) {
            console.error('Error loading questions:', e);
            quizData = getDefaultQuestions();
        }
    } else {
        quizData = getDefaultQuestions();
    }
    
    if (quizData.length === 0) {
        questionEl.textContent = 'No questions available. Please add questions via Admin Panel.';
        submitQuizBtn.disabled = true;
        return;
    }
    
    currentQuiz = 0;
    score = 0;
    wrongCount = 0;
    skippedCount = 0;
    answeredQuestions = new Set();
    submitQuizBtn.disabled = false;
    loadQuiz();
}

function getDefaultQuestions() {
    return [
        {
            "question": "Which of the following is a characteristic of the User Datagram Protocol (UDP)?",
            "hint": "Think about the connection type and reliability features.",
            "explanation": "UDP is connectionless and does not guarantee delivery, making it unreliable but fast.",
            "options": [
                {"text": "Guaranteed delivery of packets", "correct": false},
                {"text": "Connection-oriented communication", "correct": false},
                {"text": "Unreliable and connectionless", "correct": true},
                {"text": "Flow and congestion control", "correct": false}
            ]
        },
        {
            "question": "What is the main advantage of using UDP over TCP for certain applications?",
            "hint": "Consider the trade-off between reliability and speed.",
            "explanation": "UDP has lower overhead and faster transmission because it doesn't have reliability mechanisms.",
            "options": [
                {"text": "Higher reliability and error checking", "correct": false},
                {"text": "Lower overhead and faster transmission", "correct": true},
                {"text": "In-order delivery of packets", "correct": false},
                {"text": "Robust congestion control", "correct": false}
            ]
        },
        {
            "question": "Which of the following is a key feature of the Transmission Control Protocol (TCP)?",
            "hint": "TCP is known for its reliability features.",
            "explanation": "TCP provides reliable, in-order byte-stream data transfer through acknowledgments and retransmissions.",
            "options": [
                {"text": "It is a connectionless protocol.", "correct": false},
                {"text": "It provides reliable, in-order byte-stream data transfer.", "correct": true},
                {"text": "It has a smaller header size than UDP.", "correct": false},
                {"text": "It is best suited for real-time applications where some packet loss is acceptable.", "correct": false}
            ]
        }
    ];
}

function loadQuiz() {
    deselectAnswers();
    
    // Update progress bar
    const progressBar = document.getElementById('progress-bar');
    const progressText = document.getElementById('progress-text');
    if (progressBar && progressText) {
        const progress = ((currentQuiz + 1) / quizData.length) * 100;
        progressBar.style.width = `${progress}%`;
        progressText.textContent = `${currentQuiz + 1} / ${quizData.length}`;
    }
    
    // Re-enable radio buttons
    document.querySelectorAll('.answer').forEach(el => el.disabled = false);
    
    // Clear previous styling and explanations from list items
    const optionsList = document.querySelectorAll('#quiz-container li');
    optionsList.forEach(li => {
        li.style.backgroundColor = '';
        li.style.borderColor = '';
        li.style.borderWidth = '';
        li.style.borderStyle = '';
        
        // Remove any explanation divs
        const explanationDivs = li.querySelectorAll('div');
        explanationDivs.forEach(div => div.remove());
    });
    
    const currentQuizData = quizData[currentQuiz];
    
    // Clear previous hint/explanation
    const existingHint = document.getElementById('hint-container');
    const existingExplanation = document.getElementById('explanation-container');
    if (existingHint) existingHint.remove();
    if (existingExplanation) existingExplanation.remove();
    
    questionEl.innerHTML = `${currentQuiz + 1}. ${currentQuizData.question}`;
    
    // Add hint button if hint exists
    if (currentQuizData.hint) {
        const hintBtn = document.createElement('button');
        hintBtn.className = 'hint-btn';
        hintBtn.innerHTML = '💡 Show Hint';
        hintBtn.onclick = function() {
            let hintContainer = document.getElementById('hint-container');
            if (!hintContainer) {
                hintContainer = document.createElement('div');
                hintContainer.id = 'hint-container';
                hintContainer.className = 'hint-box';
                hintContainer.innerHTML = `<strong>💡 Hint:</strong> ${currentQuizData.hint}`;
                questionEl.parentElement.insertBefore(hintContainer, questionEl.nextSibling);
                hintBtn.innerHTML = '🔒 Hide Hint';
            } else {
                hintContainer.remove();
                hintBtn.innerHTML = '💡 Show Hint';
            }
        };
        questionEl.appendChild(hintBtn);
    }
    
    a_text.textContent = currentQuizData.options[0].text;
    b_text.textContent = currentQuizData.options[1].text;
    c_text.textContent = currentQuizData.options[2].text;
    d_text.textContent = currentQuizData.options[3].text;
}

function deselectAnswers() {
    const answerEls = document.querySelectorAll('.answer');
    answerEls.forEach(answerEl => answerEl.checked = false);
}

function getSelected() {
    const answerEls = document.querySelectorAll('.answer');
    let answer;
    
    answerEls.forEach(answerEl => {
        if (answerEl.checked) {
            answer = answerEl.id;
        }
    });
    
    return answer;
}

submitQuizBtn.addEventListener('click', () => {
    const answer = getSelected();
    
    if (answer) {
        const currentQuizData = quizData[currentQuiz];
        const selectedIndex = ['a', 'b', 'c', 'd'].indexOf(answer);
        const isCorrect = currentQuizData.options[selectedIndex].correct;
        
        // Track this question as answered
        answeredQuestions.add(currentQuiz);
        
        // Update counts
        if (isCorrect) {
            score++;
        } else {
            wrongCount++;
        }
        
        // Show immediate feedback for all options
        const optionsList = document.querySelectorAll('#quiz-container li');
        optionsList.forEach((li, idx) => {
            const radio = li.querySelector('input');
            radio.disabled = true;
            
            const isThisCorrect = currentQuizData.options[idx].correct;
            const wasSelected = idx === selectedIndex;
            
            // Get CSS variables for theme-aware colors
            const styles = getComputedStyle(document.documentElement);
            
            // Add visual feedback with theme-aware colors
            if (isThisCorrect) {
                li.style.backgroundColor = styles.getPropertyValue('--success-bg').trim();
                li.style.borderColor = styles.getPropertyValue('--success-border').trim();
                li.style.borderWidth = '2px';
                li.style.borderStyle = 'solid';
            } else if (wasSelected) {
                li.style.backgroundColor = styles.getPropertyValue('--error-bg').trim();
                li.style.borderColor = styles.getPropertyValue('--error-border').trim();
                li.style.borderWidth = '2px';
                li.style.borderStyle = 'solid';
            }
            
            // Add explanation below the option
            const explanation = document.createElement('div');
            explanation.style.fontSize = '0.85rem';
            explanation.style.marginTop = '0.75rem';
            explanation.style.paddingTop = '0.75rem';
            explanation.style.borderTop = '1px solid rgba(148, 163, 184, 0.2)';
            explanation.style.lineHeight = '1.5';
            
            if (isThisCorrect) {
                explanation.style.color = styles.getPropertyValue('--success-text').trim();
                explanation.innerHTML = `✓ <strong>Right answer</strong><br>${currentQuizData.explanation || 'This is the correct answer.'}`;
            } else if (wasSelected) {
                explanation.style.color = styles.getPropertyValue('--error-text').trim();
                explanation.innerHTML = `✕ <strong>Not quite</strong><br>This is incorrect. Please review the explanation for the correct answer.`;
            }
            
            if (explanation.innerHTML) {
                li.appendChild(explanation);
            }
        });
        
        // Change button to "Next"
        submitQuizBtn.textContent = 'Next Question →';
        submitQuizBtn.onclick = () => {
            currentQuiz++;
            
            if (currentQuiz < quizData.length) {
                submitQuizBtn.textContent = 'Submit Answer';
                submitQuizBtn.onclick = null;
                loadQuiz();
            } else {
                // Calculate skipped
                skippedCount = quizData.length - answeredQuestions.size;
                showResults();
            }
        };
        
    } else {
        // Allow skipping
        if (confirm('You haven\'t selected an answer. Do you want to skip this question?')) {
            currentQuiz++;
            
            if (currentQuiz < quizData.length) {
                loadQuiz();
            } else {
                skippedCount = quizData.length - answeredQuestions.size;
                showResults();
            }
        }
    }
});

function showResults() {
    const percentage = Math.round((score / quizData.length) * 100);
    const emoji = percentage >= 90 ? '🏆' : percentage >= 70 ? '🌟' : percentage >= 50 ? '👍' : '📚';
    const message = percentage >= 90 ? 'Outstanding! Perfect score!' : 
                  percentage >= 70 ? 'Excellent work!' : 
                  percentage >= 50 ? 'Good effort! Keep learning!' : 
                  'Keep practicing! You can do better!';
    
    document.getElementById('quiz-container').innerHTML = `
        <div class="result-container" style="padding: 1.5rem;">
            <h2 style="color: var(--text-primary); margin: 0 0 1.5rem 0; font-size: 1.3rem; font-weight: 600;">You did it! Quiz complete.</h2>
            
            <!-- Score Cards -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem;">
                <div style="background: var(--bg-tertiary); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border-color);">
                    <div style="color: var(--text-tertiary); font-size: 0.85rem; margin-bottom: 0.5rem;">Score</div>
                    <div style="color: var(--text-primary); font-size: 1.75rem; font-weight: 700;">${score}/${quizData.length}</div>
                </div>
                <div style="background: var(--bg-tertiary); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border-color);">
                    <div style="color: var(--text-tertiary); font-size: 0.85rem; margin-bottom: 0.5rem;">Accuracy</div>
                    <div style="color: var(--text-primary); font-size: 1.75rem; font-weight: 700;">${percentage}%</div>
                </div>
                <div style="background: var(--bg-tertiary); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border-color);">
                    <div style="display: flex; justify-content: space-between; color: var(--text-tertiary); font-size: 0.85rem; margin-bottom: 0.4rem;">
                        <span>Right</span>
                        <span style="color: #22c55e; font-weight: 600;">${score}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; color: var(--text-tertiary); font-size: 0.85rem; margin-bottom: 0.4rem;">
                        <span>Wrong</span>
                        <span style="color: #ef4444; font-weight: 600;">${wrongCount}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; color: var(--text-tertiary); font-size: 0.85rem;">
                        <span>Skipped</span>
                        <span style="color: #f59e0b; font-weight: 600;">${skippedCount}</span>
                    </div>
                </div>
            </div>
            
            <!-- Strengths Section -->
            <div style="background: var(--bg-tertiary); padding: 1.5rem; border-radius: 10px; margin-bottom: 1.25rem; border: 1px solid var(--border-color);">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                    <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
                        📊
                    </div>
                    <div style="flex: 1; min-width: 0;">
                        <h3 style="margin: 0 0 0.35rem 0; font-size: 1.05rem; color: var(--text-primary); font-weight: 600;">Strengths and Growth Areas</h3>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.85rem; line-height: 1.4;">Get a summary of your key strengths and discover areas where you can focus your studies.</p>
                    </div>
                    <button onclick="analyzePerformance()" style="width: auto; padding: 0.65rem 1.25rem; font-size: 0.85rem; background: var(--accent-primary); white-space: nowrap; flex-shrink: 0;">
                        Analyze my performance
                    </button>
                </div>
            </div>
            
            <!-- Keep Learning Section -->
            <h3 style="color: var(--text-primary); margin: 0 0 0.85rem 0; font-size: 1.1rem; font-weight: 600;">Keep Learning</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem; margin-bottom: 1.5rem;">
                <div style="background: var(--bg-tertiary); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border-color);">
                    <div style="width: 45px; height: 45px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; margin-bottom: 0.85rem;">
                        📇
                    </div>
                    <h4 style="margin: 0 0 0.4rem 0; font-size: 1rem; color: var(--text-primary); font-weight: 600;">Flashcards</h4>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.8rem; line-height: 1.5;">Create a complete set of flashcards from all your quiz material. Good for quick review and mastering key concepts.</p>
                </div>
                <div style="background: var(--bg-tertiary); padding: 1.25rem; border-radius: 10px; border: 1px solid var(--border-color);">
                    <div style="width: 45px; height: 45px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 1.3rem; margin-bottom: 0.85rem;">
                        📚
                    </div>
                    <h4 style="margin: 0 0 0.4rem 0; font-size: 1rem; color: var(--text-primary); font-weight: 600;">Study guide</h4>
                    <p style="margin: 0; color: var(--text-secondary); font-size: 0.8rem; line-height: 1.5;">Generate a comprehensive study guide based on the materials you are studying. Good for in-depth review.</p>
                </div>
            </div>
            
            <!-- Action Buttons -->
            <div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
                <button id="restart-quiz" style="flex: 1; min-width: 150px; background: transparent; border: 2px solid var(--border-color); color: var(--text-secondary);">
                    Review quiz
                </button>
                <button onclick="switchView('home')" style="flex: 1; min-width: 150px; background: var(--accent-primary);">
                    More questions
                </button>
            </div>
        </div>
    `;
    
    // Add restart functionality
    document.getElementById('restart-quiz').addEventListener('click', () => {
        currentQuiz = 0;
        score = 0;
        wrongCount = 0;
        skippedCount = 0;
        answeredQuestions = new Set();
        
        // Recreate quiz container
        document.getElementById('quiz-container').innerHTML = `
            <h2 id="question" style="color: #333; font-size: 1.3rem; margin-bottom: 1.5rem;">Loading quiz...</h2>
            <ul style="list-style: none; padding: 0;">
                <li style="margin: 1rem 0;">
                    <input type="radio" name="answer" id="a" class="answer">
                    <label for="a" id="a_text">Answer A</label>
                </li>
                <li style="margin: 1rem 0;">
                    <input type="radio" name="answer" id="b" class="answer">
                    <label for="b" id="b_text">Answer B</label>
                </li>
                <li style="margin: 1rem 0;">
                    <input type="radio" name="answer" id="c" class="answer">
                    <label for="c" id="c_text">Answer C</label>
                </li>
                <li style="margin: 1rem 0;">
                    <input type="radio" name="answer" id="d" class="answer">
                    <label for="d" id="d_text">Answer D</label>
                </li>
            </ul>
            <button id="submit-quiz">Submit Answer</button>
            <button class="btn-secondary" onclick="switchView('home')">Back to Home</button>
        `;
        
        // Reinitialize quiz
        initQuiz();
    });
}

function analyzePerformance() {
    alert(`Performance Analysis:\n\n✅ Correct: ${score}/${quizData.length}\n❌ Wrong: ${wrongCount}\n⏭️ Skipped: ${skippedCount}\n\n📊 Accuracy: ${Math.round((score / quizData.length) * 100)}%\n\n${score >= quizData.length * 0.7 ? '🌟 Great job! You have a strong understanding of the material.' : '📚 Keep studying! Focus on reviewing the explanations for questions you missed.'}`);
}
