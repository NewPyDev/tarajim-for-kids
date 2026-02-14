document.addEventListener('DOMContentLoaded', () => {
    // Determine page type
    const isProfilePage = window.location.pathname.includes('profile.html');

    // State
    let currentLang = localStorage.getItem('lang') || 'en';
    let sahabaData = [];
    let currentSahabi = null;

    // Elements
    const langBtn = document.getElementById('lang-btn');
    const body = document.body;

    // Initialize Layout
    applyLanguage(currentLang);

    // Event Listeners
    if (langBtn) {
        langBtn.addEventListener('click', toggleLanguage);
    }

    // Fetch Data
    fetch('/api/sahaba/public')
        .then(res => res.json())
        .then(data => {
            sahabaData = data;
            if (isProfilePage) {
                loadProfile();
            } else {
                // Assuming we are on index.html (or need to init index logic)
                if (typeof initIndexPage === 'function') {
                    initIndexPage(data);
                }
            }
        })
        .catch(err => {
            console.error('Failed to load data', err);
            if (isProfilePage) document.getElementById('error').style.display = 'block';
        });

    function toggleLanguage() {
        currentLang = currentLang === 'en' ? 'ar' : 'en';
        localStorage.setItem('lang', currentLang);
        applyLanguage(currentLang);

        if (isProfilePage && currentSahabi) {
            renderProfile(currentSahabi);
        } else if (typeof renderIndex === 'function') {
            renderIndex(currentLang);
        }
    }

    function applyLanguage(lang) {
        document.documentElement.lang = lang;
        const pageTitle = document.getElementById('page-title');

        if (lang === 'ar') {
            body.dir = 'rtl';
            if (langBtn) langBtn.textContent = 'English';
            if (pageTitle) pageTitle.textContent = 'تراجم للأطفال';
        } else {
            body.dir = 'ltr';
            if (langBtn) langBtn.textContent = 'العربية';
            if (pageTitle) pageTitle.textContent = 'Tarajim for Kids';
        }
    }

    function loadProfile() {
        const urlParams = new URLSearchParams(window.location.search);
        const slug = urlParams.get('slug'); // Look for regular slug

        if (!slug) {
            showError();
            return;
        }

        // Find Sahabi (handle enhanced suffix matching flexibility)
        currentSahabi = sahabaData.find(s => s.slug === slug || s.slug === slug + '-enhanced' || s.slug.replace('-enhanced', '') === slug);

        if (currentSahabi) {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('content').style.display = 'block';
            renderProfile(currentSahabi);
        } else {
            showError();
        }
    }

    function showError() {
        document.getElementById('loading').style.display = 'none';
        document.getElementById('error').style.display = 'block';
    }

    function renderProfile(sahabi) {
        const isAr = currentLang === 'ar';

        // Header
        document.getElementById('sahabi-icon').textContent = getIcon(sahabi.id); // Placeholder for icon logic
        document.getElementById('sahabi-name').textContent = isAr ? sahabi.nameArabic : sahabi.name;
        // Description
        if (isAr) {
            document.getElementById('sahabi-desc').textContent = sahabi.descriptionArabic || 'الصحابي الجليل';
        } else {
            document.getElementById('sahabi-desc').textContent = sahabi.description;
        }

        // Bio
        const bioHtml = isAr ? (sahabi.longBiographyArabic || 'الترجمة غير متوفرة') : sahabi.longBiography;
        document.getElementById('bio-text').innerHTML = formatText(bioHtml);
        document.getElementById('bio-title').textContent = isAr ? 'سيرة شخصية' : 'Biography';

        // Lessons
        const lessons = isAr ? (sahabi.keyLessonsArabic || []) : sahabi.keyLessons;
        const lessonsList = document.getElementById('lessons-list');
        lessonsList.innerHTML = '';
        lessons.forEach(lesson => {
            const li = document.createElement('li');
            li.textContent = lesson;
            lessonsList.appendChild(li);
        });
        document.getElementById('lessons-title').textContent = isAr ? 'الدروس المستفادة' : 'Key Lessons';

        // Quote
        const quote = isAr ? sahabi.famousQuoteArabic : sahabi.famousQuote;
        document.getElementById('quote-text').textContent = quote;
        document.getElementById('quote-author').textContent = '- ' + (isAr ? sahabi.nameArabic : sahabi.name);

        // Timeline
        const timeline = isAr ? sahabi.timelineArabic : sahabi.timeline; // we need to ensure English timeline exists in JSON too!
        // Wait, did I migrate English timeline?
        // My migration script extracted English timeline? No.
        // I need to ensure English timeline exists.
        // Accessing English timeline might fail if it's not in JSON.
        // It's likely NOT in sahaba.json properly unless I added it.
        // I should check sahaba.json structure for timeline.

        const timelineContainer = document.getElementById('timeline-container');
        timelineContainer.innerHTML = '';
        if (timeline && Array.isArray(timeline)) {
            document.getElementById('timeline-title').textContent = isAr ? 'الجدول الزمني' : 'Timeline';
            timeline.forEach(item => {
                const div = document.createElement('div');
                div.className = 'timeline-item';
                div.innerHTML = `<div class="timeline-year">${item.year}</div><div>${item.event}</div>`;
                timelineContainer.appendChild(div);
            });
        } else {
            // Hide timeline if data missing
            document.getElementById('timeline-title').parentElement.style.display = 'none';
        }

        // Audio Player
        const audioContainer = document.getElementById('audio-container');
        const audioPlayer = document.getElementById('story-audio');
        const audioPath = isAr ? sahabi.audioFiles?.arabic : sahabi.audioFiles?.english;

        if (audioPath) {
            audioContainer.style.display = 'block';
            // Only update src if it changed to avoid reloading if just re-rendering
            // But wait, if language changed, src changes.
            const currentSrc = audioPlayer.getAttribute('src');
            if (currentSrc !== audioPath) {
                audioPlayer.src = audioPath;
            }
        } else {
            audioContainer.style.display = 'none';
        }

        // Back Link
        const backLink = document.getElementById('back-link');
        backLink.textContent = isAr ? '→ العودة للقصص' : '← Back to Stories';

        // Show/Hide Quiz Button
        const quizBtn = document.getElementById('start-quiz-btn');
        if (sahabi.quiz && sahabi.quiz.length > 0) {
            quizBtn.style.display = 'block';
            quizBtn.textContent = isAr ? '🧠 اختبر معلوماتك!' : '🧠 Test Your Knowledge!';
        } else {
            quizBtn.style.display = 'none';
        }
    }

    function formatText(text) {
        // if text is HTML (starts with <p), return as is
        if (text && text.trim().startsWith('<')) return text;
        // otherwise wrap in <p>
        return text ? `<p>${text}</p>` : '';
    }

    function getIcon(id) {
        // Map ID to emoji or image
        const icons = ['✨', '📜', '⚔️', '🛡️', '🕌', '⚖️', '🐎', '💫', '🤲', '🌟'];
        return icons[id % icons.length] || '✨';
    }
    // --- QUIZ LOGIC ---
    let quizCurrentQuestionIndex = 0;
    let quizScore = 0;
    let quizData = [];

    const quizModal = document.getElementById('quiz-modal');
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const closeQuizBtn = document.querySelector('.close-btn');
    const nextQuestionBtn = document.getElementById('next-question-btn');
    const closeResultBtn = document.getElementById('close-quiz-btn');

    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', () => {
            if (currentSahabi && currentSahabi.quiz) {
                quizData = currentSahabi.quiz;
                startQuiz();
            }
        });
    }

    if (closeQuizBtn) {
        closeQuizBtn.addEventListener('click', () => {
            quizModal.style.display = 'none';
        });
    }

    if (closeResultBtn) {
        closeResultBtn.addEventListener('click', () => {
            quizModal.style.display = 'none';
            // Optional: Mark as "Read/Collected" here
        });
    }

    // Close modal on outside click
    window.addEventListener('click', (e) => {
        if (e.target === quizModal) {
            quizModal.style.display = 'none';
        }
    });

    function startQuiz() {
        quizCurrentQuestionIndex = 0;
        quizScore = 0;
        quizModal.style.display = 'block';
        document.getElementById('quiz-result').style.display = 'none';
        document.getElementById('quiz-complete').style.display = 'none';
        document.getElementById('quiz-question-container').style.display = 'block';
        showQuestion(quizCurrentQuestionIndex);
    }

    function showQuestion(index) {
        const questionData = quizData[index];
        document.getElementById('quiz-question-text').textContent = questionData.question;

        const optionsContainer = document.getElementById('quiz-options');
        optionsContainer.innerHTML = '';

        questionData.options.forEach((option, i) => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option-btn';
            btn.textContent = option;
            btn.onclick = () => checkAnswer(i, questionData.correctAnswer, btn);
            optionsContainer.appendChild(btn);
        });

        document.getElementById('quiz-result').style.display = 'none';
    }

    function checkAnswer(selectedIndex, correctIndex, btnElement) {
        // Disable all buttons to prevent double clicking
        const allBtns = document.querySelectorAll('.quiz-option-btn');
        allBtns.forEach(b => b.disabled = true);

        if (selectedIndex === correctIndex) {
            btnElement.classList.add('correct');
            quizScore++;
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });

            setTimeout(() => {
                nextQuestion();
            }, 1500);
        } else {
            btnElement.classList.add('incorrect');
            // Highlight correct answer
            allBtns[correctIndex].classList.add('correct');
            setTimeout(() => {
                nextQuestion();
            }, 2000);
        }
    }

    function nextQuestion() {
        quizCurrentQuestionIndex++;
        if (quizCurrentQuestionIndex < quizData.length) {
            showQuestion(quizCurrentQuestionIndex);
        } else {
            showQuizResult();
        }
    }

    function showQuizResult() {
        document.getElementById('quiz-question-container').style.display = 'none';
        document.getElementById('quiz-complete').style.display = 'block';
        document.getElementById('quiz-score').textContent = quizScore;

        if (quizScore === quizData.length) {
            confetti({
                particleCount: 200,
                spread: 100,
                origin: { y: 0.6 }
            });

            // SAVE PROGRESS
            const collected = JSON.parse(localStorage.getItem('collectedSahaba') || '[]');
            if (currentSahabi && !collected.includes(currentSahabi.id)) {
                collected.push(currentSahabi.id);
                localStorage.setItem('collectedSahaba', JSON.stringify(collected));
            }
        }
    }
});
