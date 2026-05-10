// ===== localStorage 读写封装 =====
const Storage = {
    // 获取值
    get(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch (e) {
            console.warn('Storage.get 失败:', key, e);
            return fallback;
        }
    },

    // 设置值
    set(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('Storage.set 失败:', key, e);
            return false;
        }
    },

    // 删除键
    remove(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            return false;
        }
    },

    // ===== 单词进度 =====
    getWordsProgress() {
        return this.get('cet4_words_progress', {});
    },

    saveWordsProgress(progress) {
        return this.set('cet4_words_progress', progress);
    },

    // 获取某个单词的学习状态
    getWordStatus(wordId) {
        const progress = this.getWordsProgress();
        return progress[wordId] || { status: 'new', correct: 0, wrong: 0, lastReview: null };
    },

    // 更新某个单词的学习状态
    updateWordStatus(wordId, updates) {
        const progress = this.getWordsProgress();
        const current = progress[wordId] || { status: 'new', correct: 0, wrong: 0, lastReview: null };
        progress[wordId] = { ...current, ...updates };
        return this.saveWordsProgress(progress);
    },

    // 获取已学单词 ID 列表
    getLearnedWordIds() {
        const progress = this.getWordsProgress();
        return Object.keys(progress).filter(id => progress[id].status === 'learned');
    },

    // ===== 每日统计 =====
    getDailyStats() {
        return this.get('cet4_daily_stats', {});
    },

    getTodayStats() {
        const today = new Date().toISOString().slice(0, 10);
        const stats = this.getDailyStats();
        return stats[today] || { learned: 0, reviewed: 0 };
    },

    incrementTodayLearned() {
        const today = new Date().toISOString().slice(0, 10);
        const stats = this.getDailyStats();
        if (!stats[today]) stats[today] = { learned: 0, reviewed: 0 };
        stats[today].learned += 1;
        return this.set('cet4_daily_stats', stats);
    },

    incrementTodayReviewed() {
        const today = new Date().toISOString().slice(0, 10);
        const stats = this.getDailyStats();
        if (!stats[today]) stats[today] = { learned: 0, reviewed: 0 };
        stats[today].reviewed += 1;
        return this.set('cet4_daily_stats', stats);
    },

    // ===== 生词本（手动添加） =====
    getCustomWords() {
        return this.get('cet4_custom_words', []);
    },

    addCustomWord(word, meaning) {
        const words = this.getCustomWords();
        const item = {
            id: 'c' + Date.now(),
            word: word.trim(),
            meaning: meaning.trim(),
            added: new Date().toISOString().slice(0, 10)
        };
        words.unshift(item);
        this.set('cet4_custom_words', words);
        return item;
    },

    removeCustomWord(id) {
        const words = this.getCustomWords().filter(w => w.id !== id);
        return this.set('cet4_custom_words', words);
    },

    // ===== 收藏（从内置词库） =====
    getBookmarked() {
        return this.get('cet4_bookmarked', []);
    },

    addBookmark(wordId) {
        const list = this.getBookmarked();
        if (!list.includes(wordId)) {
            list.push(wordId);
            this.set('cet4_bookmarked', list);
        }
        return list;
    },

    removeBookmark(wordId) {
        const list = this.getBookmarked().filter(id => id !== wordId);
        return this.set('cet4_bookmarked', list);
    },

    isBookmarked(wordId) {
        return this.getBookmarked().includes(wordId);
    },

    // ===== 设置 =====
    getSettings() {
        return this.get('cet4_settings', { dailyGoal: 20 });
    },

    saveSettings(settings) {
        return this.set('cet4_settings', settings);
    },

    // ===== 数据导入/导出 =====
    exportAll() {
        return {
            wordsProgress: this.getWordsProgress(),
            dailyStats: this.getDailyStats(),
            customWords: this.getCustomWords(),
            bookmarked: this.getBookmarked(),
            settings: this.getSettings(),
            exportedAt: new Date().toISOString()
        };
    },

    importAll(data) {
        if (!data || typeof data !== 'object') return false;
        if (data.wordsProgress) this.set('cet4_words_progress', data.wordsProgress);
        if (data.dailyStats) this.set('cet4_daily_stats', data.dailyStats);
        if (data.customWords) this.set('cet4_custom_words', data.customWords);
        if (data.bookmarked) this.set('cet4_bookmarked', data.bookmarked);
        if (data.settings) this.set('cet4_settings', data.settings);
        return true;
    },

    // 重置所有数据
    resetAll() {
        ['cet4_words_progress', 'cet4_daily_stats', 'cet4_custom_words', 'cet4_bookmarked', 'cet4_settings']
            .forEach(k => this.remove(k));
    }
};
