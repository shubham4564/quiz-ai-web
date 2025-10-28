document.addEventListener('DOMContentLoaded', () => {
    // ============================================
    // PERSISTED QUIZ COLLECTIONS
    // ============================================
    // Structure in localStorage under key 'quizCollections':
    // {
    //   items: [
    //     { id: 'q_1699999999999_0', fileBase: 'MyPDF', fileName: 'MyPDF.pdf', index: 1, title: 'MyPDF Quiz 1', createdAt: 1699999999999, questions: [...] },
    //     ...
    //   ],
    //   activeQuizId: 'q_...'
    // }
    function getQuizCollections() {
        try {
            const raw = localStorage.getItem('quizCollections');
            if (!raw) return { items: [], activeQuizId: null };
            const parsed = JSON.parse(raw);
            if (!parsed.items) parsed.items = [];
            return parsed;
        } catch (e) { return { items: [], activeQuizId: null }; }
    }
    function saveQuizCollections(data) {
        localStorage.setItem('quizCollections', JSON.stringify(data));
    }
    function setActiveQuizId(id) {
        const data = getQuizCollections();
        data.activeQuizId = id;
        saveQuizCollections(data);
    }
    function getActiveQuiz() {
        const data = getQuizCollections();
        return data.items.find(i => i.id === data.activeQuizId) || null;
    }
    function migrateLegacySingleQuizIfNeeded() {
        const collections = getQuizCollections();
        if (collections.items.length === 0) {
            const legacy = localStorage.getItem('quizData');
            if (legacy) {
                try {
                    const questions = JSON.parse(legacy);
                    if (Array.isArray(questions) && questions.length) {
                        const createdAt = Date.now();
                        const item = {
                            id: 'legacy_' + createdAt,
                            fileBase: 'Legacy',
                            fileName: 'LegacyImport',
                            index: 1,
                            title: 'Legacy Quiz 1',
                            createdAt,
                            questions
                        };
                        collections.items.push(item);
                        collections.activeQuizId = item.id;
                        saveQuizCollections(collections);
                    }
                } catch(_){}
            }
        }
    }
    migrateLegacySingleQuizIfNeeded();
    let lastUploadedFileName = null; // capture current PDF file name

    // Helper: in-place Fisher-Yates shuffle
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }

    function loadSavedQuizzesList() {
        const container = document.getElementById('saved-quizzes-list');
        const emptyState = document.getElementById('no-saved-quizzes');
        if (!container) return;
        const { items, activeQuizId } = getQuizCollections();
        container.innerHTML = '';
        if (!items.length) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';
        items
            .sort((a,b)=> b.createdAt - a.createdAt) // newest first
            .forEach(item => {
                const div = document.createElement('div');
                div.className = 'saved-quiz-item';
                div.style.display = 'flex';
                div.style.alignItems = 'center';
                div.style.justifyContent = 'space-between';
                div.style.gap = '0.75rem';
                div.style.background = 'var(--bg-tertiary)';
                div.style.border = '1px solid var(--border-color)';
                div.style.padding = '0.65rem 0.85rem';
                div.style.borderRadius = '8px';
                div.style.cursor = 'pointer';
                if (item.id === activeQuizId) {
                    div.style.outline = '2px solid var(--accent-primary)';
                }
                const left = document.createElement('div');
                left.style.display = 'flex';
                left.style.flexDirection = 'column';
                left.style.flex = '1';
                const title = document.createElement('span');
                title.textContent = item.title;
                title.style.fontSize = '0.9rem';
                title.style.fontWeight = '600';
                title.style.color = 'var(--text-primary)';
                const meta = document.createElement('span');
                meta.textContent = `${item.questions.length} questions • ${item.fileName}`;
                meta.style.fontSize = '0.7rem';
                meta.style.color = 'var(--text-tertiary)';
                left.appendChild(title);
                left.appendChild(meta);
                const actions = document.createElement('div');
                actions.style.display = 'flex';
                actions.style.gap = '0.35rem';
                actions.style.alignItems = 'center';
                const openBtn = document.createElement('button');
                openBtn.textContent = 'Open';
                openBtn.className = 'btn-secondary';
                openBtn.style.fontSize = '0.7rem';
                openBtn.addEventListener('click', (e)=>{
                    e.stopPropagation();
                    launchSavedQuiz(item.id);
                });
                const deleteBtn = document.createElement('button');
                deleteBtn.textContent = '✖';
                deleteBtn.style.background = 'var(--error-bg)';
                deleteBtn.style.color = 'var(--error-text)';
                deleteBtn.style.border = '1px solid var(--error-border)';
                deleteBtn.style.fontSize = '0.7rem';
                deleteBtn.addEventListener('click', (e)=>{
                    e.stopPropagation();
                    deleteSavedQuiz(item.id);
                });
                const exportBtn = document.createElement('button');
                exportBtn.textContent = 'JSON';
                exportBtn.className = 'btn-secondary';
                exportBtn.style.fontSize = '0.7rem';
                exportBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    exportSavedQuiz(item.id);
                });

                // Shuffle toggle (per-quiz) — let user choose whether to jumble options when launching
                const shuffleWrap = document.createElement('label');
                shuffleWrap.style.display = 'inline-flex';
                shuffleWrap.style.alignItems = 'center';
                shuffleWrap.style.gap = '0.35rem';
                shuffleWrap.style.marginRight = '0.35rem';
                shuffleWrap.style.fontSize = '0.75rem';
                shuffleWrap.title = 'Shuffle options when taking this quiz';

                const shuffleCheckbox = document.createElement('input');
                shuffleCheckbox.type = 'checkbox';
                shuffleCheckbox.checked = !!item.shuffleOptions;
                shuffleCheckbox.style.width = '14px';
                shuffleCheckbox.style.height = '14px';
                shuffleCheckbox.addEventListener('click', (e) => e.stopPropagation());
                shuffleCheckbox.addEventListener('change', (e) => {
                    e.stopPropagation();
                    const data = getQuizCollections();
                    const idx = data.items.findIndex(i => i.id === item.id);
                    if (idx === -1) return;
                    data.items[idx].shuffleOptions = shuffleCheckbox.checked;
                    saveQuizCollections(data);
                    // reflect state instantly in UI via a subtle style change
                    if (shuffleCheckbox.checked) shuffleWrap.style.opacity = '0.95'; else shuffleWrap.style.opacity = '0.8';
                });

                const shuffleLabel = document.createElement('span');
                shuffleLabel.textContent = 'Shuffle Options';
                shuffleLabel.style.color = 'var(--text-tertiary)';
                shuffleLabel.style.fontSize = '0.7rem';
                shuffleWrap.appendChild(shuffleCheckbox);
                shuffleWrap.appendChild(shuffleLabel);
                shuffleWrap.style.opacity = item.shuffleOptions ? '0.95' : '0.8';
                actions.appendChild(openBtn);
                actions.appendChild(shuffleWrap);
                actions.appendChild(exportBtn);
                actions.appendChild(deleteBtn);
                div.appendChild(left);
                div.appendChild(actions);
                div.addEventListener('click', ()=> launchSavedQuiz(item.id));
                container.appendChild(div);
            });
    }
    function launchSavedQuiz(id) {
        const collections = getQuizCollections();
        const item = collections.items.find(i=>i.id===id);
        if(!item) return;

        // Make a deep copy so we don't mutate the saved canonical questions
        let questionsToUse = JSON.parse(JSON.stringify(item.questions || []));
        // If user requested shuffled options for this quiz, jumble each question's options
        if (item.shuffleOptions) {
            questionsToUse.forEach(q => {
                if (Array.isArray(q.options)) {
                    shuffleArray(q.options);
                }
            });
        }

        localStorage.setItem('quizData', JSON.stringify(questionsToUse));
        setActiveQuizId(id);
        loadSavedQuizzesList();
        switchView('quiz');
        // initQuiz will run when quiz view loads
        initQuiz();
    }
    function deleteSavedQuiz(id) {
        const data = getQuizCollections();
        const idx = data.items.findIndex(i=>i.id===id);
        if (idx === -1) return;
        data.items.splice(idx,1);
        if (data.activeQuizId === id) {
            data.activeQuizId = null;
            localStorage.removeItem('quizData');
        }
        saveQuizCollections(data);
        loadSavedQuizzesList();
        showAiStatus('Deleted quiz','info');
    }

    // Export raw JSON for a saved quiz (modal with copy/download)
    function exportSavedQuiz(id) {
        const collections = getQuizCollections();
        const item = collections.items.find(i => i.id === id);
        if (!item) {
            showAiStatus('❌ Quiz not found for export', 'error');
            return;
        }
        // If an existing overlay is present, remove it
        const existing = document.getElementById('raw-json-overlay');
        if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'raw-json-overlay';
    overlay.className = 'raw-json-overlay';

    const panel = document.createElement('div');
    panel.className = 'raw-json-panel';

        const header = document.createElement('div');
        header.style.display = 'flex';
        header.style.justifyContent = 'space-between';
        header.style.alignItems = 'center';
        header.style.marginBottom = '0.5rem';

        const title = document.createElement('strong');
        title.textContent = `${item.title} — Raw JSON`;
        title.style.color = 'var(--text-primary)';

        // Helper actions so top and bottom controls share behavior
    const doCopy = async (text, btn, showStatus = true) => {
            // immediate UI feedback: change button text and disable briefly
            let originalText;
            try {
                if (btn && btn instanceof HTMLElement) {
                    originalText = btn.textContent;
                    btn.textContent = '✅ Copied!';
                    btn.disabled = true;
                    btn.setAttribute('aria-pressed', 'true');
                }
            } catch (e) { /* ignore UI update failures */ }

            try {
                await navigator.clipboard.writeText(text);
                // announce success in the app status area unless caller asked to suppress
                if (showStatus) showAiStatus('✅ JSON copied to clipboard', 'success');
            } catch (_) {
                // fallback: prompt the user to copy manually
                window.prompt('Copy the JSON below (Cmd/Ctrl+C):', text);
            } finally {
                // restore button state after a short delay so user sees the feedback
                try {
                    if (btn && btn instanceof HTMLElement) {
                        setTimeout(() => {
                            btn.textContent = originalText || '📋 Copy JSON';
                            btn.disabled = false;
                            btn.removeAttribute('aria-pressed');
                        }, 2000);
                    }
                } catch (e) { /* ignore restore failures */ }
            }
        };

        const doDownload = (text, filename) => {
            const blob = new Blob([text], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
        };

        const topControls = document.createElement('div');
        topControls.style.display = 'flex';
        topControls.style.gap = '0.5rem';
        topControls.style.alignItems = 'center';


    const copyBtnTop = document.createElement('button');
    copyBtnTop.textContent = '📋 Copy JSON';
    copyBtnTop.className = 'btn-primary';
    copyBtnTop.style.fontSize = '0.85rem';
    copyBtnTop.onclick = () => doCopy(JSON.stringify(item.questions, null, 2), copyBtnTop, false);

        const downloadBtnTop = document.createElement('button');
        downloadBtnTop.textContent = '⬇️ Download';
        downloadBtnTop.className = 'btn-secondary';
        downloadBtnTop.style.fontSize = '0.85rem';
        downloadBtnTop.onclick = () => doDownload(JSON.stringify(item.questions, null, 2), `${(item.fileBase||'quiz').replace(/\s+/g,'_')}_quiz_${item.index || 1}.json`);

        const closeX = document.createElement('button');
        closeX.textContent = '✖';
        closeX.className = 'btn-secondary';
        const closeOverlay = () => {
            // start closing animation then remove when finished
            overlay.classList.add('closing');
            panel.classList.add('closing');
            // remove after animation completes
            const cleanup = () => { overlay.removeEventListener('animationend', cleanup); overlay.remove(); };
            overlay.addEventListener('animationend', cleanup);
        };
        closeX.onclick = closeOverlay;

        topControls.appendChild(copyBtnTop);
        topControls.appendChild(downloadBtnTop);

        header.appendChild(title);
        header.appendChild(topControls);
        header.appendChild(closeX);

        const pre = document.createElement('pre');
        pre.style.background = 'var(--bg-tertiary)';
        pre.style.padding = '1rem';
        pre.style.border = '1px solid var(--border-color)';
        pre.style.borderRadius = '8px';
        pre.style.whiteSpace = 'pre-wrap';
        pre.style.wordBreak = 'break-word';
        pre.style.color = 'var(--text-secondary)';
        pre.textContent = JSON.stringify(item.questions, null, 2);

        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '0.5rem';
        controls.style.marginTop = '0.75rem';

    const copyBtn = document.createElement('button');
    copyBtn.textContent = '📋 Copy JSON';
    copyBtn.className = 'btn-primary';
    copyBtn.onclick = () => doCopy(pre.textContent, copyBtn, false);

        const downloadBtn = document.createElement('button');
        downloadBtn.textContent = '⬇️ Download';
        downloadBtn.className = 'btn-secondary';
        downloadBtn.onclick = () => doDownload(pre.textContent, `${(item.fileBase||'quiz').replace(/\s+/g,'_')}_quiz_${item.index || 1}.json`);

        controls.appendChild(copyBtn);
        controls.appendChild(downloadBtn);

        panel.appendChild(header);
        panel.appendChild(pre);
        panel.appendChild(controls);

        // Close when clicking outside the panel
    overlay.onclick = (e) => { if (e.target === overlay) closeOverlay(); };
    // Prevent clicks inside the panel from closing
    panel.onclick = (e) => e.stopPropagation();

    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    }

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

    // Add event listener to the theme toggle button if it exists
    const themeToggleButton = document.querySelector('.theme-toggle');
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
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
    // ADMIN (Password removed)
    // ============================================
    const adminContentSection = document.getElementById('admin-content');
    function ensureAdminVisible() {
        if (adminContentSection) {
            adminContentSection.style.display = 'block';
        }
    }

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
        
        // If switching to admin view just show content directly
        if (viewName === 'admin') {
            ensureAdminVisible();
        }
    }

    // Add event listeners to mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.getAttribute('data-view');
            switchView(view);
        });
    });

    // Add event listeners to action cards
    document.querySelectorAll('.action-card').forEach(card => {
        card.addEventListener('click', () => {
            const view = card.dataset.view;
            if (view) {
                switchView(view);
            }
        });
    });

    // Remove obsolete password/login logic; only provide back-to-home navigation
    const adminBackToHomeBtn = document.getElementById('admin-back-to-home');
    if (adminBackToHomeBtn) {
        adminBackToHomeBtn.addEventListener('click', () => switchView('home'));
    }

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
    const clearQuizBtn = document.getElementById('clear-quiz-btn');
    if(clearQuizBtn) {
        clearQuizBtn.addEventListener('click', () => {
            // Inline non-blocking confirmation UX with undo
            const existing = document.getElementById('danger-status');
            if (existing) existing.remove();
            const status = document.createElement('div');
            status.id = 'danger-status';
            status.className = 'status-message warning';
            status.style.marginTop = '0.75rem';
            status.innerHTML = `⚠️ Delete all quiz data? <button id="confirm-clear" class="btn-danger" style="margin-left:.5rem;">Yes, Delete</button> <button id="cancel-clear" class="btn-secondary" style="margin-left:.5rem;">Cancel</button>`;
            clearQuizBtn.parentElement.appendChild(status);
            document.getElementById('cancel-clear').onclick = () => status.remove();
            document.getElementById('confirm-clear').onclick = () => {
                const backup = localStorage.getItem('quizData');
                const collectionsBackup = localStorage.getItem('quizCollections');
                localStorage.removeItem('quizData');
                localStorage.removeItem('quizCollections');
                loadSavedQuizzesList();
                status.innerHTML = `🗑️ All quiz data deleted. <button id="undo-clear" class="btn-secondary" style="margin-left:.5rem;">Undo</button>`;
                const undoBtn = document.getElementById('undo-clear');
                if (undoBtn) {
                    undoBtn.onclick = () => {
                        if (backup) localStorage.setItem('quizData', backup);
                        if (collectionsBackup) localStorage.setItem('quizCollections', collectionsBackup);
                        loadSavedQuizzesList();
                        status.textContent = '✅ Restore successful.';
                        setTimeout(()=>status.remove(), 3000);
                    };
                }
                setTimeout(()=>{ if (status && status.parentElement) status.remove(); }, 7000);
            };
        });
    }


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
    const instructionsBtn = document.getElementById('toggle-instructions');
    if(instructionsBtn) {
        instructionsBtn.addEventListener('click', toggleInstructions);
    }

    // Quick Guide Toggle (Home view)
    function toggleQuickGuide() {
        const panel = document.getElementById('quick-guide-panel');
        const icon = document.getElementById('quick-guide-icon');
        const text = document.getElementById('quick-guide-text');
        if (!panel || !icon || !text) return;
        if (panel.style.display === 'none' || panel.style.display === '') {
            panel.style.display = 'block';
            icon.textContent = '📗';
            text.textContent = 'Hide Quick Guide';
        } else {
            panel.style.display = 'none';
            icon.textContent = '📘';
            text.textContent = 'Show Quick Guide';
        }
    }
    const quickGuideBtn = document.getElementById('toggle-quick-guide');
    if (quickGuideBtn) quickGuideBtn.addEventListener('click', toggleQuickGuide);


    // ============================================
    // PDF UPLOAD HANDLER & DRAG-AND-DROP
    // ============================================
    let uploadedPDFContent = null;
    // Track whether we excluded first two pages and the last page during extraction
    let excludedFirstTwoAndLast = false;

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
            lastUploadedFileName = file.name;
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

                    // Exclude first 2 pages and last page when possible
                    const totalPages = pdf.numPages;
                    let startPage = 1;
                    let endPage = totalPages;
                    excludedFirstTwoAndLast = false;

                    if (totalPages > 3) {
                        startPage = 3; // skip pages 1 and 2
                        endPage = totalPages - 1; // skip last page
                        excludedFirstTwoAndLast = true;
                    }

                    for (let i = startPage; i <= endPage; i++) {
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
            lastUploadedFileName = event.target.files[0].name;
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
    // Cache for discovered models during a session
    let geminiModelCache = null;
    // Local fallback: create a concise hint that avoids disclosing the answer
    function generateNonRevealingHint(questionText, options) {
        try {
            const optionTexts = (options || []).map(o => (o && o.text ? String(o.text).toLowerCase() : ''));
            const q = String(questionText || '');
            const words = q.replace(/[\(\)\[\]\{\}\.,;:!?\"'`]/g,'').split(/\s+/).filter(Boolean);
            const stop = new Set(['the','is','are','was','were','a','an','and','or','of','to','in','on','for','with','by','from','that','this','these','those','as','at','be','it','its','into','about','which','what','who','whom','whose','when','where','why','how','can','could','should','would','may','might','must','does','do','did','has','have','had']);
            const keywords = [];
            for (const raw of words) {
                const w = raw.toLowerCase();
                if (w.length < 4) continue;
                if (stop.has(w)) continue;
                if (optionTexts.some(t=> t.includes(w))) continue; // avoid quoting options
                if (!keywords.includes(w)) keywords.push(w);
                if (keywords.length >= 4) break;
            }
            if (keywords.length >= 2) return `Consider the key ideas around: ${keywords.join(', ')}.`;
            return 'Focus on the underlying concept and definitions rather than examples or trivia.';
        } catch(_) {
            return 'Think about the key concepts without focusing on specific answer choices.';
        }
    }

    async function fetchAvailableModels(apiKey) {
        if (geminiModelCache) return geminiModelCache;
        try {
            const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
            if (!resp.ok) throw new Error('List models HTTP ' + resp.status);
            const data = await resp.json();
            if (!data.models) throw new Error('No models field in response');
            // Filter for text generation (generation_methods includes generateContent or undefined older spec)
            const usable = data.models.filter(m => !m.disabled && (!m.generationMethods || m.generationMethods.includes('generateContent')));
            // Rank: prefer pro, then flash, prefer higher version numbers
            const scored = usable.map(m => {
                const name = m.name || '';
                let score = 0;
                if (/pro/i.test(name)) score += 1000;
                if (/flash/i.test(name)) score += 100;
                const versionNum = (name.match(/(\d+(?:\.\d+)?)/) || [0,0])[1];
                score += parseFloat(versionNum)||0;
                return { model: name, meta: m, score };
            }).sort((a,b)=> b.score - a.score);
            geminiModelCache = scored.map(s => s.meta);
            return geminiModelCache;
        } catch (e) {
            console.warn('Failed to dynamically fetch models:', e.message);
            geminiModelCache = [];
            return geminiModelCache;
        }
    }

    async function generateQuizFromPDF() {
        const apiKey = document.getElementById('gemini-api-key').value.trim();
        const numQuestions = document.getElementById('num-questions').value;
        
        if (!apiKey) {
            showAiStatus('⚠️ Please enter your Gemini API key', 'error');
            return;
        }
        
        if (!uploadedPDFContent) {
            showAiStatus('⚠️ Please upload a PDF file first', 'error');
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
            // Force single required model usage
            const REQUIRED_MODEL = 'models/gemini-2.5-pro';
            const dynamicModels = await fetchAvailableModels(apiKey);
            const meta = dynamicModels.find(m => (m.name === REQUIRED_MODEL || m.name === REQUIRED_MODEL.replace('models/','')));
            if (!meta) {
                throw new Error(`Required model ${REQUIRED_MODEL} not available in API list.`);
            }
            if (typeof meta.inputTokenLimit !== 'number' || typeof meta.outputTokenLimit !== 'number') {
                throw new Error(`Required model ${REQUIRED_MODEL} missing token limit metadata.`);
            }
            const isRegeneration = !!localStorage.getItem('quizData');
                        const approxCharsPerToken = 4;
                        const maxChars = Math.max(1000, Math.floor(meta.inputTokenLimit * approxCharsPerToken * 0.9));
                        const pdfSlice = uploadedPDFContent.substring(0, maxChars);
                        const prompt = `You are an AI quiz generator. ${isRegeneration ? 'IMPORTANT: Produce a completely new, non-overlapping set of questions different from any previously generated for this PDF.' : 'Generate an initial set of questions.'}
Important: ${excludedFirstTwoAndLast ? 'The first two pages and the last page have been excluded from the excerpt. Do NOT generate questions based on any front matter or end material if residual text appears.' : 'Ignore the first two pages and the last page (front matter and references). Do NOT generate questions based on those pages.'}
Based on the following text from a PDF document, generate a JSON array of ${numQuestions} multiple-choice quiz questions.
The questions should cover distinct topics included in the document. For each question, provide four answer options, with exactly one correct answer. Include a brief explanation for the correct answer and explanations for every option.

DOCUMENT TEXT (truncated to fit model limit):
"""
${pdfSlice}
"""

REQUIREMENTS:
- Generate exactly ${numQuestions} multiple-choice questions.
- Each question must have exactly 4 distinct options.
- Exactly one option must have "correct": true.
- Each option MUST include its own explanation string.
- Each question MUST include a concise "hint" that helps recall/understanding without revealing the correct option or quoting any option text.
- If this is a regeneration request, DO NOT repeat or paraphrase earlier questions; focus on different concepts or angles.
- Avoid trivial duplication. Vary stems, verbs, and cognitive level (recall, understanding, application, analysis).
- Output ONLY a JSON array (no markdown fences, no commentary before or after).

JSON OUTPUT FORMAT (strict):
[
    {
        "question": "...",
        "hint": "...",
        "options": [
            {"text": "...", "correct": false, "explanation": "..."},
            {"text": "...", "correct": true, "explanation": "..."},
            {"text": "...", "correct": false, "explanation": "..."},
            {"text": "...", "correct": false, "explanation": "..."}
        ]
    }
]`;
            progressText.textContent = `Requesting model: ${REQUIRED_MODEL} ...`;
            const apiURL = `https://generativelanguage.googleapis.com/v1beta/${REQUIRED_MODEL}:generateContent?key=${apiKey}`;
            const respPrimary = await fetch(apiURL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.7, maxOutputTokens: meta.outputTokenLimit }
                })
            });
            if (!respPrimary.ok) {
                const errData = await respPrimary.json().catch(()=>({}));
                throw new Error(errData.error?.message || `HTTP ${respPrimary.status}`);
            }
            const data = await respPrimary.json();
            if (!data?.candidates?.length) {
                throw new Error('Empty candidates response from required model');
            }

            progressText.textContent = 'Processing AI response...';
            let generatedText = '';
            try {
                generatedText = data.candidates[0].content.parts.map(p => p.text || '').join('\n');
            } catch (e) {
                throw new Error('Unexpected response structure from model.');
            }
            
            // Clean up the response - remove markdown code blocks if present
            generatedText = generatedText
                .replace(/```json\s*/gi, '')
                .replace(/```/g, '')
                .trim();

            // Attempt to extract JSON if extra commentary exists
            const jsonMatch = generatedText.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('Model output did not include a JSON array.');
            }
            let rawJSONArray = jsonMatch[0];

            function repairJSONArray(raw) {
                let working = raw.trim();
                // Remove markdown artifacts just in case
                working = working.replace(/```/g,'');
                // Remove trailing commas before closing braces/brackets
                working = working.replace(/,\s*([}\]])/g, '$1');
                // Balance brackets rudimentarily
                const openSq = (working.match(/\[/g)||[]).length;
                const closeSq = (working.match(/\]/g)||[]).length;
                if (openSq > closeSq) {
                    working += ']'.repeat(openSq-closeSq);
                }
                // Trim anything after the last closing bracket
                const lastClose = working.lastIndexOf(']');
                if (lastClose !== -1) working = working.slice(0, lastClose+1);
                return working;
            }

            function salvageObjects(raw) {
                const objs = [];
                let depth = 0, start = -1;
                for (let i=0;i<raw.length;i++) {
                    const ch = raw[i];
                    if (ch === '{') {
                        if (depth === 0) start = i;
                        depth++;
                    } else if (ch === '}') {
                        depth--;
                        if (depth === 0 && start !== -1) {
                            const fragment = raw.slice(start, i+1);
                            try {
                                const obj = JSON.parse(fragment);
                                if (obj && obj.question && Array.isArray(obj.options)) objs.push(obj);
                            } catch(_) { /* ignore bad fragment */ }
                            start = -1;
                        }
                    }
                }
                return objs;
            }

            let questions = [];
            try {
                questions = JSON.parse(rawJSONArray);
            } catch (e1) {
                // Try repair heuristics
                let repaired = repairJSONArray(rawJSONArray);
                try {
                    questions = JSON.parse(repaired);
                    showAiStatus('⚠️ AI response was auto-repaired due to minor formatting issues.', 'error');
                } catch(e2) {
                    // Salvage individual objects
                    const salvaged = salvageObjects(repaired);
                    if (salvaged.length) {
                        questions = salvaged;
                        showAiStatus(`⚠️ Partial recovery: parsed ${salvaged.length} question(s) from malformed AI output.`, 'error');
                    } else {
                        throw new Error('Failed to parse JSON after repair attempts: ' + e1.message.substring(0,80));
                    }
                }
            }

            // Optionally expose raw output for debugging
            let rawOut = document.getElementById('ai-raw-output');
            if (!rawOut) {
                rawOut = document.createElement('pre');
                rawOut.id = 'ai-raw-output';
                rawOut.style.display = 'none';
                rawOut.style.maxHeight = '240px';
                rawOut.style.overflow = 'auto';
                rawOut.style.background = 'var(--bg-tertiary)';
                rawOut.style.padding = '0.75rem 1rem';
                rawOut.style.border = '1px solid var(--border-color)';
                const aiSection = document.getElementById('ai-section');
                if (aiSection) aiSection.appendChild(rawOut);
            }
            rawOut.textContent = generatedText;
            // Add a toggle button once
            if (!document.getElementById('toggle-raw-ai')) {
                const toggleBtn = document.createElement('button');
                toggleBtn.id = 'toggle-raw-ai';
                toggleBtn.textContent = '🔍 Show Raw AI Output';
                toggleBtn.className = 'btn-secondary';
                toggleBtn.style.marginTop = '0.5rem';
                toggleBtn.onclick = () => {
                    if (rawOut.style.display === 'none') {
                        rawOut.style.display = 'block';
                        toggleBtn.textContent = '🙈 Hide Raw AI Output';
                    } else {
                        rawOut.style.display = 'none';
                        toggleBtn.textContent = '🔍 Show Raw AI Output';
                    }
                };
                const aiSection = document.getElementById('ai-section');
                if (aiSection) aiSection.appendChild(toggleBtn);
            }
            
            // Validate
            if (!Array.isArray(questions) || questions.length === 0) {
                throw new Error('Invalid response format from AI');
            }
            
            progressText.textContent = 'Validating questions...';
            
            // Validate each question
            // Validate each question
            for (let i = 0; i < questions.length; i++) {
                const q = questions[i];
                if (!q.question || !q.options || q.options.length !== 4) {
                    throw new Error(`Question ${i + 1} is invalid`);
                }
                // Normalize & enrich data
                // Ensure hint exists and does not disclose any option text
                const leaksAnswer = (q.hint || '').toLowerCase().includes('correct') || (q.options||[]).some(o => o && o.text && q.hint && q.hint.toLowerCase().includes(String(o.text).toLowerCase()));
                if (!q.hint || typeof q.hint !== 'string' || leaksAnswer) {
                    q.hint = generateNonRevealingHint(q.question, q.options);
                }
                let correctFound = 0;
                q.options.forEach((opt, idx) => {
                    if (typeof opt.correct !== 'boolean') {
                        // Attempt inference if model returned answer field etc.
                        opt.correct = !!opt.isCorrect || /correct/i.test(opt.explanation || '') && !/incorrect/i.test(opt.explanation || '');
                    }
                    if (opt.correct) correctFound++;
                    if (!opt.explanation) {
                        opt.explanation = opt.correct ? 'This is the correct answer.' : 'This is an incorrect option.';
                    }
                });
                if (correctFound !== 1) {
                    throw new Error(`Question ${i + 1} does not have exactly one correct option after normalization.`);
                }
            }
            
            // If fewer than requested, attempt supplemental generations
            const desiredCount = parseInt(numQuestions, 10) || questions.length;
            let attempt = 0;
            const maxSupplemental = 5; // allow a couple more attempts

            async function supplementIfNeeded() {
                while (questions.length < desiredCount && attempt < maxSupplemental) {
                    attempt++;
                    const remaining = desiredCount - questions.length;
                    progressText.textContent = `Supplementing (batch ${attempt}) – need ${remaining} more...`;

                    // Provide prior question list (texts) so model can avoid duplication
                    const priorList = questions.map(q => q.question).slice(0, 100); // cap to avoid excessive tokens
                    const supplementalPrompt = `Important: ${excludedFirstTwoAndLast ? 'The provided excerpt excludes the first two pages and the last page; continue to ignore those and avoid questions from front matter or end material.' : 'Ignore the first two pages and the last page of the PDF; do not generate questions from front matter or ending/appendix material.'}\n\nYou previously generated ${questions.length} quiz question objects (JSON) for a PDF but need ${remaining} MORE distinct ones.\n\nDO NOT repeat, paraphrase, or trivially alter these existing question stems:\n${priorList.map(q=>`- ${q}`).join('\n')}\n\nReturn ONLY a JSON array of EXACTLY ${remaining} NEW question objects using the SAME schema (no markdown fences, no commentary). Each must have 4 options, exactly one with \"correct\": true, and every option needs an explanation. If you cannot produce exactly ${remaining}, produce as many as possible but try very hard to reach the target.`;

                    try {
                        const apiURLSupplement = `https://generativelanguage.googleapis.com/v1beta/${REQUIRED_MODEL}:generateContent?key=${apiKey}`;
                        const resp = await fetch(apiURLSupplement, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                contents: [{ parts: [{ text: supplementalPrompt }] }],
                                generationConfig: { temperature: 0.75, maxOutputTokens: meta.outputTokenLimit }
                            })
                        });
                        if (!resp.ok) {
                            await resp.json().catch(()=>({}));
                            continue; // try next batch
                        }
                        const supData = await resp.json();
                        let supText = '';
                        try { supText = supData.candidates[0].content.parts.map(p=>p.text||'').join('\n'); } catch(_) { continue; }
                        supText = supText.replace(/```json\s*/gi,'').replace(/```/g,'').trim();
                        const match = supText.match(/\[[\s\S]*\]/);
                        if (!match) continue;
                        let supRaw = match[0];
                        // Reuse repair + salvage utilities from above scope
                        let supArr = [];
                        try {
                            supArr = JSON.parse(supRaw);
                        } catch(e1) {
                            try { supArr = JSON.parse(repairJSONArray(supRaw)); } catch(e2) {
                                const salv = salvageObjects(supRaw);
                                if (salv.length) supArr = salv; else continue;
                            }
                        }
                        const existingQuestionsSet = new Set(questions.map(q => q.question.trim().toLowerCase()));
                        for (const q of supArr) {
                            if (!q || !q.question || !Array.isArray(q.options) || q.options.length !== 4) continue;
                            const key = q.question.trim().toLowerCase();
                            if (existingQuestionsSet.has(key)) continue;
                            // Minimal normalization (mirror earlier validation stage logic partly)
                            let correctFound = 0;
                            q.options.forEach(opt => { if (opt.correct) correctFound++; });
                            if (correctFound !== 1) continue;
                            existingQuestionsSet.add(key);
                            questions.push(q);
                            if (questions.length >= desiredCount) break;
                        }
                    } catch(_) {
                        // ignore and proceed to next attempt
                    }
                }
            }

            if (questions.length < desiredCount) {
                await supplementIfNeeded();
            }

            if (questions.length >= desiredCount) {
                if (questions.length > desiredCount) {
                    questions = questions.slice(0, desiredCount);
                }
                localStorage.setItem('quizData', JSON.stringify(questions));
                // Persist into collections with naming scheme
                const collections = getQuizCollections();
                const baseFileName = (lastUploadedFileName || 'Untitled').replace(/\.pdf$/i,'');
                const existingForFile = collections.items.filter(i => i.fileBase === baseFileName);
                const nextIndex = existingForFile.length + 1;
                const title = `${baseFileName} Quiz ${nextIndex}`;
                const id = `q_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
                collections.items.push({
                    id,
                    fileBase: baseFileName,
                    fileName: lastUploadedFileName || 'Unknown',
                    index: nextIndex,
                    title,
                    createdAt: Date.now(),
                    questions
                });
                collections.activeQuizId = id;
                saveQuizCollections(collections);
                loadSavedQuizzesList();
                progressDiv.style.display = 'none';
                generateBtn.disabled = false;
                generateBtn.style.opacity = '1';
                showAiStatus(`✅ Generated and saved ${questions.length} questions as "${title}"`, 'success');
            } else {
                // Do NOT save partial set (user wants strict exact outcome)
                progressDiv.style.display = 'none';
                generateBtn.disabled = false;
                generateBtn.style.opacity = '1';
                showAiStatus(`❌ Only generated ${questions.length} / ${desiredCount} questions. No partial quiz saved. Try: (1) Lowering requested count, (2) Providing a richer PDF excerpt, or (3) Retrying.`, 'error');
                return; // abort
            }
            
        } catch (error) {
            console.error('Error generating quiz:', error);
            progressDiv.style.display = 'none';
            generateBtn.disabled = false;
            generateBtn.style.opacity = '1';
            showAiStatus(`❌ Error: ${error.message}`, 'error');
        }
    }
    const generateBtn = document.getElementById('generate-btn');
    if(generateBtn) {
        generateBtn.addEventListener('click', generateQuizFromPDF);
    }

    function showAiStatus(message, type) {
        const aiStatusMessage = document.getElementById('ai-status-message');
        if (aiStatusMessage) {
            // Clear previous content
            aiStatusMessage.innerHTML = '';
            aiStatusMessage.className = `status-message ${type}`;

            // Message text
            const textSpan = document.createElement('span');
            textSpan.textContent = message;
            aiStatusMessage.appendChild(textSpan);

            // Close button (user must dismiss)
            const closeBtn = document.createElement('button');
            closeBtn.setAttribute('aria-label', 'Dismiss message');
            closeBtn.textContent = '✖';
            // Minimal inline styles so it matches surrounding text color and is easily tappable
            closeBtn.style.marginLeft = '0.75rem';
            closeBtn.style.background = 'transparent';
            closeBtn.style.border = 'none';
            closeBtn.style.cursor = 'pointer';
            closeBtn.style.color = 'inherit';
            closeBtn.style.fontSize = '1rem';
            closeBtn.style.fontWeight = '600';
            closeBtn.onclick = () => { aiStatusMessage.style.display = 'none'; };
            aiStatusMessage.appendChild(closeBtn);

            aiStatusMessage.style.display = 'block';
        }
    }

    // ============================================
    // ADMIN PANEL FUNCTIONALITY
    // ============================================
    const submitQuestionsBtn = document.getElementById('submit-questions');
    const questionsTextArea = document.getElementById('bulk-questions');
    const statusMessage = document.getElementById('status-message');

    if(submitQuestionsBtn) {
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

                // Persist into collections so it shows on Home with the provided name
                try {
                    const collections = getQuizCollections();
                    const manualNameEl = document.getElementById('manual-quiz-name');
                    const providedName = manualNameEl && manualNameEl.value.trim() ? manualNameEl.value.trim() : '';
                    const baseName = providedName || 'Manual';
                    const existingForFile = collections.items.filter(i => i.fileBase === baseName);
                    const nextIndex = existingForFile.length + 1;
                    const title = providedName ? providedName : `Manual Quiz ${nextIndex}`;
                    const id = `q_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
                    collections.items.push({
                        id,
                        fileBase: baseName,
                        fileName: 'Manual Entry',
                        index: nextIndex,
                        title,
                        createdAt: Date.now(),
                        questions: newQuestions
                    });
                    collections.activeQuizId = id;
                    saveQuizCollections(collections);
                    loadSavedQuizzesList();
                    // clear input fields
                    if (manualNameEl) manualNameEl.value = '';
                } catch (e) {
                    console.warn('Failed saving manual quiz to collections', e);
                }

                showStatus(`✅ Success! ${newQuestions.length} question(s) have been saved.`, 'success');
                questionsTextArea.value = '';
                
                // Show success for 3 seconds, then prompt to take quiz
                setTimeout(() => {
                    // Inline prompt instead of blocking confirm
                    const inline = document.createElement('div');
                    inline.className = 'status-message info';
                    inline.style.marginTop = '0.75rem';
                    inline.innerHTML = `Ready to take the quiz? <button id="go-to-quiz" class="btn-primary" style="margin-left:.5rem;">Start Now</button>`;
                    statusMessage.parentElement.appendChild(inline);
                    const btn = document.getElementById('go-to-quiz');
                    if (btn) btn.onclick = () => { switchView('quiz'); inline.remove(); };
                    setTimeout(()=> { if (inline && inline.parentElement) inline.remove(); }, 8000);
                }, 1200);

            } catch (error) {
                showStatus(`❌ Error: ${error.message}`, 'error');
            }
        });
    }

    function showStatus(message, type) {
        if(statusMessage) {
            statusMessage.textContent = message;
            statusMessage.className = `status-message ${type}`;
            statusMessage.style.display = 'block';

            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 5000);
        }
    }


    // ============================================
    // QUIZ FUNCTIONALITY
    // ============================================
    let quizData = [];
    let currentQuiz = 0;
    let score = 0;
    let wrongCount = 0;
    let answeredQuestions = new Set(); // Track which questions were answered
    let answerStatus = {}; // questionIndex -> 'correct' | 'wrong'

    const questionEl = document.getElementById('question');
    const optionsContainer = document.getElementById('options-container');
    const quizContainer = document.getElementById('quiz-container');

    function initQuiz() {
        const storedQuestions = localStorage.getItem('quizData');
        
        try {
            quizData = storedQuestions ? JSON.parse(storedQuestions) : getDefaultQuestions();
        } catch (e) {
            console.error('Error loading questions:', e);
            quizData = getDefaultQuestions();
        }
        
        if (!quizData || quizData.length === 0) {
            quizContainer.innerHTML = '<p>No questions available. Please add questions via the Admin Panel.</p>';
            return;
        }
        
        currentQuiz = 0;
        score = 0;
        wrongCount = 0;
        answeredQuestions = new Set();
        answerStatus = {};
        loadQuiz();
    }

    function getDefaultQuestions() {
        return [
            {
                "question": "Which of the following is a characteristic of the User Datagram Protocol (UDP)?",
                "hint": "Think about the connection type and reliability features.",
                "options": [
                    {"text": "Guaranteed delivery of packets", "correct": false, "explanation": "TCP, not UDP, guarantees packet delivery through acknowledgments and retransmissions."},
                    {"text": "Connection-oriented communication", "correct": false, "explanation": "UDP is connectionless; it sends datagrams without establishing a prior connection."},
                    {"text": "Unreliable and connectionless", "correct": true, "explanation": "UDP is connectionless and does not guarantee delivery, making it unreliable but fast."},
                    {"text": "Flow and congestion control", "correct": false, "explanation": "Flow and congestion control are features of TCP, designed to manage traffic and prevent network overload."}
                ]
            },
            {
                "question": "What is the main advantage of using UDP over TCP for certain applications?",
                "hint": "Consider the trade-off between reliability and speed.",
                "options": [
                    {"text": "Higher reliability and error checking", "correct": false, "explanation": "This is a characteristic of TCP. UDP prioritizes speed over reliability."},
                    {"text": "Lower overhead and faster transmission", "correct": true, "explanation": "UDP has a smaller header and no reliability mechanisms, resulting in lower overhead and faster speed."},
                    {"text": "In-order delivery of packets", "correct": false, "explanation": "TCP ensures packets are delivered in order, whereas UDP does not guarantee the order of arrival."},
                    {"text": "Robust congestion control", "correct": false, "explanation": "Congestion control is a key feature of TCP to prevent network collapse, which UDP lacks."}
                ]
            }
        ];
    }

    function loadQuiz() {
        // Restore the original quiz structure if it was replaced by results
        if (!document.getElementById('question')) {
            quizContainer.innerHTML = `
                <div class="quiz-title" id="current-quiz-title" style="margin-bottom:0.5rem; color:var(--text-secondary); font-weight:600;"></div>
                <div class="progress-container">
                    <div class="progress-track"><div id="progress-bar" class="progress-fill" style="width:0;"></div></div>
                    <span id="progress-text"></span>
                </div>
                <div id="question-nav" class="question-nav"></div>
                <h2 id="question"></h2>
                <ul id="options-container">
                    <li><label><input type="radio" name="answer" class="answer" id="a"><span id="a_text"></span></label></li>
                    <li><label><input type="radio" name="answer" class="answer" id="b"><span id="b_text"></span></label></li>
                    <li><label><input type="radio" name="answer" class="answer" id="c"><span id="c_text"></span></label></li>
                    <li><label><input type="radio" name="answer" class="answer" id="d"><span id="d_text"></span></label></li>
                </ul>
                <div id="quiz-controls"></div>
            `;
        }

        const questionEl = document.getElementById('question');
        const optionsContainer = document.getElementById('options-container');
        const quizControls = document.getElementById('quiz-controls');
    const navContainer = document.getElementById('question-nav');

        // Clear previous state
        quizControls.innerHTML = ''; // Clear buttons
        
        // Update quiz title above progress
        const quizTitleEl = document.getElementById('current-quiz-title');
        try {
            const active = getActiveQuiz();
            quizTitleEl.textContent = active && active.title ? active.title : (localStorage.getItem('quizTitle') || 'Current Quiz');
            // If the quiz is a manual one without stored title, prefer a clearer label
            if (!active || !active.title) {
                // If we have file info from collections, show the file base
                const collections = getQuizCollections();
                const activeId = collections.activeQuizId;
                if (!activeId) quizTitleEl.textContent = 'Custom Quiz';
            }
        } catch (e) {
            if (quizTitleEl) quizTitleEl.textContent = 'Current Quiz';
        }

        // Update progress bar (fill width)
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        const progress = ((currentQuiz + 1) / quizData.length) * 100;
        if (progressBar) {
            progressBar.style.width = `${progress}%`;
        }
        if (progressText) progressText.textContent = `${currentQuiz + 1} / ${quizData.length}`;

        // Build / rebuild question navigation buttons
        if (navContainer) {
            navContainer.innerHTML = '';
            quizData.forEach((_, idx) => {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'qn-btn';
                btn.textContent = idx + 1;
                if (idx === currentQuiz) btn.classList.add('active');
                if (answerStatus[idx] === 'correct') btn.classList.add('correct');
                else if (answerStatus[idx] === 'wrong') btn.classList.add('wrong');
                else if (answeredQuestions.has(idx)) btn.classList.add('answered');
                btn.addEventListener('click', () => {
                    if (idx === currentQuiz) return;
                    currentQuiz = idx;
                    loadQuiz();
                });
                navContainer.appendChild(btn);
            });
        }
        
        const currentQuizData = quizData[currentQuiz];
        
        // Clear previous hint
        const existingHint = document.getElementById('hint-container');
        if (existingHint) existingHint.remove();
        
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
        
        // Rebuild options fresh each time to avoid stale selection state
        optionsContainer.innerHTML = '';
        currentQuizData.options.forEach((opt, idx) => {
            const li = document.createElement('li');
            li.setAttribute('data-index', idx);
            // Create radio + label semantics for accessibility
            const label = document.createElement('label');
            label.style.display = 'flex';
            label.style.alignItems = 'center';
            label.style.width = '100%';

            const input = document.createElement('input');
            input.type = 'radio';
            input.name = 'answer';
            input.value = idx;
            input.style.marginRight = '0.75rem';
            input.addEventListener('change', () => handleOptionClick(idx));

            const span = document.createElement('span');
            span.textContent = opt.text;

            label.appendChild(input);
            label.appendChild(span);
            li.appendChild(label);
            li.addEventListener('click', (e) => {
                // Allow clicking anywhere in li to select radio if not yet answered
                const alreadyAnswered = li.parentElement.querySelector('[data-locked="true"]');
                if (alreadyAnswered) return; // prevent changes after answering
                input.checked = true;
                handleOptionClick(idx);
            });
            optionsContainer.appendChild(li);
        });
    }

    function handleOptionClick(selectedIndex) {
        const currentQuizData = quizData[currentQuiz];
        const isCorrect = currentQuizData.options[selectedIndex].correct;
        
        answeredQuestions.add(currentQuiz);
        
        if (isCorrect) {
            score++;
            answerStatus[currentQuiz] = 'correct';
        } else {
            wrongCount++;
            answerStatus[currentQuiz] = 'wrong';
        }
        
        const optionsList = document.querySelectorAll('#options-container li');
        const styles = getComputedStyle(document.documentElement);
        
        optionsList.forEach((li, idx) => {
            // Lock this option list
            li.setAttribute('data-locked', 'true');
            li.style.pointerEvents = 'none';
            
            const optionData = currentQuizData.options[idx];
            const wasSelected = idx === selectedIndex;
            
            // Add visual feedback
            if (optionData.correct) {
                li.style.backgroundColor = styles.getPropertyValue('--success-bg').trim();
                li.style.borderColor = styles.getPropertyValue('--success-border').trim();
            } else if (wasSelected) {
                li.style.backgroundColor = styles.getPropertyValue('--error-bg').trim();
                li.style.borderColor = styles.getPropertyValue('--error-border').trim();
            }
            
            // Add explanation below each option
            const explanation = document.createElement('div');
            explanation.className = 'explanation';
            explanation.style.color = optionData.correct ? styles.getPropertyValue('--success-text').trim() : styles.getPropertyValue('--text-secondary').trim();
            explanation.innerHTML = `<strong>${optionData.correct ? '✓' : '✕'}:</strong> ${optionData.explanation}`;
            li.appendChild(explanation);
        });
        
        // Show Next/Finish button
        const quizControls = document.getElementById('quiz-controls');
        const nextBtn = document.createElement('button');
        nextBtn.id = 'next-btn';
        
        if (currentQuiz < quizData.length - 1) {
            nextBtn.textContent = 'Next Question →';
            nextBtn.onclick = () => {
                currentQuiz++;
                loadQuiz();
            };
        } else {
            nextBtn.textContent = 'Finish & See Results';
            nextBtn.onclick = showResults;
        }
        quizControls.innerHTML = '';
        quizControls.appendChild(nextBtn);

        // Refresh nav styling after answer
        const navContainer = document.getElementById('question-nav');
        if (navContainer) {
            [...navContainer.children].forEach((btn, idx) => {
                btn.classList.remove('active','correct','wrong','answered');
                if (idx === currentQuiz) btn.classList.add('active');
                if (answerStatus[idx] === 'correct') btn.classList.add('correct');
                else if (answerStatus[idx] === 'wrong') btn.classList.add('wrong');
                else if (answeredQuestions.has(idx)) btn.classList.add('answered');
            });
        }
    }

    function showResults() {
        const percentage = quizData.length > 0 ? Math.round((score / quizData.length) * 100) : 0;
        const skippedCount = quizData.length - answeredQuestions.size;
        let performanceMsg = '';
        if (percentage >= 90) performanceMsg = '🏆 Outstanding performance!';
        else if (percentage >= 70) performanceMsg = '🌟 Great job! Keep it up.';
        else if (percentage >= 50) performanceMsg = '👍 Nice effort—review explanations to improve.';
        else performanceMsg = '📚 Keep practicing—retake and use hints!';

        // Fallback color for --warning-text if not defined
        const styles = getComputedStyle(document.documentElement);
        const warningColor = styles.getPropertyValue('--warning-text')?.trim() || '#b7791f';

        let resultsHTML = `
            <div class="result-container">
                <h2 style="margin-top:0;">Quiz Complete!</h2>
                <p style="margin:0 0 1.25rem 0; font-weight:500; color: var(--text-secondary);">${performanceMsg}</p>
                
                <div class="score-grid" style="display:grid; gap:1rem; grid-template-columns: repeat(auto-fit,minmax(140px,1fr)); margin-bottom:1.5rem;">
                    <div class="score-card" style="background: var(--bg-tertiary); padding:1rem; border:1px solid var(--border-color); border-radius:12px; text-align:center;">
                        <div class="score-label" style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; color: var(--text-tertiary);">Score</div>
                        <div class="score-value" style="font-size:1.4rem; font-weight:700; color: var(--text-primary);">${score}/${quizData.length}</div>
                    </div>
                    <div class="score-card" style="background: var(--bg-tertiary); padding:1rem; border:1px solid var(--border-color); border-radius:12px; text-align:center;">
                        <div class="score-label" style="font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; color: var(--text-tertiary);">Accuracy</div>
                        <div class="score-value" style="font-size:1.4rem; font-weight:700; color: var(--accent-primary);">${percentage}%</div>
                    </div>
                    <div class="score-card" style="background: var(--bg-tertiary); padding:1rem; border:1px solid var(--border-color); border-radius:12px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.75rem; text-transform:uppercase; letter-spacing:0.5px; color: var(--text-tertiary); margin-bottom:0.5rem;">Breakdown</div>
                        <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0.35rem; text-align:center; font-size:0.75rem;">
                            <div style="background: var(--success-bg); padding:0.4rem 0; border-radius:6px; color: var(--success-text); font-weight:600;">✔ ${score}</div>
                            <div style="background: var(--error-bg); padding:0.4rem 0; border-radius:6px; color: var(--error-text); font-weight:600;">✖ ${wrongCount}</div>
                            <div style="background: var(--hint-bg); padding:0.4rem 0; border-radius:6px; color: ${warningColor}; font-weight:600;">⏭ ${skippedCount}</div>
                        </div>
                    </div>
                </div>

                <div style="margin-bottom:1.25rem; font-size:0.85rem; line-height:1.5; color: var(--text-secondary); background: var(--bg-tertiary); padding:1rem 1.25rem; border:1px solid var(--border-color); border-radius:10px;">
                    <strong>Tip:</strong> Retake the quiz to improve weak areas. Use hints strategically and read every explanation—mastery comes from understanding mistakes.
                </div>
                
                <div class="result-actions">
                    <button id="restart-quiz">Retake Quiz</button>
                    <button id="back-to-home">Back to Home</button>
                </div>
        `;

        // Add "Generate More" section if quiz was from a PDF
        if (uploadedPDFContent) {
            resultsHTML += `
                <div class="generate-more-container">
                    <h3>Want more practice?</h3>
                    <p>Generate a new set of questions from the same PDF.</p>
                    <button id="generate-more-btn">Generate More Questions</button>
                </div>
            `;
        }

        resultsHTML += `</div>`;
        quizContainer.innerHTML = resultsHTML;
        
        // Add event listeners for new buttons
        document.getElementById('restart-quiz').addEventListener('click', initQuiz);
        document.getElementById('back-to-home').addEventListener('click', () => switchView('home'));
        
        if (uploadedPDFContent) {
            const generateMoreBtn = document.getElementById('generate-more-btn');
            if (generateMoreBtn) {
                generateMoreBtn.addEventListener('click', () => {
                    switchView('admin');
                    setTimeout(() => {
                        const generateBtn = document.getElementById('generate-btn');
                        if (generateBtn) {
                            // Clear existing quizData to encourage generation of new questions
                            try { localStorage.removeItem('quizData'); } catch(e) {}
                            generateBtn.click();
                        }
                    }, 150);
                });
            }
        }
    }

    // Initial call if on quiz page
    if (document.getElementById('quiz-view').classList.contains('active')) {
        initQuiz();
    }

    // Always render saved quizzes section
    loadSavedQuizzesList();
});
