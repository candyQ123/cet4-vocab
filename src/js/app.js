// ===== 四级背单词助手 — 主逻辑 =====
(function () {
    'use strict';

    // ===== 状态 =====
    let currentWord = null;    // 当前显示的单词对象
    let isFlipped = false;    // 卡片是否已翻转
    let currentTab = 'learn';

    // ===== DOM 引用 =====
    const tabs = document.querySelectorAll('.nav-tab');
    const panels = document.querySelectorAll('.panel');

    // 学习模块 DOM
    const wordCard = document.getElementById('wordCard');
    const wordEn = document.getElementById('wordEn');
    const wordPhonetic = document.getElementById('wordPhonetic');
    const wordPos = document.getElementById('wordPos');
    const wordMeaning = document.getElementById('wordMeaning');
    const wordExample = document.getElementById('wordExample');
    const flipHint = document.getElementById('flipHint');
    const btnLearned = document.getElementById('btnLearned');
    const btnBookmark = document.getElementById('btnBookmark');
    const progressFill = document.getElementById('progressFill');
    const progressText = document.getElementById('progressText');
    const progressCard = document.getElementById('progressCard');
    const completeCard = document.getElementById('completeCard');

    // 复习模块 DOM
    const quizWord = document.getElementById('quizWord');
    const quizOptions = document.getElementById('quizOptions');
    const quizFeedback = document.getElementById('quizFeedback');
    const btnNextQuiz = document.getElementById('btnNextQuiz');
    const quizCorrect = document.getElementById('quizCorrect');
    const quizTotal = document.getElementById('quizTotal');
    const quizCard = document.getElementById('quizCard');
    const quizEmpty = document.getElementById('quizEmpty');
    const quizStats = document.getElementById('quizStats');

    // 复习状态
    let quizState = {
        correctCount: 0,
        totalCount: 0,
        currentQuestion: null,  // the WORDS item being tested
        answered: false
    };

    // ===== 标签切换 =====
    function switchTab(tabName) {
        currentTab = tabName;
        tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === tabName));
        panels.forEach(p => p.classList.toggle('active', p.id === tabName + '-panel'));
        if (tabName === 'learn') updateProgress();
        if (tabName === 'review') initQuiz();
        if (tabName === 'wordbook') renderWordbook();
        if (tabName === 'grammar') renderGrammar();
    }

    tabs.forEach(tab => {
        tab.addEventListener('click', function () {
            switchTab(this.dataset.tab);
        });
    });

    // ===== 学习模块 =====

    // 获取下一个要学习的单词（跳过已学过的）
    function getNextWord() {
        const learnedIds = Storage.getLearnedWordIds();
        const remaining = WORDS.filter(w => !learnedIds.includes(w.id));
        if (remaining.length === 0) return null;
        // 随机取一个
        const idx = Math.floor(Math.random() * remaining.length);
        return remaining[idx];
    }

    // 渲染单词卡片（正面）
    function renderWordCard(word) {
        currentWord = word;
        isFlipped = false;
        wordEn.textContent = word.word;
        wordPhonetic.textContent = word.phonetic;
        wordPos.textContent = word.pos;
        wordMeaning.textContent = '? ? ?';
        wordExample.textContent = '';
        flipHint.textContent = '点击卡片翻转查看释义';
        flipHint.style.display = 'block';
        wordCard.classList.remove('flipped');
        updateBookmarkBtn();
    }

    // 翻转卡片显示释义
    function flipCard() {
        if (!currentWord) return;
        isFlipped = true;
        wordMeaning.textContent = currentWord.meaning;
        wordExample.textContent = currentWord.example;
        flipHint.style.display = 'none';
        wordCard.classList.add('flipped');
    }

    // 卡片点击翻转
    wordCard.addEventListener('click', function () {
        if (!currentWord) return;
        if (!isFlipped) flipCard();
    });

    // "认识了"按钮
    btnLearned.addEventListener('click', function () {
        if (!currentWord || !isFlipped) {
            showToast('请先点击卡片翻看释义');
            return;
        }
        // 更新单词状态
        Storage.updateWordStatus(currentWord.id, {
            status: 'learned',
            lastReview: new Date().toISOString().slice(0, 10)
        });
        // 更新每日统计
        Storage.incrementTodayLearned();
        // 显示下一个词
        updateProgress();
        showNextOrComplete();
    });

    // "加入生词本"按钮
    btnBookmark.addEventListener('click', function () {
        if (!currentWord) return;
        if (Storage.isBookmarked(currentWord.id)) {
            Storage.removeBookmark(currentWord.id);
            showToast('已从生词本移除');
        } else {
            Storage.addBookmark(currentWord.id);
            showToast('已加入生词本');
        }
        updateBookmarkBtn();
    });

    function updateBookmarkBtn() {
        if (!currentWord) return;
        if (Storage.isBookmarked(currentWord.id)) {
            btnBookmark.textContent = '已在生词本中';
            btnBookmark.classList.add('btn-success');
            btnBookmark.classList.remove('btn-outline');
        } else {
            btnBookmark.textContent = '+ 加入生词本';
            btnBookmark.classList.remove('btn-success');
            btnBookmark.classList.add('btn-outline');
        }
    }

    // 显示下一个单词或完成提示
    function showNextOrComplete() {
        const nextWord = getNextWord();
        if (!nextWord) {
            // 全部学完
            wordCard.style.display = 'none';
            document.querySelector('#learn-panel .btn-group').style.display = 'none';
            progressCard.style.display = 'none';
            completeCard.style.display = 'block';
        } else {
            wordCard.style.display = 'flex';
            document.querySelector('#learn-panel .btn-group').style.display = 'flex';
            progressCard.style.display = 'block';
            completeCard.style.display = 'none';
            renderWordCard(nextWord);
        }
    }

    // 更新今日进度条
    function updateProgress() {
        const stats = Storage.getTodayStats();
        const settings = Storage.getSettings();
        const goal = settings.dailyGoal;
        const learned = stats.learned;
        const percent = Math.min(100, Math.round((learned / goal) * 100));
        progressFill.style.width = percent + '%';
        progressText.textContent = learned + ' / ' + goal;
    }

    // ===== Toast 提示 =====
    function showToast(msg) {
        const existing = document.querySelector('.toast');
        if (existing) existing.remove();
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
    }

    // ===== 复习模块（选择题） =====

    function initQuiz() {
        const learnedIds = Storage.getLearnedWordIds();
        if (learnedIds.length === 0) {
            quizCard.style.display = 'none';
            quizStats.style.display = 'none';
            quizEmpty.style.display = 'block';
            return;
        }
        quizCard.style.display = 'block';
        quizStats.style.display = 'flex';
        quizEmpty.style.display = 'none';
        updateQuizStats();
        generateQuestion();
    }

    function generateQuestion() {
        const learnedIds = Storage.getLearnedWordIds();
        if (learnedIds.length === 0) return;

        // 从已学单词中随机选题
        const learnedWords = WORDS.filter(w => learnedIds.includes(w.id));
        const correctWord = learnedWords[Math.floor(Math.random() * learnedWords.length)];
        quizState.currentQuestion = correctWord;
        quizState.answered = false;

        // 显示题目
        quizWord.textContent = correctWord.word;
        quizFeedback.textContent = '';
        btnNextQuiz.style.display = 'none';

        // 生成选项：1 正确 + 3 干扰项
        const otherWords = WORDS.filter(w => w.id !== correctWord.id);
        const distractors = [];
        while (distractors.length < 3) {
            const rand = otherWords[Math.floor(Math.random() * otherWords.length)];
            if (!distractors.includes(rand)) {
                distractors.push(rand);
            }
        }

        // 合并并打乱顺序
        const options = [correctWord, ...distractors];
        shuffleArray(options);

        // 渲染选项按钮
        quizOptions.innerHTML = '';
        options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'quiz-option';
            btn.textContent = opt.meaning;
            btn.addEventListener('click', function () {
                if (quizState.answered) return;
                handleAnswer(opt.id === correctWord.id, correctWord.meaning, btn);
            });
            quizOptions.appendChild(btn);
        });
    }

    function handleAnswer(isCorrect, correctMeaning, clickedBtn) {
        quizState.answered = true;
        quizState.totalCount++;

        // 高亮正确选项
        const allOptions = quizOptions.querySelectorAll('.quiz-option');
        allOptions.forEach(btn => {
            btn.style.pointerEvents = 'none';
            if (btn.textContent === correctMeaning) {
                btn.classList.add('correct');
            }
        });

        if (isCorrect) {
            quizState.correctCount++;
            clickedBtn.classList.add('correct');
            quizFeedback.innerHTML = '<span style="color:#4CAF50;">&#10004; 回答正确！</span>';
            Storage.updateWordStatus(quizState.currentQuestion.id, {
                correct: (Storage.getWordStatus(quizState.currentQuestion.id).correct || 0) + 1
            });
        } else {
            clickedBtn.classList.add('wrong');
            quizFeedback.innerHTML = '<span style="color:#F44336;">&#10008; 回答错误</span>&nbsp;&nbsp;正确答案：' + correctMeaning;
            Storage.updateWordStatus(quizState.currentQuestion.id, {
                wrong: (Storage.getWordStatus(quizState.currentQuestion.id).wrong || 0) + 1
            });
        }

        Storage.incrementTodayReviewed();
        updateQuizStats();
        btnNextQuiz.style.display = 'flex';
    }

    function updateQuizStats() {
        quizCorrect.textContent = quizState.correctCount;
        quizTotal.textContent = quizState.totalCount;
    }

    // 下一题按钮
    btnNextQuiz.addEventListener('click', function () {
        generateQuestion();
    });

    // 工具函数：洗牌
    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    // ===== 生词本模块 =====
    const wordbookList = document.getElementById('wordbookList');
    const wordbookEmpty = document.getElementById('wordbookEmpty');
    const inputNewWord = document.getElementById('inputNewWord');
    const inputNewMeaning = document.getElementById('inputNewMeaning');
    const btnAddWord = document.getElementById('btnAddWord');

    function renderWordbook() {
        const customWords = Storage.getCustomWords();
        const bookmarkedIds = Storage.getBookmarked();
        const bookmarkedWords = WORDS.filter(w => bookmarkedIds.includes(w.id));

        const totalCount = customWords.length + bookmarkedWords.length;
        wordbookEmpty.style.display = totalCount === 0 ? 'block' : 'none';

        let html = '';

        // 内置词库收藏的单词
        bookmarkedWords.forEach(w => {
            html += makeWordbookItem(w.id, w.word, null, w.meaning, true);
        });

        // 手动添加的生词
        customWords.forEach(w => {
            html += makeWordbookItem(w.id, w.word, null, w.meaning, false);
        });

        wordbookList.innerHTML = html;

        // 绑定删除事件
        wordbookList.querySelectorAll('.btn-delete-word').forEach(btn => {
            btn.addEventListener('click', function () {
                const id = this.dataset.id;
                const isBuiltin = this.dataset.builtin === 'true';
                if (isBuiltin) {
                    Storage.removeBookmark(id);
                    showToast('已从生词本移除');
                } else {
                    Storage.removeCustomWord(id);
                    showToast('已删除');
                }
                renderWordbook();
            });
        });
    }

    function makeWordbookItem(id, word, phonetic, meaning, isBuiltin) {
        const tag = isBuiltin ? '<span style="font-size:11px;background:#E3F2FD;color:#1976D2;padding:2px 8px;border-radius:10px;">词库</span>' : '';
        return `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #F0F0F0;">
                <div style="flex:1;">
                    <div style="font-size:16px;font-weight:600;color:#212121;">${word} ${tag}</div>
                    <div style="font-size:14px;color:#757575;margin-top:2px;">${meaning}</div>
                </div>
                <button class="btn btn-danger btn-sm btn-delete-word" data-id="${id}" data-builtin="${isBuiltin}">删除</button>
            </div>
        `;
    }

    // 添加生词按钮
    btnAddWord.addEventListener('click', function () {
        const word = inputNewWord.value.trim();
        const meaning = inputNewMeaning.value.trim();
        if (!word) { showToast('请输入英文单词'); return; }
        if (!meaning) { showToast('请输入中文释义'); return; }
        Storage.addCustomWord(word, meaning);
        inputNewWord.value = '';
        inputNewMeaning.value = '';
        showToast('已添加生词');
        renderWordbook();
    });

    // ===== 语法模块 =====
    const grammarContent = document.getElementById('grammarContent');

    function renderGrammar() {
        if (grammarContent.children.length > 0) return; // 只渲染一次

        // 按分类分组
        const categories = {};
        GRAMMAR.forEach(g => {
            if (!categories[g.category]) categories[g.category] = [];
            categories[g.category].push(g);
        });

        let html = '';
        for (const [cat, items] of Object.entries(categories)) {
            html += `<div class="card"><div class="card-title">${cat}</div>`;
            items.forEach(item => {
                html += `
                    <div class="grammar-category">
                        <div class="grammar-header" data-gid="${item.id}">
                            <span style="font-weight:600;">${item.title}</span>
                            <span style="color:#757575;font-size:12px;">&#9660;</span>
                        </div>
                        <div class="grammar-body" id="grammar-${item.id}">
                            <p style="color:#212121;line-height:1.8;">${item.content}</p>
                            <p style="color:#1976D2;margin-top:8px;font-style:italic;">${item.example}</p>
                        </div>
                    </div>
                `;
            });
            html += '</div>';
        }

        grammarContent.innerHTML = html;

        // 绑定展开/折叠事件
        grammarContent.querySelectorAll('.grammar-header').forEach(header => {
            header.addEventListener('click', function () {
                const gid = this.dataset.gid;
                const body = document.getElementById('grammar-' + gid);
                body.classList.toggle('open');
                const arrow = this.querySelector('span:last-child');
                arrow.textContent = body.classList.contains('open') ? '▲' : '▼';
            });
        });
    }

    // ===== 设置模块 =====
    const btnSettings = document.getElementById('btnSettings');
    const settingsModal = document.getElementById('settingsModal');
    const btnCloseSettings = document.getElementById('btnCloseSettings');
    const inputDailyGoal = document.getElementById('inputDailyGoal');
    const btnSaveGoal = document.getElementById('btnSaveGoal');
    const btnExport = document.getElementById('btnExport');
    const btnImport = document.getElementById('btnImport');
    const importFile = document.getElementById('importFile');
    const btnReset = document.getElementById('btnReset');

    function openSettings() {
        const settings = Storage.getSettings();
        inputDailyGoal.value = settings.dailyGoal;
        settingsModal.style.display = 'flex';
    }

    function closeSettings() {
        settingsModal.style.display = 'none';
    }

    btnSettings.addEventListener('click', openSettings);
    btnCloseSettings.addEventListener('click', closeSettings);
    settingsModal.addEventListener('click', function (e) {
        if (e.target === settingsModal) closeSettings();
    });

    // 保存每日目标
    btnSaveGoal.addEventListener('click', function () {
        const goal = parseInt(inputDailyGoal.value) || 20;
        const clamped = Math.max(5, Math.min(100, goal));
        Storage.saveSettings({ dailyGoal: clamped });
        inputDailyGoal.value = clamped;
        updateProgress();
        closeSettings();
        showToast('每日目标已更新为 ' + clamped + ' 个');
    });

    // 导出数据
    btnExport.addEventListener('click', function () {
        const data = Storage.exportAll();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'cet4_backup_' + new Date().toISOString().slice(0, 10) + '.json';
        a.click();
        URL.revokeObjectURL(url);
        showToast('数据已导出');
    });

    // 导入数据
    btnImport.addEventListener('click', function () {
        importFile.click();
    });

    importFile.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);
                if (confirm('确定要导入数据吗？当前数据将被覆盖。')) {
                    Storage.importAll(data);
                    showToast('数据已导入，请刷新页面');
                    setTimeout(() => location.reload(), 1500);
                }
            } catch (err) {
                showToast('文件格式不正确');
            }
        };
        reader.readAsText(file);
        this.value = '';
    });

    // 重置数据
    btnReset.addEventListener('click', function () {
        if (confirm('确定要删除所有学习数据吗？此操作不可恢复！\n\n建议先导出备份。')) {
            Storage.resetAll();
            showToast('数据已重置，请刷新页面');
            setTimeout(() => location.reload(), 1500);
        }
    });

    // ===== 初始化 =====
    function init() {
        switchTab('learn');
        const nextWord = getNextWord();
        if (nextWord) {
            renderWordCard(nextWord);
        } else {
            wordCard.style.display = 'none';
            document.querySelector('#learn-panel .btn-group').style.display = 'none';
            progressCard.style.display = 'none';
            completeCard.style.display = 'block';
        }
        updateProgress();
    }

    init();
    console.log('四级背单词助手已就绪 — ' + WORDS.length + ' 个内置单词');
})();
