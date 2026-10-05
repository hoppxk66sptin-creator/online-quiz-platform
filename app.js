// Quản lý dữ liệu
let quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
let currentUser = null;
let currentQuiz = null;
let currentQuestionIndex = 0;
let userAnswers = {};
let quizStartTime = null;
let timerInterval = null;

// Chuyển đổi màn hình
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
}

// Đăng nhập
function goToRole(role) {
    currentUser = {
        role: role,
        id: Date.now(),
        name: role === 'admin' ? 'Giáo viên' : 'Học sinh ' + Date.now()
    };

    if (role === 'admin') {
        showScreen('adminScreen');
        loadQuizzes();
    } else {
        showScreen('studentScreen');
        loadQuizzesForStudent();
    }
}

// Đăng xuất
function logout() {
    currentUser = null;
    currentQuiz = null;
    showScreen('loginScreen');
}

// ADMIN FUNCTIONS
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const content = e.target.result;
        const questions = parseQuizContent(content);
        
        if (questions.length > 0) {
            document.getElementById('quizName').value = 'Quiz từ file - ' + file.name.replace(/\.[^/.]+$/, '');
            alert(`Đã tìm thấy ${questions.length} câu hỏi. Vui lòng tạo quiz để lưu.`);
            
            // Lưu tạm thời
            window.parsedQuestions = questions;
        } else {
            alert('Không thể đọc file. Vui lòng kiểm tra định dạng.');
        }
    };
    reader.readAsText(file);
}

// Phân tích nội dung file
function parseQuizContent(content) {
    const questions = [];
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    let currentQuestion = null;
    let optionCount = 0;
    const optionLetters = ['A', 'B', 'C', 'D'];

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Kiểm tra nếu là câu hỏi (kết thúc bằng ?)
        if (line.endsWith('?')) {
            if (currentQuestion && currentQuestion.options.length === 4) {
                questions.push(currentQuestion);
            }
            currentQuestion = {
                text: line,
                options: []
            };
            optionCount = 0;
        }
        // Kiểm tra nếu là đáp án
        else if (currentQuestion && optionLetters.includes(line.charAt(0)) && line.charAt(1) === ')') {
            const optionText = line.substring(3).trim();
            currentQuestion.options.push({
                text: optionText,
                letter: line.charAt(0)
            });
            optionCount++;
        }
    }

    // Thêm câu hỏi cuối cùng nếu hợp lệ
    if (currentQuestion && currentQuestion.options.length === 4) {
        questions.push(currentQuestion);
    }

    return questions;
}

// Tạo quiz mới
function createQuiz() {
    const name = document.getElementById('quizName').value.trim();
    const description = document.getElementById('quizDescription').value.trim();
    const timeLimit = parseInt(document.getElementById('quizTime').value) || 30;

    if (!name) {
        alert('Vui lòng nhập tên bài quiz');
        return;
    }

    if (!window.parsedQuestions || window.parsedQuestions.length === 0) {
        alert('Vui lòng tải dữ liệu từ file trước');
        return;
    }

    const newQuiz = {
        id: Date.now(),
        name: name,
        description: description,
        timeLimit: timeLimit,
        questions: window.parsedQuestions,
        createdAt: new Date().toLocaleString('vi-VN'),
        results: []
    };

    quizzes.push(newQuiz);
    saveQuizzes();
    
    // Reset form
    document.getElementById('quizName').value = '';
    document.getElementById('quizDescription').value = '';
    document.getElementById('quizTime').value = '30';
    document.getElementById('wordFileInput').value = '';
    window.parsedQuestions = [];

    alert('Tạo bài quiz thành công!');
    loadQuizzes();
}

// Tải danh sách quiz
function loadQuizzes() {
    const quizList = document.getElementById('quizList');
    
    if (quizzes.length === 0) {
        quizList.innerHTML = '<p class="empty-message">Chưa có bài quiz nào</p>';
        return;
    }

    quizList.innerHTML = quizzes.map(quiz => `
        <div class="quiz-card">
            <h3>${quiz.name}</h3>
            <p><strong>Mô tả:</strong> ${quiz.description || 'Không có'}</p>
            <p><strong>Số câu:</strong> ${quiz.questions.length}</p>
            <p><strong>Thời gian:</strong> ${quiz.timeLimit} phút</p>
            <p><strong>Kết quả:</strong> ${quiz.results.length} bài đã làm</p>
            <p><strong>Ngày tạo:</strong> ${quiz.createdAt}</p>
            <div class="quiz-card-actions">
                <button class="btn btn-primary" onclick="viewQuizDetails(${quiz.id})">Chi tiết</button>
                <button class="btn btn-secondary" onclick="deleteQuiz(${quiz.id})">Xóa</button>
            </div>
        </div>
    `).join('');
}

// Xem chi tiết quiz
function viewQuizDetails(quizId) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    alert(`Bài quiz: ${quiz.name}
Số câu hỏi: ${quiz.questions.length}
Thời gian: ${quiz.timeLimit} phút
Số bài đã làm: ${quiz.results.length}

Chi tiết câu hỏi:
${quiz.questions.map((q, i) => `${i + 1}. ${q.text}`).join('\n')}`);
}

// Xóa quiz
function deleteQuiz(quizId) {
    if (confirm('Bạn có chắc muốn xóa bài quiz này?')) {
        quizzes = quizzes.filter(q => q.id !== quizId);
        saveQuizzes();
        loadQuizzes();
    }
}

// Tải danh sách kết quả
function loadResults() {
    const resultsList = document.getElementById('resultsList');
    
    let allResults = [];
    quizzes.forEach(quiz => {
        quiz.results.forEach(result => {
            allResults.push({
                ...result,
                quizName: quiz.name
            });
        });
    });

    if (allResults.length === 0) {
        resultsList.innerHTML = '<p class="empty-message">Chưa có kết quả nào</p>';
        return;
    }

    resultsList.innerHTML = allResults.map(result => `
        <div class="result-card">
            <h3>${result.quizName}</h3>
            <p><strong>Học sinh:</strong> ${result.studentName}</p>
            <p><strong>Điểm:</strong> <span class="score-badge ${result.score >= 7 ? 'high' : 'low'}">${result.score.toFixed(2)}/10</span></p>
            <p><strong>Đúng:</strong> ${result.correct}/${result.total}</p>
            <p><strong>Thời gian:</strong> ${result.timeSpent} phút</p>
            <p><strong>Ngày làm:</strong> ${result.completedAt}</p>
        </div>
    `).join('');
}

// STUDENT FUNCTIONS
function loadQuizzesForStudent() {
    const quizListStudent = document.getElementById('quizListStudent');
    
    if (quizzes.length === 0) {
        quizListStudent.innerHTML = '<p class="empty-message">Chưa có bài quiz nào</p>';
        return;
    }

    quizListStudent.innerHTML = quizzes.map(quiz => `
        <div class="quiz-card">
            <h3>${quiz.name}</h3>
            <p>${quiz.description || 'Không có mô tả'}</p>
            <p><strong>Số câu:</strong> ${quiz.questions.length}</p>
            <p><strong>Thời gian:</strong> ${quiz.timeLimit} phút</p>
            <div class="quiz-card-actions">
                <button class="btn btn-primary" onclick="startQuiz(${quiz.id})">Bắt đầu</button>
            </div>
        </div>
    `).join('');
}

// Bắt đầu làm quiz
function startQuiz(quizId) {
    const quiz = quizzes.find(q => q.id === quizId);
    if (!quiz) return;

    currentQuiz = quiz;
    currentQuestionIndex = 0;
    userAnswers = {};
    quizStartTime = Date.now();

    showScreen('quizScreen');
    displayQuestion();
    startTimer();
}

// Hiển thị câu hỏi
function displayQuestion() {
    const question = currentQuiz.questions[currentQuestionIndex];
    const questionContainer = document.getElementById('questionContainer');
    
    document.getElementById('quizTitle').textContent = currentQuiz.name;
    document.getElementById('quizCurrentQuestion').textContent = `Câu ${currentQuestionIndex + 1} / ${currentQuiz.questions.length}`;

    const selectedAnswer = userAnswers[currentQuestionIndex];
    
    questionContainer.innerHTML = `
        <div class="question-text">${question.text}</div>
        <div class="options">
            ${question.options.map((option, index) => `
                <label class="option ${selectedAnswer === index ? 'selected' : ''}">
                    <input type="radio" 
                           name="answer" 
                           value="${index}" 
                           ${selectedAnswer === index ? 'checked' : ''}
                           onchange="selectAnswer(${index})">
                    <strong>${option.letter})</strong> ${option.text}
                </label>
            `).join('')}
        </div>
    `;
}

// Chọn đáp án
function selectAnswer(index) {
    userAnswers[currentQuestionIndex] = index;
}

// Câu hỏi tiếp theo
function nextQuestion() {
    if (currentQuestionIndex < currentQuiz.questions.length - 1) {
        currentQuestionIndex++;
        displayQuestion();
    }
}

// Câu hỏi trước
function previousQuestion() {
    if (currentQuestionIndex > 0) {
        currentQuestionIndex--;
        displayQuestion();
    }
}

// Nộp bài
function submitQuiz() {
    if (!confirm('Bạn có chắc muốn nộp bài? Không thể quay lại được!')) {
        return;
    }

    clearInterval(timerInterval);

    // Tính điểm
    let correct = 0;
    let total = currentQuiz.questions.length;
    
    currentQuiz.questions.forEach((question, index) => {
        const selectedOptionIndex = userAnswers[index];
        const selectedOption = question.options[selectedOptionIndex];
        
        // Kiểm tra đáp án đúng (giả sử đáp án đúng là option đầu tiên)
        // Trong thực tế, bạn cần thêm field "correctAnswer" trong dữ liệu
        // Hiện tại để demo, ta chấp nhận bất kỳ đáp án nào
    });

    // Tính thời gian
    const timeSpent = Math.round((Date.now() - quizStartTime) / 60000);

    // Lưu kết quả
    const result = {
        id: Date.now(),
        studentName: currentUser.name,
        studentId: currentUser.id,
        score: (correct / total * 10).toFixed(2),
        correct: correct,
        total: total,
        timeSpent: timeSpent,
        answers: userAnswers,
        completedAt: new Date().toLocaleString('vi-VN')
    };

    const quizIndex = quizzes.findIndex(q => q.id === currentQuiz.id);
    quizzes[quizIndex].results.push(result);
    saveQuizzes();

    showResults(result);
}

// Hiển thị kết quả
function showResults(result) {
    const resultsSummary = document.getElementById('resultsSummary');
    const resultsDetail = document.getElementById('resultsDetail');

    resultsSummary.innerHTML = `
        <h2>Hoàn thành bài quiz!</h2>
        <div class="results-stats">
            <div class="stat-item">
                <div class="stat-label">Điểm</div>
                <div class="stat-value">${result.score}/10</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Đúng</div>
                <div class="stat-value">${result.correct}/${result.total}</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Thời gian</div>
                <div class="stat-value">${result.timeSpent} phút</div>
            </div>
        </div>
    `;

    resultsDetail.innerHTML = `
        <h3>Chi tiết từng câu:</h3>
        ${currentQuiz.questions.map((question, index) => {
            const selectedOptionIndex = userAnswers[index];
            const selectedOption = selectedOptionIndex !== undefined ? question.options[selectedOptionIndex] : null;
            
            return `
                <div class="result-item">
                    <div class="result-question">Câu ${index + 1}: ${question.text}</div>
                    <div class="result-answer">
                        ${selectedOption ? 
                            `Câu trả lời của bạn: <strong>${selectedOption.letter}) ${selectedOption.text}</strong>` :
                            'Bạn chưa trả lời'
                        }
                    </div>
                </div>
            `;
        }).join('')}
    `;

    showScreen('resultsScreen');
}

// Bộ đếm giờ
function startTimer() {
    const timeLimit = currentQuiz.timeLimit * 60; // Đổi sang giây
    let timeRemaining = timeLimit;

    timerInterval = setInterval(() => {
        timeRemaining--;
        
        const minutes = Math.floor(timeRemaining / 60);
        const seconds = timeRemaining % 60;
        
        document.getElementById('timer').textContent = 
            `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

        if (timeRemaining <= 0) {
            clearInterval(timerInterval);
            alert('Hết thời gian! Bài quiz sẽ được nộp tự động.');
            submitQuiz();
        }
    }, 1000);
}

// Quay lại
function goBack() {
    if (currentUser.role === 'admin') {
        showScreen('adminScreen');
        loadQuizzes();
        loadResults();
    } else {
        showScreen('studentScreen');
        loadQuizzesForStudent();
    }
}

// Lưu vào localStorage
function saveQuizzes() {
    localStorage.setItem('quizzes', JSON.stringify(quizzes));
}

// Tải dữ liệu từ localStorage khi trang load
window.addEventListener('DOMContentLoaded', () => {
    quizzes = JSON.parse(localStorage.getItem('quizzes')) || [];
});

// Khởi tạo
showScreen('loginScreen');
