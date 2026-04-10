(() => {
    'use strict';

    const SOURCE_LABELS = {
        converted_coursesd: 'Dcard 心得',
        data_json: '校務系統',
        opt_all_courses_with_experience: '學長姐經驗',
        fcu_scrape: 'fcu課程大綱',
        unknown: '其他',
        other: '其他'
    };

    const TAG_SYNONYM_MAP = {
        // 資訊/電腦
        'AI應用': ['ai', '人工智慧', 'machine learning', '深度學習', 'smart', '智慧應用', '機器學習', '神經網路'],
        '資料結構': ['資料結構', 'data structure'],
        '演算法': ['演算法', 'algorithm'],
        '計算機概論': ['計算機概論', '計概', 'computer science', '計算機'],
        '程式設計': ['程式設計', '程式語言', 'coding', 'programming', '程式開發', 'python', 'java', 'c++', 'javascript', 'c#', 'r語言', '物件導向'],
        '網頁設計': ['網頁設計', 'web design', 'html', 'css', '前端', '後端', '全端', 'react', 'vue', 'angular'],
        '資料庫': ['資料庫', 'database', 'sql', 'mysql', 'mongodb', '資料管理'],
        '資訊安全': ['資訊安全', 'information security', '資安', 'security', '密碼學', '網路安全'],
        '系統開發': ['系統開發', 'system development', '軟體開發', '軟體工程', '系統分析', '系統設計'],
        '作業系統': ['作業系統', 'operating system', 'os', 'linux', 'unix'],
        '計算機組織': ['計算機組織', '計算機結構', '計算機硬體', 'computer organization', 'computer architecture'],
        '編譯器': ['編譯器', 'compiler', '程式語言理論'],
        '雲端運算': ['雲端', 'cloud', 'aws', 'azure', 'gcp', '虛擬化'],
        '物聯網': ['物聯網', 'iot', 'internet of things', '嵌入式', 'arduino', 'raspberry'],
        '大數據': ['大數據', 'big data', '資料分析', 'data science', '資料探勘', 'data mining'],
        '多媒體': ['多媒體', 'multimedia', '影音', '影像設計', '剪輯', '動畫', '3d'],
        '影像處理': ['影像處理', 'image processing', 'computer vision', '電腦視覺', 'opencv'],
        '網路行銷': ['網路行銷', '數位行銷', 'digital marketing', '行銷', 'seo', '社群媒體'],
        // 電機/電子
        '電路學': ['電路學', '電路', 'circuit', '電子電路', '基本電學'],
        '電磁學': ['電磁學', 'electromagnetics', '電磁場'],
        '電子學': ['電子學', 'electronics', '半導體', '電晶體'],
        '訊號處理': ['訊號', 'signal processing', '數位訊號', 'dsp', '通訊'],
        '控制系統': ['控制系統', 'control system', '自動控制', '控制工程'],
        '電力系統': ['電力', 'power system', '電機', '馬達', '電能'],
        // 機械
        '機械設計': ['機械設計', 'machine design', '機構學', '機械元件'],
        '熱力學': ['熱力學', 'thermodynamics', '熱傳', '流體力學', '流力'],
        '材料力學': ['材料力學', 'mechanics of materials', '固體力學'],
        '動力學': ['動力學', 'dynamics', '靜力學', '工程力學'],
        '製造工程': ['製造', 'manufacturing', '加工', '金屬', '鑄造', '焊接'],
        'CAD/CAM': ['cad', 'cam', 'solidworks', 'autocad', '電腦輔助設計', '電腦輔助製造'],
        // 土木/建築
        '結構學': ['結構學', 'structural', '結構分析', '結構設計'],
        '大地工程': ['大地', 'geotechnical', '土壤力學', '基礎工程'],
        '水利工程': ['水利', 'hydraulics', '水文', '排水'],
        '測量學': ['測量', 'surveying', 'gis', '地理資訊'],
        '建築設計': ['建築設計', 'architectural design', '空間設計', '室內設計', '都市設計'],
        '建築史': ['建築史', '建築理論', '建築概論'],
        // 財金/商管
        '財務管理': ['財務管理', '財務', 'finance', '投資', '金融', '財金'],
        '會計': ['會計', 'accounting', '審計', '成本會計', '財務報表'],
        '經濟學': ['經濟學', 'economics', '個體經濟', '總體經濟', '計量經濟'],
        '統計': ['統計', 'statistics', '機率', '統計分析', '迴歸'],
        '管理': ['管理', 'management', '企業管理', '組織行為', '策略管理', '人力資源', '專案管理'],
        '行銷': ['行銷', 'marketing', '市場調查', '消費者行為', '品牌'],
        '國際貿易': ['國際貿易', '國貿', 'international trade', '關稅', '進出口'],
        '保險': ['保險', 'insurance', '風險管理'],
        '稅務': ['稅務', '租稅', '稅法'],
        // 語文
        '英文': ['英文', 'english', '英語', '多益', 'toeic', '托福', 'toefl', '英語聽說', '英語寫作'],
        '日文': ['日文', 'japanese', '日語'],
        '中文': ['中文', '國文', '中國文學', '古典文學', '現代文學', '漢字', '文學概論'],
        '德文': ['德文', 'german', '德語'],
        '法文': ['法文', 'french', '法語'],
        '韓文': ['韓文', 'korean', '韓語'],
        // 數理
        '微積分': ['微積分', 'calculus', '微分', '積分'],
        '線性代數': ['線性代數', 'linear algebra', '矩陣', '向量'],
        '離散數學': ['離散數學', 'discrete mathematics', '圖論', '組合數學'],
        '物理': ['物理', 'physics', '普通物理', '工程數學'],
        '化學': ['化學', 'chemistry', '有機化學', '無機化學', '分析化學'],
        '工程數學': ['工程數學', 'engineering mathematics', '常微分方程', '偏微分方程', '複變'],
        // 法政/社會
        '法律': ['法律', 'law', '民法', '刑法', '憲法', '商法', '行政法', '智慧財產'],
        '政治': ['政治', '公共政策', '行政', '政府', '民主'],
        '社會學': ['社會學', 'sociology', '社會', '社區'],
        '心理學': ['心理學', 'psychology', '認知', '諮商'],
        '歷史': ['歷史', 'history', '通史', '台灣史', '中國史', '世界史'],
        '哲學': ['哲學', 'philosophy', '倫理學', '邏輯'],
        // 生活/其他
        '體育': ['體育', 'physical education', 'pe', '羽球', '桌球', '籃球', '游泳', '瑜珈', '健身', '武術', '有氧'],
        '通識': ['通識', 'general education', '核心課程', '博雅'],
        '實習': ['實習', 'internship', '專題', '畢業專題', '產學'],
        '創業': ['創業', 'entrepreneurship', '創新', '新創'],
        '環境': ['環境', 'environment', '永續', '生態', '綠能', '能源'],
    };

    const TAG_COLOR_MAP = {
        // 資訊/電腦
        'AI應用': 'indigo', '資料結構': 'indigo', '演算法': 'indigo', '計算機概論': 'indigo',
        '編譯器': 'indigo', '作業系統': 'indigo', '計算機組織': 'indigo',
        '程式設計': 'sky', '網頁設計': 'sky', '系統開發': 'sky', '雲端運算': 'sky', '物聯網': 'sky',
        '資料庫': 'cyan', '資訊安全': 'cyan', '多媒體': 'cyan', '影像處理': 'cyan', '大數據': 'cyan',
        '網路行銷': 'amber', '行銷': 'amber',
        // 電機/機械
        '電路學': 'orange', '電磁學': 'orange', '電子學': 'orange', '訊號處理': 'orange',
        '控制系統': 'orange', '電力系統': 'orange',
        '機械設計': 'yellow', '熱力學': 'yellow', '材料力學': 'yellow',
        '動力學': 'yellow', '製造工程': 'yellow', 'CAD/CAM': 'yellow',
        // 土木/建築
        '結構學': 'stone', '大地工程': 'stone', '水利工程': 'stone',
        '測量學': 'stone', '建築設計': 'stone', '建築史': 'stone',
        // 財金/商管
        '財務管理': 'teal', '會計': 'teal', '經濟學': 'teal', '管理': 'teal',
        '國際貿易': 'teal', '保險': 'teal', '稅務': 'teal',
        '統計': 'orange',
        // 語文
        '英文': 'violet', '日文': 'violet', '中文': 'violet',
        '德文': 'violet', '法文': 'violet', '韓文': 'violet',
        // 數理
        '微積分': 'orange', '線性代數': 'orange', '離散數學': 'orange',
        '物理': 'orange', '化學': 'orange', '工程數學': 'orange',
        // 法政/社會
        '法律': 'purple', '政治': 'purple', '社會學': 'purple',
        '心理學': 'purple', '歷史': 'purple', '哲學': 'purple',
        // 生活/其他
        '體育': 'rose', '通識': 'purple', '實習': 'emerald',
        '創業': 'emerald', '環境': 'emerald',
    };

    const STORAGE_KEY_FAVORITES = 'course-search:favorites';
    const STORAGE_KEY_THEME = 'course-search:theme';

    const PAGE_SIZE = 20;
    const PDFJS_WORKER_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

    const state = {
        courses: [],
        coursesById: new Map(),
        favorites: new Map(),
        activeTagFilters: new Set(),
        activeSourceFilters: new Set(),
        hasSearched: false,
        suggestionIndex: -1,
        lastResults: [],
        displayedCount: 0,
        planner: {
            pool: [],
            selected: new Map(),
            uploadedCourses: [],
            targetCredits: 18,
            hasPlan: false,
            warnings: [],
            studentGrade: null,
            shuffleSeed: 0
        }
    };

    const elements = {
        searchForm: document.getElementById('search-form'),
        courseInput: document.getElementById('course-input'),
        userContext: document.getElementById('user-context'),
        sortSelect: document.getElementById('sort-select'),
        resultsSummary: document.getElementById('results-summary'),
        searchResults: document.getElementById('search-results'),
        suggestions: document.getElementById('suggestions'),
        minDifficulty: document.getElementById('min-difficulty'),
        maxDifficulty: document.getElementById('max-difficulty'),
        minScore: document.getElementById('min-score'),
        tagFilters: document.getElementById('tag-filter-container'),
        sourceFilters: document.getElementById('source-filter-container'),
        applyFilters: document.getElementById('apply-filters'),
        resetFilters: document.getElementById('reset-filters'),
        favoritesToggle: document.getElementById('favorites-toggle'),
        favoritesPanel: document.getElementById('favorites-panel'),
        favoritesBackdrop: document.getElementById('favorites-backdrop'),
        favoritesList: document.getElementById('favorites-list'),
        favoritesCount: document.getElementById('favorites-count'),
        favoritesSummary: document.getElementById('favorites-summary'),
        clearFavorites: document.getElementById('clear-favorites'),
        closeFavorites: document.getElementById('close-favorites'),
        themeToggle: document.getElementById('theme-toggle'),
        backToTop: document.getElementById('back-to-top'),
        plannerFile: document.getElementById('planner-file'),
        plannerTargetCredits: document.getElementById('planner-target-credits'),
        plannerGenerate: document.getElementById('planner-generate'),
        plannerReset: document.getElementById('planner-reset'),
        plannerSummary: document.getElementById('planner-summary'),
        plannerSelectedList: document.getElementById('planner-selected-list'),
        plannerCandidateList: document.getElementById('planner-candidate-list'),
        plannerTimetableWrap: document.getElementById('planner-timetable-wrap'),
        plannerTimetable: document.getElementById('planner-timetable'),
        plannerTimetableLegend: document.getElementById('planner-timetable-legend'),
        floatingTimetable: document.getElementById('floating-timetable'),
        floatingTimetableTable: document.getElementById('floating-timetable-table'),
    };

    if (!elements.searchForm) {
        return;
    }

    init();

    async function init() {
        try {
            applyStoredTheme();
            await loadCourses();
            loadFavorites();
            populateFilters();
            attachEvents();
            initializePlannerSection();
            restoreStateFromURL();
            runSearch({ force: true });
        } catch (error) {
            console.error('Failed to initialize course search UI:', error);
            showBootstrapError('課程資料載入失敗，請稍後再試。');
        }
    }

    async function loadCourses(retries = 3) {
        state.coursesById.clear();
        let lastError;

        async function fetchJson(url) {
            for (let attempt = 0; attempt < retries; attempt++) {
                try {
                    const response = await fetch(url, { cache: 'no-store' });
                    if (!response.ok) throw new Error(`Failed to load ${url}`);
                    return await response.json();
                } catch (error) {
                    lastError = error;
                    if (attempt < retries - 1) {
                        await new Promise((r) => setTimeout(r, 1000 * (attempt + 1)));
                    }
                }
            }
            return null;
        }

        // Load both data sources in parallel; fcu_courses.json is optional
        const [rawCourses, rawFcu] = await Promise.all([
            fetchJson('courses.json'),
            fetchJson('fcu_courses.json').catch(() => null),
        ]);

        if (!rawCourses) throw lastError;

        // Convert FCU scraped courses to the same shape as courses.json entries
        const fcuCourses = Array.isArray(rawFcu) ? rawFcu.map((item) => ({
            course:     item.course || '',
            teacher:    item.teacher || '',
            credits:    item.credits,
            review:     item.note || '',
            experience: '',
            score:      '',
            difficulty: null,
            semester:   item.semester || '',
            tag:        [],
            school:     'fcu',
            source:     'fcu_scrape',
            // pass through times so planner can use them
            times:      item.times || [],
            dept:       item.dept || '',
            required:   item.required || false,
            selCode:    item.selCode || '',
        })) : [];

        const EXCLUDED_SOURCES = new Set(['converted_coursesd', 'data_json', 'opt_all_courses_with_experience']);
        const filteredCourses = Array.isArray(rawCourses)
            ? rawCourses.filter((item) => {
                const src = (item.source ?? '').toString().trim().toLowerCase();
                return !EXCLUDED_SOURCES.has(src);
            })
            : [];
        const allRaw = [...filteredCourses, ...fcuCourses];
        state.courses = allRaw.map((item, index) => {
            const normalized = normalizeCourse(item, index);
            state.coursesById.set(normalized.id, normalized);
            return normalized;
        });
    }

    function normalizeCourse(item, index) {
        const rawTags = Array.isArray(item.tag)
            ? item.tag.filter(Boolean).map((tag) => String(tag).trim())
            : [];
        const rawSource = (item.source ?? '').toString().trim();
        const sourceKey = rawSource ? rawSource.toLowerCase() : 'unknown';
        const courseName = item.course?.trim() || '未提供課程名稱';
        const teacher = item.teacher?.trim() || '';
        const review = item.review?.trim() || '';
        const experience = item.experience?.trim() || '';
        const matchCorpus = [
            courseName,
            teacher,
            review,
            experience,
            rawTags.join(' '),
            item.school ?? ''
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        // Auto-detect tags from corpus
        const detectedTags = detectTagsFromCorpus(matchCorpus);
        const allTags = [...new Set([...rawTags, ...detectedTags])];

        const tagMeta = buildTagMeta(allTags, matchCorpus, sourceKey);
        const reliableTags = tagMeta
            .filter((meta) => meta.confidence === 'high')
            .map((meta) => meta.label);

        const rawScore = stringifyScore(item.score);
        const rawDifficulty = toDifficulty(item.difficulty);

        return {
            id: createCourseId(item, index),
            course: courseName,
            teacher,
            review,
            score: rawScore,
            difficulty: rawDifficulty,
            semester: item.semester?.trim() || '',
            tags: reliableTags,
            school: item.school?.trim() || '',
            sourceKey,
            sourceLabel: formatSource(sourceKey),
            experience,
            tagMeta,
            matchCorpus,
            // preserve planner-relevant fields from fcu_scrape entries
            times:    Array.isArray(item.times) ? item.times : [],
            credits:  item.credits != null ? Number(item.credits) : null,
            dept:     item.dept?.trim() || '',
            required: Boolean(item.required),
            selCode:  item.selCode?.trim() || '',
        };
    }

    function detectTagsFromCorpus(corpus) {
        const found = [];
        for (const [key, synonyms] of Object.entries(TAG_SYNONYM_MAP)) {
            // Check if key itself is in corpus
            if (corpus.includes(key.toLowerCase())) {
                found.push(key);
                continue;
            }
            // Check synonyms
            for (const syn of synonyms) {
                if (corpus.includes(syn.toLowerCase())) {
                    found.push(key);
                    break;
                }
            }
        }
        return found;
    }

    function createCourseId(course, index) {
        return [
            course.course ?? '',
            course.teacher ?? '',
            course.semester ?? '',
            course.source ?? '',
            index
        ].join('|');
    }

    function stringifyScore(value) {
        if (value === null || value === undefined) return '';
        return String(value).trim();
    }

    function toDifficulty(value) {
        if (value === null || value === undefined || value === '') return null;
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    }

    function applyStoredTheme() {
        const stored = localStorage.getItem(STORAGE_KEY_THEME);
        if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }

    function toggleTheme() {
        const root = document.documentElement;
        const isDark = root.classList.toggle('dark');
        localStorage.setItem(STORAGE_KEY_THEME, isDark ? 'dark' : 'light');
    }

    function loadFavorites() {
        state.favorites.clear();
        try {
            const raw = localStorage.getItem(STORAGE_KEY_FAVORITES);
            if (!raw) return;
            const storedIds = JSON.parse(raw);
            if (!Array.isArray(storedIds)) return;
            storedIds.forEach((id) => {
                const course = state.coursesById.get(id);
                if (course) {
                    state.favorites.set(id, course);
                }
            });
        } catch (error) {
            console.warn('Failed to restore favorites:', error);
        }
        updateFavoritesUI();
    }

    function saveFavorites() {
        const ids = Array.from(state.favorites.keys());
        localStorage.setItem(STORAGE_KEY_FAVORITES, JSON.stringify(ids));
    }

    function attachEvents() {
        elements.searchForm.addEventListener('submit', (event) => {
            event.preventDefault();
            runSearch({ force: true });
            hideSuggestions();
            elements.courseInput.blur();
        });

        elements.courseInput.addEventListener('input', handleSuggestionInput);
        elements.courseInput.addEventListener('focus', handleSuggestionInput);
        elements.courseInput.addEventListener('keydown', handleSuggestionKeydown);

        elements.sortSelect.addEventListener('change', () => {
            if (state.hasSearched) {
                runSearch({ force: true });
            }
        });

        [elements.minDifficulty, elements.maxDifficulty, elements.minScore].forEach((select) => {
            select.addEventListener('change', () => runSearch({ force: state.hasSearched }));
        });

        elements.applyFilters.addEventListener('click', () => {
            runSearch({ force: true });
        });
        elements.resetFilters.addEventListener('click', () => {
            resetFilterControls();
            runSearch({ force: state.hasSearched });
        });

        document.addEventListener('click', (event) => {
            if (!elements.suggestions.contains(event.target) && event.target !== elements.courseInput) {
                hideSuggestions();
            }
        });

        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape') {
                if (!elements.favoritesPanel.classList.contains('translate-x-full')) {
                    closeFavoritesPanel();
                } else {
                    hideSuggestions();
                }
            }
        });

        elements.favoritesToggle.addEventListener('click', toggleFavoritesPanel);
        elements.closeFavorites.addEventListener('click', closeFavoritesPanel);
        elements.favoritesBackdrop.addEventListener('click', closeFavoritesPanel);
        elements.clearFavorites.addEventListener('click', clearFavorites);

        if (elements.themeToggle) {
            elements.themeToggle.addEventListener('click', toggleTheme);
        }

        if (elements.plannerFile) {
            elements.plannerFile.addEventListener('change', handlePlannerFileUpload);
        }
        if (elements.plannerGenerate) {
            elements.plannerGenerate.addEventListener('click', generatePlannerRecommendation);
        }
        if (elements.plannerReset) {
            elements.plannerReset.addEventListener('click', resetPlannerState);
        }
        if (elements.plannerTargetCredits) {
            elements.plannerTargetCredits.addEventListener('change', () => {
                const nextValue = Number(elements.plannerTargetCredits.value);
                if (Number.isFinite(nextValue) && nextValue >= 0) {
                    state.planner.targetCredits = nextValue;
                }
            });
        }

        if (elements.backToTop) {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 300) {
                    elements.backToTop.classList.remove('opacity-0', 'invisible');
                } else {
                    elements.backToTop.classList.add('opacity-0', 'invisible');
                }
                updateFloatingTimetableVisibility();
            });

            elements.backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }

        const floatingClose = document.getElementById('floating-timetable-close');
        if (floatingClose) {
            floatingClose.addEventListener('click', () => {
                if (elements.floatingTimetable) {
                    elements.floatingTimetable.classList.add('hidden');
                    // 重新 scroll 才會再出現
                    elements.floatingTimetable.dataset.manuallyClosed = 'true';
                }
            });
        }
    }

    let suggestionDebounceTimer = null;

    function handleSuggestionInput() {
        clearTimeout(suggestionDebounceTimer);
        suggestionDebounceTimer = setTimeout(() => {
            const query = elements.courseInput.value.trim().toLowerCase();
            if (!query) {
                hideSuggestions();
                return;
            }
            const seen = new Set();
            const suggestions = [];
            for (const course of state.courses) {
                const lowerName = course.course.toLowerCase();
                if (lowerName.includes(query) && !seen.has(course.course)) {
                    suggestions.push(course.course);
                    seen.add(course.course);
                }
                if (suggestions.length >= 8) break;
            }
            state.suggestionIndex = -1;
            renderSuggestions(suggestions);
        }, 150);
    }

    function handleSuggestionKeydown(event) {
        const container = elements.suggestions;
        if (container.classList.contains('hidden')) return;
        const items = container.querySelectorAll('li');
        if (!items.length) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            state.suggestionIndex = Math.min(state.suggestionIndex + 1, items.length - 1);
            updateSuggestionHighlight(items);
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            state.suggestionIndex = Math.max(state.suggestionIndex - 1, -1);
            updateSuggestionHighlight(items);
        } else if (event.key === 'Enter' && state.suggestionIndex >= 0) {
            event.preventDefault();
            const selected = items[state.suggestionIndex];
            if (selected) {
                elements.courseInput.value = selected.textContent;
                hideSuggestions();
                runSearch({ force: true });
            }
        }
    }

    function updateSuggestionHighlight(items) {
        items.forEach((item, i) => {
            if (i === state.suggestionIndex) {
                item.classList.add('bg-notion-bg-hover', 'dark:bg-dark-border');
            } else {
                item.classList.remove('bg-notion-bg-hover', 'dark:bg-dark-border');
            }
        });
    }

    function renderSuggestions(suggestions) {
        const container = elements.suggestions;
        container.innerHTML = '';
        if (!suggestions.length) {
            container.classList.add('hidden');
            elements.courseInput.setAttribute('aria-expanded', 'false');
            return;
        }
        const fragment = document.createDocumentFragment();
        suggestions.forEach((text) => {
            const li = document.createElement('li');
            li.className = 'px-3.5 py-2 hover:bg-notion-bg-hover dark:hover:bg-dark-border cursor-pointer text-sm text-notion-text dark:text-dark-text transition-colors duration-100';
            li.setAttribute('role', 'option');
            li.textContent = text;
            li.addEventListener('click', () => {
                elements.courseInput.value = text;
                hideSuggestions();
                runSearch({ force: true });
            });
            fragment.appendChild(li);
        });
        container.appendChild(fragment);
        container.classList.remove('hidden');
        elements.courseInput.setAttribute('aria-expanded', 'true');
    }

    function hideSuggestions() {
        elements.suggestions.classList.add('hidden');
        elements.suggestions.innerHTML = '';
        elements.courseInput.setAttribute('aria-expanded', 'false');
    }

    function populateFilters() {
        populateTagFilters();
        populateSourceFilters();
    }

    function populateTagFilters() {
        const container = elements.tagFilters;
        container.innerHTML = '';
        const counts = new Map();
        state.courses.forEach((course) => {
            course.tags.forEach((tag) => {
                const key = tag.trim();
                if (!key) return;
                counts.set(key, (counts.get(key) || 0) + 1);
            });
        });
        if (!counts.size) {
            container.innerHTML = '';
            const emptySpan = document.createElement('span');
            emptySpan.className = 'text-xs text-notion-text-secondary';
            emptySpan.textContent = '暫無標籤';
            container.appendChild(emptySpan);
            return;
        }
        const sorted = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'zh-Hant'))
            .slice(0, 30);
        const fragment = document.createDocumentFragment();
        sorted.forEach(([tag, count]) => {
            const label = document.createElement('label');
            label.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-notion-border dark:border-dark-border bg-white dark:bg-dark-card text-xs text-notion-text-secondary dark:text-dark-text-secondary cursor-pointer hover:bg-notion-bg-hover dark:hover:bg-dark-border transition-colors duration-100 select-none';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = tag;
            checkbox.className = 'hidden peer';
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    state.activeTagFilters.add(tag);
                    label.classList.add('filter-chip-active');
                } else {
                    state.activeTagFilters.delete(tag);
                    label.classList.remove('filter-chip-active');
                }
                runSearch({ force: state.hasSearched });
            });
            label.append(checkbox, document.createTextNode(`${tag} (${count})`));
            fragment.appendChild(label);
        });
        container.appendChild(fragment);
    }

    function populateSourceFilters() {
        const container = elements.sourceFilters;
        container.innerHTML = '';
        const counts = new Map();
        state.courses.forEach((course) => {
            counts.set(course.sourceKey, (counts.get(course.sourceKey) || 0) + 1);
        });
        const sorted = Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1] || formatSource(a[0]).localeCompare(formatSource(b[0]), 'zh-Hant'));
        const fragment = document.createDocumentFragment();
        sorted.forEach(([sourceKey, count]) => {
            const label = document.createElement('label');
            label.className = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-notion-border dark:border-dark-border bg-white dark:bg-dark-card text-xs text-notion-text-secondary dark:text-dark-text-secondary cursor-pointer hover:bg-notion-bg-hover dark:hover:bg-dark-border transition-colors duration-100 select-none';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = sourceKey;
            checkbox.className = 'hidden peer';
            checkbox.addEventListener('change', () => {
                if (checkbox.checked) {
                    state.activeSourceFilters.add(sourceKey);
                    label.classList.add('filter-chip-active');
                } else {
                    state.activeSourceFilters.delete(sourceKey);
                    label.classList.remove('filter-chip-active');
                }
                runSearch({ force: state.hasSearched });
            });
            label.append(checkbox, document.createTextNode(`${formatSource(sourceKey)} (${count})`));
            fragment.appendChild(label);
        });
        container.appendChild(fragment);
    }

    function resetFilterControls() {
        elements.minDifficulty.value = '';
        elements.maxDifficulty.value = '';
        elements.minScore.value = '';
        state.activeTagFilters.clear();
        state.activeSourceFilters.clear();

        // Reset visual state of filter chips
        elements.tagFilters.querySelectorAll('label').forEach(label => {
            label.classList.remove('filter-chip-active');
            const input = label.querySelector('input');
            if (input) input.checked = false;
        });
        elements.sourceFilters.querySelectorAll('label').forEach(label => {
            label.classList.remove('filter-chip-active');
            const input = label.querySelector('input');
            if (input) input.checked = false;
        });
    }

    function showEmptyPrompt() {
        const container = elements.searchResults;
        container.innerHTML = '';
        const message = document.createElement('div');
        message.className = 'col-span-full py-12 text-center text-sm text-notion-text-secondary dark:text-dark-text-secondary rounded-lg border border-dashed border-notion-border dark:border-dark-border';
        const p = document.createElement('p');
        p.textContent = '輸入關鍵字並按下搜尋，即可開始查找課程。';
        message.appendChild(p);
        container.appendChild(message);
        elements.resultsSummary.classList.add('hidden');
    }

    function runSearch({ force = false } = {}) {
        const queryRaw = elements.courseInput.value.trim();
        const query = queryRaw.toLowerCase();
        const minDiff = parseSelectValue(elements.minDifficulty.value);
        const maxDiff = parseSelectValue(elements.maxDifficulty.value);
        const minScore = parseSelectValue(elements.minScore.value);

        if (
            force ||
            query ||
            state.activeTagFilters.size ||
            state.activeSourceFilters.size ||
            minDiff !== null ||
            maxDiff !== null ||
            minScore !== null
        ) {
            state.hasSearched = true;
        }

        if (!state.hasSearched) {
            showEmptyPrompt();
            return;
        }

        let results = state.courses.filter((course) => {
            if (query) {
                const tokens = query.split(/\s+/).filter(Boolean);
                const searchable = [
                    course.course,
                    course.teacher,
                    course.school,
                    course.review,
                    course.experience,
                    course.tags.join(' ')
                ]
                    .join(' ')
                    .toLowerCase();
                if (!tokens.every((token) => searchable.includes(token))) {
                    return false;
                }
            }

            if (state.activeTagFilters.size) {
                const normalizedTags = new Set(course.tags.map(normalizeTag));
                const corpus = course.matchCorpus || '';
                for (const tag of state.activeTagFilters) {
                    const normalizedFilter = normalizeTag(tag);
                    const phrases = getTagSearchPhrases(tag);
                    const matchesTag = normalizedTags.has(normalizedFilter);
                    const matchesReview = phrases.some((phrase) => phrase && corpus.includes(phrase));
                    if (!matchesTag && !matchesReview) {
                        return false;
                    }
                }
            }

            if (state.activeSourceFilters.size && !state.activeSourceFilters.has(course.sourceKey)) {
                return false;
            }

            if (minDiff !== null) {
                if (course.difficulty === null || course.difficulty < minDiff) {
                    return false;
                }
            }

            if (maxDiff !== null) {
                if (course.difficulty === null || course.difficulty > maxDiff) {
                    return false;
                }
            }

            if (minScore !== null) {
                const score = getNumericScore(course);
                if (score === null || score < minScore) {
                    return false;
                }
            }

            return true;
        });

        results = sortCourses(results);

        // 同課名同老師只保留第一筆（排序後最相關/最新的），不同老師各自保留
        {
            const seen = new Map();
            results = results.filter((course) => {
                const key = `${(course.course || '').trim()}|${(course.teacher || '').trim()}`;
                if (seen.has(key)) return false;
                seen.set(key, true);
                return true;
            });
        }

        renderResults(results);
        updateSummary(results.length, {
            query: queryRaw,
            tags: Array.from(state.activeTagFilters),
            sources: Array.from(state.activeSourceFilters),
            minDifficulty: minDiff,
            maxDifficulty: maxDiff,
            minScore,
            hasActiveFilters:
                Boolean(queryRaw) ||
                state.activeTagFilters.size ||
                state.activeSourceFilters.size ||
                minDiff !== null ||
                maxDiff !== null ||
                minScore !== null
        });
        syncStateToURL(queryRaw, minDiff, maxDiff, minScore);
    }
    function sortCourses(list) {
        const mode = elements.sortSelect.value;
        const collator = new Intl.Collator('zh-Hant', { numeric: true, sensitivity: 'base' });
        const copy = list.slice();
        if (mode === 'score') {
            copy.sort((a, b) => {
                const scoreA = getNumericScore(a);
                const scoreB = getNumericScore(b);
                const normA = scoreA === null ? -Infinity : scoreA;
                const normB = scoreB === null ? -Infinity : scoreB;
                if (normA !== normB) return normB - normA;
                return collator.compare(a.course, b.course);
            });
        } else if (mode === 'teacher') {
            copy.sort((a, b) => {
                const teacherCompare = collator.compare(a.teacher || '', b.teacher || '');
                if (teacherCompare !== 0) return teacherCompare;
                return collator.compare(a.course, b.course);
            });
        } else {
            copy.sort((a, b) => {
                const courseCompare = collator.compare(a.course, b.course);
                if (courseCompare !== 0) return courseCompare;
                return collator.compare(a.teacher || '', b.teacher || '');
            });
        }
        return copy;
    }

    function renderResults(courses) {
        const container = elements.searchResults;
        container.innerHTML = '';
        state.lastResults = courses;
        state.displayedCount = 0;

        if (!courses.length) {
            const message = document.createElement('div');
            message.className = 'col-span-full py-12 text-center text-sm text-notion-text-secondary dark:text-dark-text-secondary rounded-lg border border-dashed border-notion-border dark:border-dark-border';
            const p = document.createElement('p');
            p.textContent = state.hasSearched
                ? '找不到符合條件的課程，試著調整搜尋或放寬篩選條件。'
                : '輸入關鍵字即可開始搜尋課程。';
            message.appendChild(p);
            container.appendChild(message);
            return;
        }

        renderMoreResults();
    }

    function renderMoreResults() {
        const container = elements.searchResults;
        const courses = state.lastResults;
        const start = state.displayedCount;
        const end = Math.min(start + PAGE_SIZE, courses.length);
        const fragment = document.createDocumentFragment();

        for (let i = start; i < end; i++) {
            const card = createCourseCard(courses[i]);
            card.style.setProperty('--stagger-delay', `${Math.min(i - start, 12) * 30}ms`);
            card.classList.add('card-stagger');
            fragment.appendChild(card);
        }

        // Remove existing load-more button
        const existingBtn = container.querySelector('.load-more-btn');
        if (existingBtn) existingBtn.remove();

        container.appendChild(fragment);
        state.displayedCount = end;

        if (end < courses.length) {
            const loadMore = document.createElement('button');
            loadMore.type = 'button';
            loadMore.className = 'load-more-btn col-span-full mx-auto px-6 py-2.5 rounded-md text-sm font-medium bg-notion-bg-secondary dark:bg-dark-bg-secondary text-notion-text-secondary dark:text-dark-text-secondary hover:bg-notion-bg-hover dark:hover:bg-dark-border border border-notion-border dark:border-dark-border transition-colors duration-100';
            loadMore.textContent = `載入更多（還有 ${courses.length - end} 門）`;
            loadMore.addEventListener('click', () => renderMoreResults());
            container.appendChild(loadMore);
        }
    }

    function createCourseCard(course) {
        const card = document.createElement('article');
        card.className = 'notion-card flex flex-col gap-3.5';

        card.appendChild(createCardHeader(course));
        card.appendChild(createCardStats(course));

        if (course.review) {
            card.appendChild(createCardReview(course));
        }

        if (course.experience) {
            card.appendChild(createCardExperience(course));
        }

        card.appendChild(createCardTags(course));
        card.appendChild(createCardActions(course));

        return card;
    }

    function createCardHeader(course) {
        const header = document.createElement('div');
        header.className = 'flex flex-col gap-1.5';

        const title = document.createElement('h3');
        title.className = 'text-base font-semibold leading-snug';
        title.style.color = '#ffffff';
        if (course.selCode) {
            const codeSpan = document.createElement('span');
            codeSpan.className = 'font-mono mr-1.5';
            codeSpan.style.color = '#ffffff';
            codeSpan.textContent = `[${course.selCode}]`;
            title.appendChild(codeSpan);
            title.appendChild(document.createTextNode(course.course));
        } else {
            title.textContent = course.course;
        }
        header.appendChild(title);

        const metaRow = document.createElement('div');
        metaRow.className = 'flex flex-wrap items-center gap-2 text-sm';
        metaRow.style.color = '#ffffff';

        if (course.teacher) {
            const teacher = document.createElement('span');
            teacher.textContent = course.teacher;
            teacher.style.color = '#ffffff';
            metaRow.appendChild(teacher);
        }
        if (course.semester) {
            if (course.teacher) {
                const dot = document.createElement('span');
                dot.textContent = '\u00B7';
                dot.style.opacity = '0.5';
                dot.style.color = '#ffffff';
                metaRow.appendChild(dot);
            }
            const semester = document.createElement('span');
            semester.textContent = course.semester;
            semester.style.color = '#ffffff';
            metaRow.appendChild(semester);
        }
        const sourceBadge = document.createElement('span');
        sourceBadge.className = 'notion-tag';
        sourceBadge.style.color = '#ffffff';
        sourceBadge.style.backgroundColor = 'rgba(255,255,255,0.15)';
        sourceBadge.textContent = course.sourceLabel;
        metaRow.appendChild(sourceBadge);

        header.appendChild(metaRow);
        return header;
    }

    function formatCourseTimes(times) {
        if (!Array.isArray(times) || times.length === 0) return null;
        const DAY_ZH = { MON: '一', TUE: '二', WED: '三', THU: '四', FRI: '五', SAT: '六', SUN: '日' };
        const grouped = {};
        for (const slot of times) {
            const m = slot.match(/^([A-Z]+)(\d+)$/);
            if (!m) continue;
            const [, day, period] = m;
            if (!grouped[day]) grouped[day] = [];
            grouped[day].push(Number(period));
        }
        const dayOrder = ['MON','TUE','WED','THU','FRI','SAT','SUN'];
        return dayOrder
            .filter(d => grouped[d])
            .map(d => {
                const periods = grouped[d].sort((a, b) => a - b);
                // Compress consecutive periods into ranges
                const ranges = [];
                let start = periods[0], end = periods[0];
                for (let i = 1; i < periods.length; i++) {
                    if (periods[i] === end + 1) { end = periods[i]; }
                    else { ranges.push(start === end ? `${start}` : `${start}-${end}`); start = end = periods[i]; }
                }
                ranges.push(start === end ? `${start}` : `${start}-${end}`);
                return `週${DAY_ZH[d] || d}(${ranges.join(',')})`;
            })
            .join(' ');
    }

    function createCardStats(course) {
        const stats = document.createElement('div');
        stats.className = 'flex flex-wrap gap-3 text-xs text-notion-text-secondary dark:text-dark-text-secondary bg-notion-bg-secondary dark:bg-dark-bg-secondary px-3 py-2 rounded-md';

        const timesStr = formatCourseTimes(course.times);
        if (timesStr) {
            stats.appendChild(createStatLine('時段', timesStr));
        }

        return stats;
    }

    function createStatLine(label, value, valueClass = '') {
        const span = document.createElement('span');
        const labelNode = document.createTextNode(`${label}：`);
        const valueSpan = document.createElement('span');
        if (valueClass) valueSpan.className = valueClass;
        valueSpan.textContent = value;
        span.append(labelNode, valueSpan);
        return span;
    }

    function createCardReview(course) {
        const review = document.createElement('p');
        review.className = 'text-xs text-notion-text-secondary dark:text-dark-text-secondary leading-relaxed cursor-pointer hover:bg-notion-bg-hover dark:hover:bg-dark-border px-2 py-1.5 -mx-2 rounded-md transition-colors duration-100';
        const truncated = truncateText(course.review, 180);
        review.textContent = truncated.display;
        if (truncated.truncated) {
            review.dataset.full = course.review;
            review.dataset.preview = truncated.display;
            review.dataset.expanded = 'false';
            review.addEventListener('click', () => {
                const isExpanded = review.dataset.expanded === 'true';
                if (isExpanded) {
                    review.dataset.expanded = 'false';
                    review.textContent = review.dataset.preview;
                } else {
                    review.dataset.expanded = 'true';
                    review.textContent = review.dataset.full;
                }
            });
        } else {
            review.style.cursor = 'default';
        }
        return review;
    }

    function createCardExperience(course) {
        const experience = document.createElement('p');
        experience.className = 'text-xs text-notion-text-secondary dark:text-dark-text-secondary border-l-2 border-notion-border dark:border-dark-border pl-3 py-1 italic';
        experience.textContent = course.experience;
        return experience;
    }

    function createCardTags(course) {
        const tagsWrapper = document.createElement('div');
        tagsWrapper.className = 'flex flex-wrap gap-2';
        if (course.tagMeta.length) {
            course.tagMeta.slice(0, 8).forEach((meta) => {
                const tagChip = document.createElement('span');
                const color = TAG_COLOR_MAP[meta.label];
                if (meta.confidence === 'low') {
                    tagChip.className = `notion-tag tag-low-confidence ${color ? `tag-${color}` : 'bg-notion-bg-secondary dark:bg-dark-card text-notion-text-secondary dark:text-dark-text-secondary'}`;
                    tagChip.title = '標籤僅供參考（不納入篩選）';
                } else {
                    tagChip.className = `notion-tag ${color ? `tag-${color}` : 'bg-notion-bg-secondary dark:bg-dark-card text-notion-text-secondary dark:text-dark-text-secondary'}`;
                }
                tagChip.textContent = meta.label;
                tagsWrapper.appendChild(tagChip);
            });
            const remaining = course.tagMeta.length - 8;
            if (remaining > 0) {
                const moreChip = document.createElement('span');
                moreChip.className = 'notion-tag bg-notion-bg-secondary dark:bg-dark-card text-notion-text-secondary dark:text-dark-text-secondary';
                moreChip.textContent = `+${remaining}`;
                tagsWrapper.appendChild(moreChip);
            }
        }
        return tagsWrapper;
    }

    function createCardActions(course) {
        const actions = document.createElement('div');
        actions.className = 'flex flex-col gap-2.5 mt-auto pt-3 border-t border-notion-border dark:border-dark-border';

        const actionsRow = document.createElement('div');
        actionsRow.className = 'flex gap-1.5';

        const favoriteButton = document.createElement('button');
        favoriteButton.type = 'button';
        favoriteButton.className = 'flex-1 px-2.5 py-1.5 rounded-md text-xs font-medium text-white transition-colors duration-100';
        favoriteButton.style.backgroundColor = '#E57373';
        favoriteButton.addEventListener('mouseover', () => { favoriteButton.style.backgroundColor = '#C62828'; });
        favoriteButton.addEventListener('mouseout', () => { favoriteButton.style.backgroundColor = '#E57373'; });
        favoriteButton.textContent = state.favorites.has(course.id) ? '取消收藏' : '收藏';
        favoriteButton.addEventListener('click', () => {
            toggleFavorite(course);
            favoriteButton.textContent = state.favorites.has(course.id) ? '取消收藏' : '收藏';
            if (state.favorites.has(course.id)) {
                showToast('已加入收藏', 'success');
            } else {
                showToast('已取消收藏', 'success');
            }
        });

        const shareButton = document.createElement('button');
        shareButton.type = 'button';
        shareButton.className = 'px-2.5 py-1.5 rounded-md text-xs font-medium text-white transition-colors duration-100';
        shareButton.style.backgroundColor = '#5A5A5A';
        shareButton.addEventListener('mouseover', () => { shareButton.style.backgroundColor = '#3A3A3A'; });
        shareButton.addEventListener('mouseout', () => { shareButton.style.backgroundColor = '#5A5A5A'; });
        shareButton.textContent = '分享';
        shareButton.addEventListener('click', () => {
            shareCourse(course);
        });

        const aiResult = document.createElement('div');
        aiResult.className = 'hidden px-3 py-2.5 rounded-md bg-notion-bg-secondary dark:bg-dark-bg-secondary border border-notion-border dark:border-dark-border text-xs text-notion-text dark:text-dark-text leading-relaxed';

        const aiButton = document.createElement('button');
        aiButton.type = 'button';
        aiButton.className = 'flex-1 px-2.5 py-1.5 rounded-md text-xs font-medium bg-notion-accent text-white hover:bg-[#2899c8] transition-colors duration-100';
        aiButton.textContent = 'AI 評估';
        aiButton.addEventListener('click', () => {
            performAnalysis(course, aiResult, aiButton);
        });

        const dcardButton = document.createElement('a');
        dcardButton.href = `https://www.dcard.tw/search?query=${encodeURIComponent((course.course || '') + (course.teacher ? ' ' + course.teacher : ''))}&tab=post`;
        dcardButton.target = '_blank';
        dcardButton.rel = 'noopener noreferrer';
        dcardButton.className = 'px-2.5 py-1.5 rounded-md text-xs font-medium text-white transition-colors duration-100';
        dcardButton.style.backgroundColor = '#006AFF';
        dcardButton.addEventListener('mouseover', () => { dcardButton.style.backgroundColor = '#0055CC'; });
        dcardButton.addEventListener('mouseout', () => { dcardButton.style.backgroundColor = '#006AFF'; });
        dcardButton.textContent = 'Dcard 心得';

        actionsRow.append(favoriteButton, shareButton, dcardButton, aiButton);

        // 加入規劃按鈕（獨立一行，有框框）
        const addToPlanRow = document.createElement('div');
        addToPlanRow.className = 'border border-notion-border dark:border-dark-border rounded-md';

        const addToPlanBtn = document.createElement('button');
        addToPlanBtn.type = 'button';
        addToPlanBtn.className = 'w-full px-3 py-2 text-xs font-medium text-notion-text-secondary dark:text-dark-text-secondary hover:bg-notion-bg-hover dark:hover:bg-dark-border transition-colors duration-100 rounded-md';

        // 從搜尋課程卡片建構 planner-compatible 物件（不需背景說明）
        function buildPlannerEntryFromCard() {
            const timeSlots = Array.isArray(course.times) && course.times.length
                ? normalizePlannerTimes(course.times)
                : [];
            const credits = course.credits != null ? Number(course.credits) : inferPlannerCredits(course.tags || []);
            const matchCorpus = course.matchCorpus ||
                `${course.course} ${course.teacher} ${(course.tags || []).join(' ')} ${course.semester} ${course.dept || ''}`.toLowerCase();
            return {
                id: `card|${course.id}`,
                course: course.course,
                teacher: course.teacher || '',
                credits,
                timeSlots,
                required: false,
                pinned: false,
                tags: course.tags || [],
                review: course.review || course.experience || '',
                score: toPlannerNumber(course.score),
                difficulty: toPlannerNumber(course.difficulty),
                sourceKey: course.sourceKey || 'unknown',
                sourceLabel: course.sourceLabel || formatSource(course.sourceKey),
                matchCorpus,
                semester: course.semester || '',
                dept: course.dept || '',
                selCode: course.selCode || '',
                relevance: 0,
                fromCard: true,
            };
        }

        function getMatchInPool() {
            return state.planner.pool.find((p) =>
                p.course === course.course && p.teacher === course.teacher
            );
        }

        function hasPdfUploaded() {
            return Array.isArray(state.planner.uploadedCourses) && state.planner.uploadedCourses.length > 0;
        }

        function updateAddToPlanBtn() {
            addToPlanBtn.style.opacity = '';
            addToPlanBtn.disabled = false;

            if (!hasPdfUploaded()) {
                addToPlanBtn.textContent = '＋ 加入規劃（請先上傳 PDF）';
                return;
            }

            if (!Array.isArray(course.times) || !course.times.length) {
                addToPlanBtn.textContent = '本學期未開課';
                addToPlanBtn.disabled = true;
                addToPlanBtn.style.opacity = '0.5';
                return;
            }

            const match = getMatchInPool() ||
                state.planner.pool.find((p) => p.id === `card|${course.id}`);

            if (match) {
                if (state.planner.selected.has(match.id)) {
                    addToPlanBtn.textContent = '✓ 已在規劃中';
                    addToPlanBtn.disabled = true;
                    addToPlanBtn.style.opacity = '0.5';
                    return;
                }
                const checkMap = new Map(state.planner.selected);
                (state.planner.uploadedCourses || []).forEach((uc, i) => {
                    const ucEntry = state.planner.pool.find((p) => p.course === uc.course && p.teacher === uc.teacher)
                        || { ...uc, id: `uploaded-check|${i}`, timeSlots: normalizePlannerTimes(uc.times || []) };
                    if (!checkMap.has(ucEntry.id)) checkMap.set(ucEntry.id, ucEntry);
                });
                if (hasPlannerConflictWithSelected(match, checkMap)) {
                    addToPlanBtn.textContent = '✗ 衝堂無法加入';
                    addToPlanBtn.disabled = true;
                    addToPlanBtn.style.opacity = '0.5';
                    return;
                }
                const sameName = Array.from(state.planner.selected.values()).some(
                    (s) => s.course === course.course && s.id !== match.id
                );
                if (sameName) {
                    addToPlanBtn.textContent = '✗ 同名課程已加入';
                    addToPlanBtn.disabled = true;
                    addToPlanBtn.style.opacity = '0.5';
                    return;
                }
            }
            addToPlanBtn.textContent = '＋ 加入規劃';
        }

        updateAddToPlanBtn();
        document.addEventListener('planner-updated', updateAddToPlanBtn);

        addToPlanBtn.addEventListener('click', () => {
            if (!hasPdfUploaded()) {
                showToast('請先在課程規劃區上傳 PDF 課表。', 'error');
                return;
            }

            if (!Array.isArray(course.times) || !course.times.length) {
                showToast('此課程本學期無時段資料，可能未開課。', 'error');
                return;
            }

            let entry = getMatchInPool() ||
                state.planner.pool.find((p) => p.id === `card|${course.id}`);

            if (!entry) {
                entry = buildPlannerEntryFromCard();
                state.planner.pool.push(entry);
            }

            if (!state.planner.hasPlan) {
                state.planner.hasPlan = true;
                state.planner.targetCredits = state.planner.targetCredits || 22;
            }

            if (state.planner.selected.has(entry.id)) {
                showToast('此課程已在規劃中。', 'error');
                return;
            }

            // 衝堂判斷：同時檢查已選課程 + 已辨識的 PDF 課程（即使尚未產生課表建議）
            const checkMap = new Map(state.planner.selected);
            (state.planner.uploadedCourses || []).forEach((uc, i) => {
                const ucEntry = state.planner.pool.find((p) => p.course === uc.course && p.teacher === uc.teacher)
                    || { ...uc, id: `uploaded-check|${i}`, timeSlots: normalizePlannerTimes(uc.times || []) };
                if (!checkMap.has(ucEntry.id)) checkMap.set(ucEntry.id, ucEntry);
            });
            console.log('[衝堂檢查] entry.timeSlots:', entry.timeSlots);
            console.log('[衝堂檢查] uploadedCourses slots:', Array.from(checkMap.values()).map(c => ({ course: c.course, timeSlots: c.timeSlots })));
            if (hasPlannerConflictWithSelected(entry, checkMap)) {
                showToast('此課程與已辨識課程衝堂，無法加入。', 'error');
                return;
            }
            const sameName = Array.from(state.planner.selected.values()).some(
                (s) => s.course === course.course && s.id !== entry.id
            );
            if (sameName) {
                showToast('已有同名課程在規劃中。', 'error');
                return;
            }
            state.planner.selected.set(entry.id, entry);
            renderPlanner();
            showToast(`「${course.course}」已加入規劃。`, 'success');
        });

        addToPlanRow.appendChild(addToPlanBtn);
        actions.append(actionsRow, addToPlanRow, aiResult);
        return actions;
    }

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        const bgClass = type === 'success' ? 'bg-notion-text dark:bg-dark-text' : 'bg-notion-red';
        const textClass = type === 'success' ? 'text-white dark:text-dark-bg' : 'text-white';
        toast.className = `${bgClass} ${textClass} px-5 py-3 rounded-lg shadow-md flex items-center gap-2 text-sm font-medium transform translate-y-2 opacity-0 transition-all duration-200 pointer-events-auto`;

        toast.textContent = message;

        container.appendChild(toast);

        // Trigger reflow
        void toast.offsetWidth;
        toast.classList.remove('translate-y-2', 'opacity-0');

        setTimeout(() => {
            toast.classList.add('translate-y-2', 'opacity-0');
            setTimeout(() => {
                container.removeChild(toast);
            }, 300);
        }, 3000);
    }

    function shareCourse(course) {
        const isDuplicate = course.difficulty !== null && String(course.difficulty) === String(course.score);
        const scoreLine = isDuplicate
            ? `評分：${course.score || '－'}`
            : `分數：${course.score || '－'}\n難度：${course.difficulty !== null ? course.difficulty : '未提供'}`;
        const text = `
【${course.course}】
教師：${course.teacher || '未提供'}
${scoreLine}
評價：${course.review || '無'}
`.trim();

        navigator.clipboard.writeText(text).then(() => {
            showToast('課程資訊已複製', 'success');
        }).catch(() => {
            showToast('複製失敗', 'error');
        });
    }

    function truncateText(text, limit) {
        if (text.length <= limit) {
            return { display: text, truncated: false };
        }
        const clipped = text.slice(0, limit).replace(/\s+\S*$/, '');
        return { display: `${clipped}…`, truncated: true };
    }

    function toggleFavorite(course) {
        if (state.favorites.has(course.id)) {
            state.favorites.delete(course.id);
        } else {
            state.favorites.set(course.id, course);
        }
        saveFavorites();
        updateFavoritesUI();
    }

    function updateFavoritesUI() {
        elements.favoritesCount.textContent = state.favorites.size;
        elements.favoritesCount.classList.remove('scale-0');
        if (state.favorites.size === 0) elements.favoritesCount.classList.add('scale-0');

        elements.favoritesSummary.textContent = state.favorites.size
            ? `已收藏 ${state.favorites.size} 門課程`
            : '尚未收藏任何課程';
        renderFavoritesList();
    }

    function renderFavoritesList() {
        const container = elements.favoritesList;
        container.innerHTML = '';
        if (!state.favorites.size) {
            const empty = document.createElement('p');
            empty.className = 'text-center text-notion-text-secondary dark:text-dark-text-secondary text-xs py-8';
            empty.textContent = '將感興趣的課程加入收藏後，可快速建立比較清單。';
            container.appendChild(empty);
            return;
        }
        const fragment = document.createDocumentFragment();
        state.favorites.forEach((course) => {
            fragment.appendChild(createFavoriteCard(course));
        });
        container.appendChild(fragment);
    }

    function createFavoriteCard(course) {
        const card = document.createElement('article');
        card.className = 'bg-notion-bg-secondary dark:bg-dark-card p-3.5 rounded-lg border border-notion-border dark:border-dark-border flex flex-col gap-1.5';

        const title = document.createElement('h3');
        title.className = 'text-sm font-semibold text-notion-text dark:text-dark-text';
        title.textContent = course.course;
        card.appendChild(title);

        const meta = document.createElement('p');
        meta.className = 'text-xs text-notion-text-secondary dark:text-dark-text-secondary';
        meta.textContent = course.teacher ? course.teacher : '教師未提供';
        card.appendChild(meta);

        const stats = document.createElement('div');
        stats.className = 'flex gap-3 text-xs text-notion-text-secondary dark:text-dark-text-secondary mt-0.5';
        const diffValue = course.difficulty !== null ? String(course.difficulty) : null;
        const isDuplicate = diffValue !== null && diffValue === String(course.score);
        if (isDuplicate) {
            stats.appendChild(createStatLine('評分', course.score || '－', 'score-accent'));
        } else {
            stats.appendChild(createStatLine('分數', course.score || '－', 'score-accent'));
            if (course.difficulty !== null) {
                stats.appendChild(createStatLine('難度', course.difficulty));
            }
        }
        card.appendChild(stats);

        const removeButton = document.createElement('button');
        removeButton.type = 'button';
        removeButton.className = 'text-xs text-notion-red hover:underline self-start mt-1 font-medium';
        removeButton.textContent = '移除';
        removeButton.addEventListener('click', () => {
            state.favorites.delete(course.id);
            saveFavorites();
            updateFavoritesUI();
            runSearch({ force: state.hasSearched });
        });
        card.appendChild(removeButton);

        return card;
    }

    function toggleFavoritesPanel() {
        const panel = elements.favoritesPanel;
        const backdrop = elements.favoritesBackdrop;
        if (panel.classList.contains('translate-x-full')) {
            // Open
            panel.classList.remove('translate-x-full');
            backdrop.classList.remove('hidden');
            // Trigger reflow for opacity transition
            void backdrop.offsetWidth;
            backdrop.classList.remove('opacity-0');
            document.body.classList.add('overflow-hidden');
        } else {
            closeFavoritesPanel();
        }
    }

    function closeFavoritesPanel() {
        const panel = elements.favoritesPanel;
        const backdrop = elements.favoritesBackdrop;
        panel.classList.add('translate-x-full');
        backdrop.classList.add('opacity-0');
        setTimeout(() => {
            backdrop.classList.add('hidden');
        }, 300);
        document.body.classList.remove('overflow-hidden');
    }

    function clearFavorites() {
        if (!state.favorites.size) return;
        if (!confirm('確定要清空收藏清單嗎？')) return;
        state.favorites.clear();
        saveFavorites();
        updateFavoritesUI();
    }

    function initializePlannerSection() {
        if (!elements.plannerSummary || !elements.plannerSelectedList || !elements.plannerCandidateList) {
            return;
        }
        const targetCredits = Number(elements.plannerTargetCredits?.value);
        if (Number.isFinite(targetCredits) && targetCredits >= 0) {
            state.planner.targetCredits = targetCredits;
        }
        renderPlanner();
    }

    async function handlePlannerFileUpload(event) {
        const file = event.target?.files?.[0];
        if (!file) return;
        try {
            if (!isPlannerPdfFile(file)) {
                throw new Error('僅支援 PDF 檔案，請上傳課表 PDF。');
            }

            const parsed = await parsePlannerPdfFile(file);
            if (!parsed.courses.length) {
                throw new Error('PDF 解析不到課程資料，請改用其他課表 PDF。');
            }

            // Enrich parsed courses with credits from fcu_courses catalog
            const enriched = parsed.courses.map((c) => enrichPlannerCourseCredits(c));
            state.planner.uploadedCourses = enriched;
            state.planner.hasPlan = false;
            state.planner.pool = [];
            state.planner.selected = new Map();
            state.planner.warnings = parsed.warnings.slice();
            state.planner.studentGrade = parsed.studentGrade ?? null;

            // Show current credit total below the file input
            const totalCredits = enriched.reduce((sum, c) => sum + (c.credits || 0), 0);
            const uploadedCreditsEl = document.getElementById('planner-uploaded-credits');
            if (uploadedCreditsEl) {
                const grade = state.planner.studentGrade;
                const gradeText = grade ? `（${grade} 年級）` : '';
                const minCredits = grade && grade >= 4 ? 9 : 12;
                const minHint = grade
                    ? `，逢甲規定${grade >= 4 ? '四、五' : '一至三'}年級每學期至少 ${minCredits} 學分`
                    : '';
                uploadedCreditsEl.textContent =
                    `已辨識 ${enriched.length} 門課${gradeText}，本學期已修學分：${totalCredits} 學分${minHint}`;
                uploadedCreditsEl.classList.remove('hidden');
            }

            const fileNameEl = document.getElementById('planner-file-name');
            if (fileNameEl) fileNameEl.textContent = file.name;

            renderPlanner();

            if (parsed.warnings.length) {
                showToast(
                    `已從 ${file.name} 解析 ${parsed.courses.length} 門課程（${parsed.warnings[0]}）`,
                    'success'
                );
            } else {
                showToast(`已從 ${file.name} 解析 ${parsed.courses.length} 門課程`, 'success');
            }
        } catch (error) {
            console.error('Failed to read planner file:', error);
            state.planner.uploadedCourses = [];
            showToast(error.message || '讀取 PDF 失敗，請稍後再試。', 'error');
        } finally {
            if (event.target) {
                event.target.value = '';
            }
        }
    }

    function isPlannerPdfFile(file) {
        const filename = toPlannerString(file?.name).toLowerCase();
        return file?.type === 'application/pdf' || filename.endsWith('.pdf');
    }

    // 從 PDF 文字中偵測學生年級（1–5），例如「資訊四丁」→ 4
    function detectStudentGradeFromPdfText(text) {
        const gradeMap = { '一': 1, '二': 2, '三': 3, '四': 4, '五': 5 };
        // 班級名稱格式如「資訊四丁」、「機械三甲」、「工工二乙」等
        const m = text.match(/[\u4e00-\u9fff]{1,6}([一二三四五])[甲乙丙丁戊己庚辛壬癸A-Za-z]/);
        if (m) return gradeMap[m[1]] || null;
        // 也嘗試直接「四年級」
        const m2 = text.match(/([一二三四五])年級/);
        if (m2) return gradeMap[m2[1]] || null;
        return null;
    }

    async function parsePlannerPdfFile(file) {
        const payload = await extractPlannerPdfPayload(file);
        if (!payload.text.trim()) {
            return { courses: [], warnings: ['PDF 內容為空白。'] };
        }

        const layoutParsed = parsePlannerPdfCoursesByLayout(payload.pages);
        const textParsed = parsePlannerPdfCourses(payload.text);
        const mergedCourses = layoutParsed.courses.length
            ? mergePlannerParsedCourses(layoutParsed.courses, textParsed.courses, { primaryStrict: true })
            : mergePlannerParsedCourses([], textParsed.courses);

        const warnings = [];
        if (!mergedCourses.length) {
            warnings.push('PDF 版型無法自動辨識，請改用其他課表 PDF。');
            return { courses: [], warnings };
        }

        // 移除沒節次且課名是另一個有節次課程前綴的殘留課程
        // 例如「品牌設計與行銷」是「品牌設計與行銷企劃」的前綴，視為誤解析移除
        const namesWithTimes = new Set(
            mergedCourses.filter(c => Array.isArray(c.times) && c.times.length).map(c => c.course)
        );
        const finalCourses = mergedCourses.filter((c) => {
            if (Array.isArray(c.times) && c.times.length) return true;
            for (const name of namesWithTimes) {
                if (name !== c.course && name.startsWith(c.course)) return false;
            }
            return true;
        });

        if (!finalCourses.some((course) => Array.isArray(course.times) && course.times.length)) {
            warnings.push('已讀取課程名稱，但未辨識到節次，請手動補上 times。');
        } else if (finalCourses.some((course) => !Array.isArray(course.times) || !course.times.length)) {
            warnings.push('部分課程未辨識到完整節次，請確認後再排課。');
        }

        const studentGrade = detectStudentGradeFromPdfText(payload.text);
        return { courses: finalCourses, warnings, studentGrade };
    }

    async function extractPlannerPdfPayload(file) {
        if (!window.pdfjsLib || typeof window.pdfjsLib.getDocument !== 'function') {
            throw new Error('PDF 解析器載入失敗，請重新整理頁面後再試。');
        }

        if (window.pdfjsLib.GlobalWorkerOptions) {
            window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_SRC;
        }

        const data = await file.arrayBuffer();
        const loadingTask = window.pdfjsLib.getDocument({ data });
        const pdf = await loadingTask.promise;
        const pages = [];
        const textPages = [];

        for (let pageNo = 1; pageNo <= pdf.numPages; pageNo++) {
            const page = await pdf.getPage(pageNo);
            const textContent = await page.getTextContent();
            const items = normalizePlannerPdfItems(textContent.items || []);
            pages.push({ pageNo, items });
            const rows = extractPlannerPdfRows(items);
            if (rows.length) {
                textPages.push(rows.join('\n'));
            }
        }

        return {
            pages,
            text: textPages.join('\n')
        };
    }

    function normalizePlannerPdfItems(rawItems) {
        return rawItems
            .map((item) => {
                const text = toPlannerString(item?.str);
                if (!text) return null;
                const transform = Array.isArray(item?.transform) ? item.transform : [];
                const x = Number(transform[4]) || 0;
                const y = Number(transform[5]) || 0;
                const width = Number(item?.width) || 0;
                const height = Math.abs(Number(transform[3])) || Number(item?.height) || 0;
                return { text, x, y, width, height };
            })
            .filter(Boolean);
    }

    function extractPlannerPdfRows(items) {
        const tolerance = 2;
        const rows = [];

        items.forEach((item) => {
            const text = toPlannerString(item?.text ?? item?.str);
            if (!text) return;

            const transform = Array.isArray(item?.transform) ? item.transform : [];
            const x = Number(item?.x ?? transform[4]) || 0;
            const y = Number(item?.y ?? transform[5]) || 0;
            const width = Number(item?.width) || 0;

            let row = rows.find((entry) => Math.abs(entry.y - y) <= tolerance);
            if (!row) {
                row = { y, parts: [] };
                rows.push(row);
            }
            row.parts.push({ x, width, text });
        });

        return rows
            .sort((a, b) => b.y - a.y)
            .map((row) => {
                const parts = row.parts.sort((a, b) => a.x - b.x);
                const chunks = [];
                let previousEndX = null;
                parts.forEach((part) => {
                    if (previousEndX !== null) {
                        const gap = part.x - previousEndX;
                        chunks.push(gap > 24 ? '\t' : ' ');
                    }
                    chunks.push(part.text);
                    previousEndX = part.x + part.width;
                });
                return chunks
                    .join('')
                    .replace(/\s+\t/g, '\t')
                    .replace(/\t\s+/g, '\t')
                    .replace(/\s{2,}/g, ' ')
                    .trim();
            })
            .filter(Boolean);
    }

    function parsePlannerPdfCoursesByLayout(pages) {
        const merged = new Map();

        (Array.isArray(pages) ? pages : []).forEach((page) => {
            const items = Array.isArray(page?.items) ? page.items : [];
            const parsed = parsePlannerPdfPageByLayout(items);
            parsed.forEach((course) => {
                const key = `${course.course}|${course.teacher || ''}`;
                if (!merged.has(key)) {
                    merged.set(key, {
                        ...course,
                        times: Array.isArray(course.times) ? course.times.slice() : []
                    });
                    return;
                }

                const current = merged.get(key);
                const slots = new Set([...(current.times || []), ...(course.times || [])]);
                current.times = sortPlannerTimeSlots(Array.from(slots));
                if (!current.teacher && course.teacher) current.teacher = course.teacher;
            });
        });

        const allCourses = Array.from(merged.values()).map((course) => ({
            course: course.course,
            teacher: course.teacher || '',
            credits: Number.isFinite(course.credits) ? course.credits : null,
            times: sortPlannerTimeSlots(Array.isArray(course.times) ? course.times : []),
            required: Boolean(course.required),
            source: 'uploaded_pdf'
        }));

        // Layout parser 根據座標確定節次，沒有節次代表無法對應到格子，視為誤解析移除
        const filtered = allCourses.filter((c) => c.times.length > 0);

        return {
            courses: filtered,
            warnings: []
        };
    }

    function parsePlannerPdfPageByLayout(items) {
        if (!Array.isArray(items) || !items.length) return [];

        const dayColumns = detectPlannerPdfDayColumns(items);
        if (dayColumns.length < 3) return [];

        const firstDayX = dayColumns[0].x;
        const periods = detectPlannerPdfPeriodAnchors(items, firstDayX);
        if (periods.length < 4) return [];

        // Calculate average period height to set vertical proximity threshold.
        // Text items that belong to the same multi-period spanning cell will have
        // small Y gaps (≈ line height, ~10-14pt), while items in different cells
        // will be separated by at least one period height.
        let avgPeriodHeight = 30;
        if (periods.length >= 2) {
            const dists = [];
            for (let i = 1; i < periods.length; i++) {
                dists.push(Math.abs(periods[i - 1].y - periods[i].y));
            }
            avgPeriodHeight = dists.reduce((s, v) => s + v, 0) / dists.length;
        }
        // Items within the same course cell gap is roughly font-height (~12pt),
        // so use 60% of period height as the split threshold.
        const proximityThreshold = avgPeriodHeight * 0.6;

        // Step 1: assign valid items to their day column, keeping Y coordinates.
        const dayItemMap = new Map();
        // Also keep a list of raw items per day for suffix-continuation detection.
        const dayRawMap = new Map();
        items.forEach((item) => {
            const text = normalizePlannerPdfLine(item.text);
            if (!text) return;

            const day = mapPlannerPdfDayByX(item.x + item.width / 2, dayColumns);
            if (!day) return;
            if (!mapPlannerPdfPeriodByY(item.y, periods)) return;

            // Track all non-empty items per day for suffix merging.
            if (!dayRawMap.has(day)) dayRawMap.set(day, []);
            dayRawMap.get(day).push({ text, x: item.x, y: item.y, width: item.width });

            if (!isLikelyPlannerCourseCellText(text)) return;
            if (!dayItemMap.has(day)) dayItemMap.set(day, []);
            dayItemMap.get(day).push({ text, x: item.x, y: item.y, width: item.width });
        });

        // Merge line-continuation fragments into the preceding item in the same day column.
        // FCU PDF often breaks a single cell's text across two lines, e.g.:
        //   "人工智慧導" + "論(張哲誠)"  →  "人工智慧導論(張哲誠)"
        //   "品牌設計與行銷" + "企劃(湛明暉)"  →  "品牌設計與行銷企劃(湛明暉)"
        //   "體育(二)(黃素" + "珍)"  →  "體育(二)(黃素珍)"
        // Condition: the next item's Y is within one line-height of the previous item,
        // and the X positions overlap (same column cell).
        const lineHeight = avgPeriodHeight * 0.35; // approx one text line height
        dayItemMap.forEach((dayItems) => {
            dayItems.sort((a, b) => b.y - a.y); // top-to-bottom
            for (let i = 1; i < dayItems.length; i++) {
                const prev = dayItems[i - 1];
                const curr = dayItems[i];
                const yGap = prev.y - curr.y; // positive = curr is below prev
                if (yGap <= 0 || yGap > lineHeight * 1.5) continue;
                // X overlap check: their horizontal ranges must overlap
                const prevLeft = prev.x, prevRight = prev.x + (prev.width || 50);
                const currLeft = curr.x, currRight = curr.x + (curr.width || 50);
                const overlaps = prevLeft < currRight + 10 && currLeft < prevRight + 10;
                if (!overlaps) continue;
                // Only merge if prev looks like an incomplete fragment (no closing bracket)
                const prevCompact = prev.text.replace(/\s+/g, '');
                const looksIncomplete = !/[)）]$/.test(prevCompact) && prevCompact.length <= 12;
                if (!looksIncomplete) continue;
                // Merge curr into prev
                prev.text = prev.text.replace(/\s+/g, '') + curr.text.replace(/\s+/g, '');
                dayItems.splice(i, 1);
                i--; // re-check same index after splice
            }
        });

        const courses = new Map();

        // Step 2: for each day column, group items by vertical proximity so that
        // all fragments of a multi-period course land in the same group.
        dayItemMap.forEach((dayItems, day) => {
            // Sort top-to-bottom (higher Y = higher on the page in PDF coordinates).
            dayItems.sort((a, b) => b.y - a.y);

            // Build proximity groups.
            const groups = [];
            let currentGroup = null;
            dayItems.forEach((item) => {
                if (!currentGroup) {
                    currentGroup = [item];
                    return;
                }
                const lastY = currentGroup[currentGroup.length - 1].y;
                const gap = lastY - item.y; // positive = moving downward
                if (gap <= proximityThreshold) {
                    currentGroup.push(item);
                } else {
                    groups.push(currentGroup);
                    currentGroup = [item];
                }
            });
            if (currentGroup && currentGroup.length) groups.push(currentGroup);

            // Step 3: parse each group as a single course cell.
            groups.forEach((group) => {
                const parts = group.map((it) => ({ text: it.text, x: it.x, y: it.y, width: it.width }));
                const { course, teacher } = parsePlannerPdfCellCourse(parts);
                if (!isLikelyPlannerCourseName(course)) return;

                const key = `${course}|${teacher}`;
                if (!courses.has(key)) {
                    courses.set(key, { course, teacher, credits: null, required: false, times: [] });
                }

                const entry = courses.get(key);
                const slots = new Set(entry.times);

                // Collect all distinct periods represented by items in this group.
                group.forEach((it) => {
                    const p = mapPlannerPdfPeriodByY(it.y, periods);
                    if (p) slots.add(`${day}${p}`);
                });

                entry.times = sortPlannerTimeSlots(Array.from(slots));
            });
        });

        return Array.from(courses.values());
    }

    function parsePlannerPdfCellCourse(parts) {
        if (!Array.isArray(parts) || !parts.length) {
            return { course: '', teacher: '' };
        }

        const orderedParts = parts
            .slice()
            .sort((left, right) => {
                const yDiff = Math.abs(left.y - right.y);
                if (yDiff > 1.2) return right.y - left.y;
                return left.x - right.x;
            })
            .map((part) => normalizePlannerPdfLine(part.text))
            .filter(Boolean);

        const uniqueTokens = [];
        const seen = new Set();
        orderedParts.forEach((token) => {
            const compact = token.replace(/\s+/g, '');
            if (seen.has(compact)) return;
            seen.add(compact);
            uniqueTokens.push(token);
        });

        let teacher = '';
        const courseFragments = [];

        uniqueTokens.forEach((token) => {
            const compact = token.replace(/\s+/g, '');
            if (!compact) return;
            if (isLikelyPlannerRoomText(compact)) return;

            const split = splitPlannerPdfCourseAndTeacher(token);
            if (split.teacher && !teacher) {
                teacher = split.teacher;
            }

            const candidateCourse = toPlannerString(split.course || token).replace(/\s+/g, '');
            if (!candidateCourse) return;
            // Only apply standalone-teacher filter when the bracket-parsed teacher is absent.
            // If split.teacher is set, the bracket already confirmed the teacher identity,
            // so split.course is definitively the course name (e.g. "密碼學" from "密碼學(陳星百)").
            if (!split.teacher && isLikelyStandaloneTeacherToken(candidateCourse)) return;
            courseFragments.push(candidateCourse);
        });

        const fragments = [];
        courseFragments.forEach((fragment) => {
            if (!fragments.includes(fragment)) {
                fragments.push(fragment);
            }
        });
        if (!fragments.length) {
            return { course: '', teacher };
        }

        const combinedCourse = fragments.join('');
        const longestFragment = fragments
            .slice()
            .sort((left, right) => right.length - left.length)[0];
        const course = isLikelyPlannerCourseName(combinedCourse) && combinedCourse.length <= 42
            ? combinedCourse
            : longestFragment;

        return { course, teacher };
    }

    function detectPlannerPdfDayColumns(items) {
        const dayMatchers = [
            { regex: /(星期一|週一|礼拜一|禮拜一|MON(?:DAY)?)/i, day: 'MON' },
            { regex: /(星期二|週二|礼拜二|禮拜二|TUE(?:SDAY)?)/i, day: 'TUE' },
            { regex: /(星期三|週三|礼拜三|禮拜三|WED(?:NESDAY)?)/i, day: 'WED' },
            { regex: /(星期四|週四|礼拜四|禮拜四|THU(?:RSDAY)?)/i, day: 'THU' },
            { regex: /(星期五|週五|礼拜五|禮拜五|FRI(?:DAY)?)/i, day: 'FRI' },
            { regex: /(星期六|週六|礼拜六|禮拜六|SAT(?:URDAY)?)/i, day: 'SAT' },
            { regex: /(星期日|星期天|週日|週天|礼拜日|礼拜天|禮拜日|禮拜天|SUN(?:DAY)?)/i, day: 'SUN' }
        ];
        const buckets = new Map();

        items.forEach((item) => {
            const text = normalizePlannerPdfLine(item.text);
            const matched = dayMatchers.find((matcher) => matcher.regex.test(text));
            if (!matched) return;
            const centerX = item.x + item.width / 2;
            const list = buckets.get(matched.day) || [];
            list.push(centerX);
            buckets.set(matched.day, list);
        });

        return Array.from(buckets.entries())
            .map(([day, values]) => ({
                day,
                x: values.reduce((sum, value) => sum + value, 0) / values.length
            }))
            .sort((a, b) => a.x - b.x);
    }

    function detectPlannerPdfPeriodAnchors(items, firstDayX) {
        const periodMap = new Map();
        const cutoffX = Number.isFinite(firstDayX) ? firstDayX - 8 : Infinity;
        // Some timetables label afternoon periods as A/B/C/D (→11/12/13/14)
        const letterPeriodMap = { A: 11, B: 12, C: 13, D: 14 };

        items.forEach((item) => {
            const token = toPlannerString(item.text).replace(/\s+/g, '').toUpperCase();
            let period;
            if (/^\d{1,2}$/.test(token)) {
                period = Number(token);
                if (!Number.isFinite(period) || period < 1 || period > 14) return;
            } else if (letterPeriodMap[token] !== undefined) {
                period = letterPeriodMap[token];
            } else {
                return;
            }

            const centerX = item.x + item.width / 2;
            if (centerX >= cutoffX) return;

            const list = periodMap.get(period) || [];
            list.push(item.y);
            periodMap.set(period, list);
        });

        return Array.from(periodMap.entries())
            .map(([period, ys]) => ({
                period,
                y: ys.reduce((sum, value) => sum + value, 0) / ys.length
            }))
            .sort((a, b) => a.period - b.period);
    }

    function mapPlannerPdfDayByX(x, dayColumns) {
        if (!dayColumns.length || !Number.isFinite(x)) return '';
        let best = null;
        let minDiff = Infinity;
        dayColumns.forEach((column) => {
            const diff = Math.abs(column.x - x);
            if (diff < minDiff) {
                minDiff = diff;
                best = column;
            }
        });

        if (!best) return '';
        const avgGap =
            dayColumns.length > 1
                ? (dayColumns[dayColumns.length - 1].x - dayColumns[0].x) / (dayColumns.length - 1)
                : 80;
        if (minDiff > Math.max(22, avgGap * 0.68)) return '';
        return best.day;
    }

    function mapPlannerPdfPeriodByY(y, periods) {
        if (!periods.length || !Number.isFinite(y)) return null;
        let best = null;
        let minDiff = Infinity;
        periods.forEach((period) => {
            const diff = Math.abs(period.y - y);
            if (diff < minDiff) {
                minDiff = diff;
                best = period;
            }
        });
        if (!best) return null;

        const distances = [];
        for (let i = 1; i < periods.length; i++) {
            distances.push(Math.abs(periods[i].y - periods[i - 1].y));
        }
        const avgGap = distances.length
            ? distances.reduce((sum, value) => sum + value, 0) / distances.length
            : 24;
        if (minDiff > Math.max(8, avgGap * 0.7)) return null;
        return best.period;
    }

    function isLikelyPlannerCourseCellText(text) {
        const token = normalizePlannerPdfLine(text).replace(/\s+/g, '');
        if (!token) return false;
        if (token.length < 2 || token.length > 80) return false;
        if (/^\d+$/.test(token)) return false;
        if (/^\d{1,2}:\d{2}$/.test(token)) return false;
        if (/^(?:星期|週|禮拜|礼拜|MON|TUE|WED|THU|FRI|SAT|SUN)/i.test(token)) return false;
        if (isLikelyPlannerRoomText(token)) return false;
        return /[\u4e00-\u9fffA-Za-z]/.test(token);
    }

    function isLikelyPlannerRoomText(token) {
        if (!token) return false;
        if (/(?:教室|電腦室|實驗室|講堂|大樓|樓層|館|室)/.test(token) && /\d/.test(token)) return true;
        if (/^[A-Za-z]?\d{3,4}(?:[（(][^()（）]{1,10}[)）])?$/.test(token)) return true;
        // e.g. "資電330" or "資電330(電腦實習)" or "資電330(電腦實習" (unclosed bracket)
        if (/^[\u4e00-\u9fff]{1,4}\d{2,4}(?:[（(][^()（）]{0,15}[)）]?)?$/.test(token)) return true;
        return false;
    }

    function splitPlannerPdfCourseAndTeacher(text) {
        const source = toPlannerString(text).replace(/\s+/g, '');
        const match = source.match(/^(.*)[（(]([^()（）]+)[)）]$/);
        if (!match) {
            return { course: source, teacher: '' };
        }

        const maybeTeacher = toPlannerString(match[2]);
        if (!isLikelyPlannerTeacherName(maybeTeacher)) {
            return { course: source, teacher: '' };
        }
        return {
            course: toPlannerString(match[1]),
            teacher: maybeTeacher
        };
    }

    function isLikelyPlannerTeacherName(value) {
        const token = toPlannerString(value).replace(/\s+/g, '');
        if (!token) return false;
        if (token.length < 2 || token.length > 10) return false;
        if (/[0-9]/.test(token)) return false;
        if (/^[一二三四五六七八九十甲乙丙丁戊己庚辛壬癸]{1,2}$/.test(token)) return false;
        return /[\u4e00-\u9fffA-Za-z]/.test(token);
    }

    function mergePlannerParsedCourses(primaryCourses, secondaryCourses, options = {}) {
        const primaryStrict = Boolean(options.primaryStrict);
        const merged = new Map();
        const nameIndex = new Map();
        const primaryList = Array.isArray(primaryCourses) ? primaryCourses : [];
        const secondaryList = Array.isArray(secondaryCourses) ? secondaryCourses : [];
        const secondaryNameCounts = new Map();

        secondaryList.forEach((course) => {
            const courseName = toPlannerString(course?.course ?? course?.name ?? course?.title);
            const normalizedName = normalizePlannerCourseNameForMerge(courseName);
            if (!normalizedName) return;
            secondaryNameCounts.set(normalizedName, (secondaryNameCounts.get(normalizedName) || 0) + 1);
        });

        primaryList.forEach((course, index) => {
            const courseName = toPlannerString(course?.course ?? course?.name ?? course?.title);
            if (!courseName) return;
            const teacher = toPlannerString(course?.teacher);
            const key = `${courseName}|${teacher}`;

            if (!merged.has(key)) {
                merged.set(key, {
                    id: key || `uploaded_pdf_${index}`,
                    course: courseName,
                    teacher,
                    credits: Number.isFinite(course?.credits) ? course.credits : null,
                    times: [],
                    required: Boolean(course?.required),
                    source: 'uploaded_pdf'
                });
            }

            const current = merged.get(key);
            const slots = new Set([...(current.times || []), ...normalizePlannerTimes(course?.times)]);
            current.times = sortPlannerTimeSlots(Array.from(slots));
            if (!current.teacher && teacher) current.teacher = teacher;
            if (!Number.isFinite(current.credits) && Number.isFinite(course?.credits)) {
                current.credits = course.credits;
            }
            if (course?.required) current.required = true;

            const normalizedName = normalizePlannerCourseNameForMerge(courseName);
            if (normalizedName) {
                const keys = nameIndex.get(normalizedName) || [];
                if (!keys.includes(key)) keys.push(key);
                nameIndex.set(normalizedName, keys);
            }
        });

        secondaryList.forEach((course, index) => {
            const courseName = toPlannerString(course?.course ?? course?.name ?? course?.title);
            if (!courseName) return;
            const teacher = toPlannerString(course?.teacher);
            const slots = normalizePlannerTimes(course?.times);
            const normalizedName = normalizePlannerCourseNameForMerge(courseName);
            const relatedKeys = normalizedName ? (nameIndex.get(normalizedName) || []) : [];

            let targetKey = '';
            if (teacher && relatedKeys.length) {
                targetKey = relatedKeys.find((key) => key.endsWith(`|${teacher}`)) || '';
            }
            if (!targetKey && relatedKeys.length) {
                targetKey = relatedKeys[0];
            }

            if (!targetKey) {
                if (primaryStrict && primaryList.length && !slots.length) {
                    const frequency = normalizedName ? (secondaryNameCounts.get(normalizedName) || 0) : 0;
                    if (!shouldKeepUnslottedSecondaryCourse(courseName, teacher, frequency)) {
                        return;
                    }
                }
                const key = `${courseName}|${teacher}`;
                if (!merged.has(key)) {
                    merged.set(key, {
                        id: key || `uploaded_pdf_secondary_${index}`,
                        course: courseName,
                        teacher,
                        credits: Number.isFinite(course?.credits) ? course.credits : null,
                        times: sortPlannerTimeSlots(Array.from(new Set(slots))),
                        required: Boolean(course?.required),
                        source: 'uploaded_pdf'
                    });
                }
                if (normalizedName) {
                    const keys = nameIndex.get(normalizedName) || [];
                    if (!keys.includes(key)) keys.push(key);
                    nameIndex.set(normalizedName, keys);
                }
                return;
            }

            const current = merged.get(targetKey);
            const mergedSlots = new Set([...(current?.times || []), ...slots]);
            current.times = sortPlannerTimeSlots(Array.from(mergedSlots));
            if (!current.teacher && teacher) current.teacher = teacher;
            if (!Number.isFinite(current.credits) && Number.isFinite(course?.credits)) {
                current.credits = course.credits;
            }
            if (course?.required) current.required = true;
        });

        return Array.from(merged.values());
    }

    function normalizePlannerCourseNameForMerge(value) {
        return toPlannerString(value)
            .replace(/[()（）\[\]【】\s_\-]/g, '')
            .toLowerCase();
    }

    function isLikelyStandaloneTeacherToken(value) {
        const token = toPlannerString(value).replace(/\s+/g, '');
        if (!token) return false;
        return isLikelyPlannerTeacherName(token) && token.length <= 4;
    }

    function shouldKeepUnslottedSecondaryCourse(courseName, teacher, frequency) {
        const normalizedCourse = toPlannerString(courseName).replace(/\s+/g, '');
        if (!isLikelyPlannerCourseName(normalizedCourse)) return false;
        if (isLikelyPlannerRoomText(normalizedCourse)) return false;
        if (normalizedCourse.length < 3) return false;
        if (frequency >= 2) return true;
        if (isLikelyPlannerTeacherName(teacher)) return true;
        return false;
    }

    function parsePlannerPdfCourses(text) {
        const lines = text
            .split(/\r?\n/)
            .map((line) => normalizePlannerPdfLine(line))
            .filter(Boolean);
        const merged = new Map();
        let lastCourseKey = '';

        lines.forEach((line) => {
            if (isPlannerPdfNoiseLine(line)) return;
            const cells = splitPlannerPdfCells(line);
            if (!cells.length) return;

            const timeSlots = extractPlannerPdfTimeSlots(cells);
            const courseName = extractPlannerPdfCourseName(cells);
            const teacher = extractPlannerPdfTeacher(cells, courseName);
            const credits = extractPlannerPdfCredits(cells);
            const required = cells.some((cell) => /必修|required/i.test(cell));

            if (!courseName && !timeSlots.length) return;

            const key = courseName ? `${courseName}|${teacher}` : lastCourseKey;
            if (!key) return;

            if (!merged.has(key)) {
                if (!courseName) return;
                merged.set(key, {
                    course: courseName,
                    teacher,
                    credits,
                    times: [],
                    required,
                    source: 'uploaded_pdf'
                });
            }

            const current = merged.get(key);
            if (courseName && !current.course) {
                current.course = courseName;
            }
            if (!current.teacher && teacher) {
                current.teacher = teacher;
            }
            if (!Number.isFinite(current.credits) && Number.isFinite(credits)) {
                current.credits = credits;
            }
            if (required) {
                current.required = true;
            }

            const mergedSlots = new Set(current.times);
            timeSlots.forEach((slot) => mergedSlots.add(slot));
            current.times = sortPlannerTimeSlots(Array.from(mergedSlots));

            if (courseName) {
                lastCourseKey = key;
            }
        });

        const courses = Array.from(merged.values())
            .filter((course) => toPlannerString(course.course))
            .map((course) => ({
                course: course.course,
                teacher: course.teacher || '',
                credits: Number.isFinite(course.credits) ? course.credits : null,
                times: Array.isArray(course.times) ? course.times : [],
                required: Boolean(course.required),
                source: course.source || 'uploaded_pdf'
            }));

        const warnings = [];
        if (!courses.length) {
            warnings.push('PDF 版型無法自動辨識，請改用其他課表 PDF。');
        } else if (!courses.some((course) => course.times.length)) {
            warnings.push('已讀取課程名稱，但未辨識到節次，請手動補上 times。');
        }

        return { courses, warnings };
    }

    function normalizePlannerPdfLine(line) {
        return toPlannerString(line)
            .replace(/[│｜]/g, '\t')
            .replace(/\u3000/g, ' ')
            .replace(/[‐‑‒–—―]/g, '-')
            .replace(/[～〜]/g, '~')
            .trim();
    }

    function splitPlannerPdfCells(line) {
        return line
            .replace(/\s{3,}/g, '\t')
            .split('\t')
            .map((part) => toPlannerString(part))
            .filter(Boolean);
    }

    function isPlannerPdfNoiseLine(line) {
        const compact = line.replace(/\s+/g, '');
        if (!compact) return true;
        if (/^第?\d+頁$/i.test(compact)) return true;
        if (/^(我的課表|課表|學年|學期|學生|姓名|學號|班級|系級|列印時間|printdate)/i.test(compact)) return true;

        const headers = ['課程名稱', '科目名稱', '授課教師', '教師', '學分', '上課時間', '節次', '必選修', '課程代碼', '課號'];
        const matchedHeaderCount = headers.reduce((count, keyword) => count + (compact.includes(keyword) ? 1 : 0), 0);
        return matchedHeaderCount >= 2;
    }

    function extractPlannerPdfTimeSlots(cells) {
        const slots = new Set();
        cells.forEach((cell) => {
            buildPlannerPdfTimeCandidates(cell).forEach((candidate) => {
                normalizePlannerTimes(candidate).forEach((slot) => slots.add(slot));
            });
        });
        return Array.from(slots);
    }

    function buildPlannerPdfTimeCandidates(value) {
        const text = toPlannerString(value);
        if (!text) return [];
        const compact = text.replace(/\s+/g, '');
        const candidates = new Set([text, compact]);
        candidates.add(compact.replace(/([0-9A-D,~\-]+)\(?([一二三四五六日天])\)?/gi, '$2$1'));
        candidates.add(compact.replace(/\(?([一二三四五六日天])\)?([0-9A-D,~\-]+)/gi, '$1$2'));
        candidates.add(compact.replace(/([0-9A-D,~\-]+)\(?((?:MON|TUE|WED|THU|FRI|SAT|SUN)(?:DAY)?)\)?/gi, '$2$1'));
        candidates.add(compact.replace(/\(?((?:MON|TUE|WED|THU|FRI|SAT|SUN)(?:DAY)?)\)?([0-9A-D,~\-]+)/gi, '$1$2'));
        return Array.from(candidates).filter(Boolean);
    }

    function extractPlannerPdfCourseName(cells) {
        for (const cell of cells) {
            const labeled = cell.match(/(?:課程名稱|科目名稱|課名|課程)\s*[:：]?\s*(.+)$/i);
            if (labeled && isLikelyPlannerCourseName(labeled[1])) {
                return toPlannerString(labeled[1]);
            }
        }

        const candidates = cells.filter((cell) => isLikelyPlannerCourseName(cell));
        if (!candidates.length) return '';
        return candidates.sort((a, b) => b.length - a.length)[0];
    }

    function extractPlannerPdfTeacher(cells, courseName) {
        for (const cell of cells) {
            const labeled = cell.match(/(?:授課教師|教師|老師|teacher)\s*[:：]?\s*(.+)$/i);
            if (labeled) {
                return toPlannerString(labeled[1]);
            }
        }

        const fallback = cells.find((cell) => {
            const token = toPlannerString(cell);
            if (!token || token === courseName) return false;
            if (normalizePlannerTimes(token).length) return false;
            if (/學分|必修|選修|課程|科目|節次|星期|週|MON|TUE|WED|THU|FRI|SAT|SUN/i.test(token)) return false;
            if (!/^[\u4e00-\u9fffA-Za-z．.\s]{2,20}$/.test(token)) return false;
            return token.replace(/\s+/g, '').length <= 8;
        });

        return fallback || '';
    }

    function extractPlannerPdfCredits(cells) {
        const patterns = [
            /(?:學分|credits?)\s*[:：]?\s*([0-9]+(?:\.[0-9]+)?)/i,
            /([0-9]+(?:\.[0-9]+)?)\s*(?:學分|credits?)/i
        ];

        for (const cell of cells) {
            for (const pattern of patterns) {
                const match = cell.match(pattern);
                if (!match) continue;
                const value = Number(match[1]);
                if (Number.isFinite(value) && value > 0 && value <= 10) {
                    return value;
                }
            }
        }

        for (const cell of cells) {
            const token = toPlannerString(cell);
            if (!token || normalizePlannerTimes(token).length) continue;
            if (/^\d(?:\.\d)?$/.test(token)) {
                const value = Number(token);
                if (Number.isFinite(value) && value > 0 && value <= 10) {
                    return value;
                }
            }
        }

        return null;
    }

    function isLikelyPlannerCourseName(value) {
        const text = toPlannerString(value);
        if (!text) return false;
        if (text.length < 2 || text.length > 80) return false;
        if (isLikelyPlannerRoomText(text.replace(/\s+/g, ''))) return false;
        if (normalizePlannerTimes(text).length) return false;
        if (/^\d+(?:\.\d+)?$/.test(text)) return false;
        if (/^(?:必修|選修|通識|校定|系定|共同必修)$/i.test(text)) return false;
        if (/學分|課程代碼|課號|序號|班級|節次|星期|週|MON|TUE|WED|THU|FRI|SAT|SUN/i.test(text)) return false;
        return /[\u4e00-\u9fffA-Za-z]/.test(text);
    }

    function sortPlannerTimeSlots(slots) {
        const dayOrder = { MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6, SUN: 7 };
        return slots
            .slice()
            .sort((left, right) => {
                const leftMatch = String(left).match(/^(MON|TUE|WED|THU|FRI|SAT|SUN)(\d+)$/);
                const rightMatch = String(right).match(/^(MON|TUE|WED|THU|FRI|SAT|SUN)(\d+)$/);
                if (!leftMatch || !rightMatch) return String(left).localeCompare(String(right), 'zh-Hant');
                const dayDiff = dayOrder[leftMatch[1]] - dayOrder[rightMatch[1]];
                if (dayDiff !== 0) return dayDiff;
                return Number(leftMatch[2]) - Number(rightMatch[2]);
            });
    }

    async function generatePlannerRecommendation() {
        const userContext = elements.userContext?.value?.trim() || '';
        if (!userContext) {
            showToast('請先填寫「背景補充說明」，再產生建議課表。', 'error');
            elements.userContext?.focus();
            elements.userContext?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        const targetCreditsRaw = elements.plannerTargetCredits?.value?.trim();
        if (!targetCreditsRaw) {
            showToast('請先輸入本學期目標學分，再產生建議課表。', 'error');
            elements.plannerTargetCredits?.focus();
            return;
        }
        const targetCredits = Number(targetCreditsRaw);
        if (!Number.isFinite(targetCredits) || targetCredits < 1) {
            showToast('目標學分必須為正整數（例如 18）。', 'error');
            elements.plannerTargetCredits?.focus();
            return;
        }
        if (targetCredits > 30) {
            showToast('逢甲大學每學期最多修 30 學分，請重新設定目標學分。', 'error');
            elements.plannerTargetCredits?.focus();
            return;
        }
        // 已上傳課程的學分是「本學期已修」，推薦時只能補到目標為止
        const uploadedCredits = (state.planner.uploadedCourses || [])
            .reduce((sum, c) => sum + (Number.isFinite(c.credits) ? c.credits : 0), 0);
        if (uploadedCredits > targetCredits) {
            const grade = state.planner.studentGrade;
            const minCredits = grade && grade >= 4 ? 9 : 12;
            showToast(
                `本學期已修學分（${uploadedCredits}）已超過目標（${targetCredits}）。` +
                (grade ? `逢甲規定${grade >= 4 ? '四、五' : '一至三'}年級每學期至少需修 ${minCredits} 學分。` : ''),
                'error'
            );
            return;
        }
        state.planner.targetCredits = targetCredits;

        const parsed = parsePlannerInputCourses();
        if (!parsed.courses.length) {
            state.planner.hasPlan = false;
            state.planner.pool = [];
            state.planner.selected = new Map();
            state.planner.warnings = ['找不到可用課程資料，請先上傳課表 PDF。'];
            renderPlanner();
            return;
        }

        // 冷卻 + 等待提示（先鎖按鈕，再呼叫 API）
        const btn = elements.plannerGenerate;
        if (btn) {
            btn.disabled = true;
            btn.textContent = 'AI 分析中…';
        }

        // 呼叫 API 取得關鍵字
        let aiKeywords = [];
        let aiAvailable = true;
        try {
            const resp = await (window.authFetch || fetch)((window.API_BASE_URL || '') + '/api/planner-keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userContext })
            });
            if (resp.ok) {
                const data = await resp.json();
                aiKeywords = Array.isArray(data.keywords) ? data.keywords : [];
            } else {
                aiAvailable = false;
            }
        } catch (_) {
            aiAvailable = false;
        }
        console.log('[Planner] AI keywords:', aiKeywords, 'available:', aiAvailable);

        const built = buildPlannerPool(parsed.courses, aiKeywords);
        state.planner.pool = built.pool;
        state.planner.selected = new Map();
        state.planner.warnings = [...parsed.warnings, ...built.warnings];
        autoSelectPlannerCourses(aiKeywords.length > 0);
        state.planner.hasPlan = true;
        renderPlanner();

        // 冷卻倒數（API 呼叫完成後才開始倒數）
        if (btn) {
            let remaining = 3;
            btn.textContent = `請稍候 (${remaining}s)`;
            const timer = setInterval(() => {
                remaining--;
                if (remaining <= 0) {
                    clearInterval(timer);
                    btn.disabled = false;
                    btn.textContent = '產生建議課表';
                } else {
                    btn.textContent = `請稍候 (${remaining}s)`;
                }
            }, 1000);
        }
    }

    function resetPlannerState() {
        // 只還原選課結果，保留 PDF 上傳狀態
        state.planner.pool = [];
        state.planner.selected = new Map();
        state.planner.warnings = [];
        state.planner.hasPlan = false;
        renderPlanner();
    }

    function parsePlannerInputCourses() {
        const uploadedCourses = Array.isArray(state.planner.uploadedCourses)
            ? state.planner.uploadedCourses
            : [];
        if (!uploadedCourses.length) {
            const fallbackCourses = buildPlannerCatalogCandidates();
            return {
                courses: fallbackCourses,
                warnings: ['尚未上傳課表 PDF，已改用網站課程資料進行粗略排課（缺少節次時無法完整避開衝堂）。']
            };
        }

        const warnings = [];
        const courses = uploadedCourses
            .map((item, index) => normalizePlannerInputCourse(item, index))
            .filter((course) => {
                if (course) return true;
                warnings.push('部分課程缺少課名，已略過。');
                return false;
            });

        return { courses, warnings };
    }

    function normalizePlannerInputCourse(item, index) {
        if (!item || typeof item !== 'object') return null;
        const courseName = toPlannerString(item.course ?? item.course_name ?? item.name ?? item.title);
        if (!courseName) return null;

        const tags = normalizePlannerTags(item.tag ?? item.tags ?? item.classTags);
        const timeSlots = normalizePlannerTimes(
            item.times ??
            item.time ??
            item.schedule ??
            item.periods ??
            item.sections ??
            item.slots
        );
        const reviewText = toPlannerString(item.review ?? item.content ?? item.description);
        const corpus = [courseName, item.teacher, reviewText, tags.join(' ')]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        const required =
            Boolean(item.required) ||
            Boolean(item.isRequired) ||
            Boolean(item['必修']) ||
            toPlannerString(item.type).includes('必修');

        const sourceScore = toPlannerNumber(item.score ?? item.total_rating);
        const sourceDifficulty = toPlannerNumber(item.difficulty);
        const credits = toPlannerNumber(item.credits ?? item.credit ?? item['學分']) ?? inferPlannerCredits(tags);
        const sourceKey = toPlannerString(item.source) || 'uploaded';
        const pinned = sourceKey === 'uploaded' || sourceKey === 'uploaded_pdf';

        return {
            id: createPlannerId(item, index),
            course: courseName,
            teacher: toPlannerString(item.teacher ?? item.professor ?? item.instructor),
            credits,
            timeSlots,
            required,
            pinned,
            tags,
            review: reviewText,
            score: sourceScore,
            difficulty: sourceDifficulty,
            sourceKey,
            sourceLabel: formatSource(sourceKey),
            matchCorpus: corpus,
            relevance: 0
        };
    }

    function buildPlannerCatalogCandidates() {
        return state.courses.map((course, index) => {
            // Use actual credits from fcu_scrape if available, otherwise infer from tags
            const credits = course.credits != null
                ? course.credits
                : inferPlannerCredits(course.tags);
            // Use actual time slots from fcu_scrape if available
            const timeSlots = Array.isArray(course.times) && course.times.length
                ? normalizePlannerTimes(course.times)
                : [];
            // Build matchCorpus including semester and dept for background-based filtering
            const matchCorpus = course.matchCorpus ||
                `${course.course} ${course.teacher} ${course.tags.join(' ')} ${course.semester} ${course.dept}`.toLowerCase();
            return {
                id: `catalog|${course.id}|${index}`,
                course: course.course,
                teacher: course.teacher,
                credits,
                timeSlots,
                required: course.required || false,
                tags: course.tags || [],
                review: course.review || course.experience || '',
                score: toPlannerNumber(course.score),
                difficulty: toPlannerNumber(course.difficulty),
                sourceKey: course.sourceKey || 'unknown',
                sourceLabel: course.sourceLabel || formatSource(course.sourceKey),
                matchCorpus,
                semester: course.semester || '',
                dept: course.dept || '',
                relevance: 0
            };
        });
    }

    function buildPlannerPool(uploadedCourses, aiKeywords = []) {
        const warnings = [];
        const requiredCourses = uploadedCourses.filter((course) => course.required);
        const optionalCourses = uploadedCourses.filter((course) => !course.required);
        let pool = uploadedCourses.slice();

        // Always supplement the pool with catalog courses so background-based
        // recommendations can surface courses not on the uploaded timetable.
        const catalogCourses = buildPlannerCatalogCandidates();
        const seen = new Set(uploadedCourses.map((course) => plannerCourseSignature(course)));
        catalogCourses.forEach((course) => {
            const signature = plannerCourseSignature(course);
            if (!seen.has(signature)) {
                seen.add(signature);
                pool.push(course);
            }
        });
        if (!optionalCourses.length && requiredCourses.length) {
            warnings.push('上傳資料僅含固定課程，已自動補入網站課程作為可選清單。');
        }

        const profileTokens = buildPlannerProfileTokens();
        pool = pool.map((course) => ({
            ...course,
            relevance: computePlannerRelevance(course, profileTokens, aiKeywords)
        }));

        return { pool, warnings };
    }

    // 從背景說明解析排課限制
    function parsePlannerConstraints(userContext) {
        const text = toPlannerString(userContext).toLowerCase();
        const DAY_MAP = {
            '一': 'MON', '二': 'TUE', '三': 'WED', '四': 'THU', '五': 'FRI', '六': 'SAT', '日': 'SUN',
            'mon': 'MON', 'tue': 'TUE', 'wed': 'WED', 'thu': 'THU', 'fri': 'FRI', 'sat': 'SAT', 'sun': 'SUN',
            'monday': 'MON', 'tuesday': 'TUE', 'wednesday': 'WED', 'thursday': 'THU', 'friday': 'FRI'
        };


        // 解析「不要/不想/沒有/避開 星期X」→ blockedDays
        const blockedDays = new Set();
        const blockPatterns = [
            /(?:不要|不想|不希望|避開|沒有|別排|不排).*?(?:星期|週)?([一二三四五六日])/g,
            /星期([一二三四五六日]).*?(?:不要|不想|沒課|不排|空著)/g,
        ];
        blockPatterns.forEach((re) => {
            let m;
            while ((m = re.exec(text)) !== null) {
                const day = DAY_MAP[m[1]];
                if (day) blockedDays.add(day);
            }
        });

        // 解析「只有/只在/想要 星期X上課」→ allowedDays（如有設定，其他天全部封鎖）
        let allowedDays = null;
        const allowPatterns = [
            /只(?:有|在|想|要).*?(?:星期|週)?([一二三四五六日])/g,
            /(?:星期|週)([一二三四五六日]).*?(?:才有課|上課)/g,
        ];
        const foundAllowed = [];
        allowPatterns.forEach((re) => {
            let m;
            while ((m = re.exec(text)) !== null) {
                const day = DAY_MAP[m[1]];
                if (day) foundAllowed.push(day);
            }
        });
        if (foundAllowed.length) {
            allowedDays = new Set(foundAllowed);
        }

        // 解析「課分散/平均分配/不要集中」→ spreadDays: 每天最多幾節
        let maxSlotsPerDay = null;
        if (/分散|平均|不要集中|不集中|分開|不要連排|避免連排/.test(text)) {
            maxSlotsPerDay = 4; // 每天最多4節
        }

        // 解析「不要連續X節以上/超過X節」
        const continuousMatch = text.match(/不要?連(?:續|排)?(\d+)節|超過(\d+)節/);
        if (continuousMatch) {
            maxSlotsPerDay = Number(continuousMatch[1] || continuousMatch[2]);
        }

        return { blockedDays, allowedDays, maxSlotsPerDay };
    }

    // 判斷課程是否違反排課限制（pinned 課程跳過限制）
    function violatesPlannerConstraints(course, constraints, selectedSlotsByDay) {
        if (course.pinned) return false; // 已上傳課程不受限制
        const { blockedDays, allowedDays, maxSlotsPerDay } = constraints;
        const slots = course.timeSlots || [];
        if (!slots.length) return false; // 無節次資訊的課不限制

        for (const slot of slots) {
            const m = slot.match(/^(MON|TUE|WED|THU|FRI|SAT|SUN)/);
            if (!m) continue;
            const day = m[1];
            if (blockedDays.has(day)) return true;
            if (allowedDays && !allowedDays.has(day)) return true;
        }

        if (maxSlotsPerDay !== null) {
            // 計算加入此課後每天的節數是否超過上限
            const dayCount = new Map(Object.entries(selectedSlotsByDay));
            for (const slot of slots) {
                const m = slot.match(/^(MON|TUE|WED|THU|FRI|SAT|SUN)/);
                if (!m) continue;
                const day = m[1];
                const current = dayCount.get(day) || 0;
                if (current + 1 > maxSlotsPerDay) return true;
                dayCount.set(day, current + 1);
            }
        }

        return false;
    }

    function autoSelectPlannerCourses(aiActive = false) {
        const selected = new Map();
        const targetCredits = state.planner.targetCredits;
        const hardCap = Math.min(targetCredits + 1, 30);

        const userContext = elements.userContext?.value?.trim() || '';
        const constraints = parsePlannerConstraints(userContext);
        const hasConstraints = constraints.blockedDays.size || constraints.allowedDays || constraints.maxSlotsPerDay !== null;

        // All courses sorted by relevance; required/pinned courses get priority
        // 先依關聯分數排序
        const poolCopy = state.planner.pool.slice().sort((a, b) => comparePlannerCourses(b, a));

        // 找出非 pinned 課程的最高基礎關聯分數（去除 required +10000 bonus）
        const topScore = poolCopy.reduce((max, c) => {
            if (c.pinned) return max;
            const base = (c.relevance ?? 0) - (c.required ? 10000 : 0);
            return Math.max(max, base);
        }, 0);

        // 高關聯門檻：最高分的 60%，且至少 2 分（避免背景說明無效時全部鎖定）
        // 同樣用基礎分數比較（去除 required bonus）
        const HIGH_THRESHOLD = Math.max(topScore * 0.6, 2);

        // pinned（固定課表）固定排最前面，其他依基礎關聯分數決定是否 shuffle
        // required 靠 relevance +10000 bonus 自然排在 highRelevance 裡，不需特判
        const highRelevance = poolCopy.filter((c) => {
            if (c.pinned) return true;
            const base = (c.relevance ?? 0) - (c.required ? 10000 : 0);
            return base >= HIGH_THRESHOLD;
        });
        const lowRelevance = poolCopy.filter((c) => {
            if (c.pinned) return false;
            const base = (c.relevance ?? 0) - (c.required ? 10000 : 0);
            return base < HIGH_THRESHOLD;
        });

        // shuffle 低關聯區段
        for (let k = lowRelevance.length - 1; k > 0; k--) {
            const r = Math.floor(Math.random() * (k + 1));
            [lowRelevance[k], lowRelevance[r]] = [lowRelevance[r], lowRelevance[k]];
        }

        const allSorted = [...highRelevance, ...lowRelevance];

        // 建立實習課對應表：base課名 → 實習課 (同 dept+semester)
        // 例如「基礎程式設計(二)」→「基礎程式設計實習(二)」
        function findLabCourse(course) {
            const name = course.course || '';
            // 已經是實習課就不找
            if (/實習|實驗/.test(name)) return null;
            return allSorted.find((c) => {
                if (c.id === course.id) return false;
                const cname = c.course || '';
                if (!/實習|實驗/.test(cname)) return false;
                // 課名匹配：實習課名包含主課名的主體（去掉括號編號）
                const baseName = name.replace(/[（(][^)）]*[)）]$/, '').trim();
                return baseName.length >= 2 && cname.includes(baseName) &&
                    c.dept === course.dept && c.semester === course.semester;
            }) || null;
        }

        const selectedCourseNames = new Set(); // 同課名去重
        const selectedSlotsByDay = {};
        const labConflictWarnings = [];

        function addCourseToSelected(course) {
            selected.set(course.id, course);
            if (course.course) selectedCourseNames.add(course.course);
            const courseCredits = Number.isFinite(course.credits) ? course.credits : 0;
            (course.timeSlots || []).forEach((slot) => {
                const m = slot.match(/^(MON|TUE|WED|THU|FRI|SAT|SUN)/);
                if (m) selectedSlotsByDay[m[1]] = (selectedSlotsByDay[m[1]] || 0) + 1;
            });
            return courseCredits;
        }

        let currentCredits = 0;

        // 先強制加入所有 pinned（固定課表），不受學分上限限制
        for (const course of allSorted) {
            if (!course.pinned) continue;
            if (selected.has(course.id)) continue;
            if (course.course && selectedCourseNames.has(course.course)) continue;
            currentCredits += addCourseToSelected(course);
        }

        for (const course of allSorted) {
            if (currentCredits >= targetCredits) break;
            if (selected.has(course.id)) continue;
            if (course.pinned) continue; // 已在上面處理
            // base score = 0 的課程不自動選入（完全不相關）
            // aiActive 時嚴格過濾；非 aiActive 時只過濾 required 課（避免把無關必修塞進來）
            {
                const base = (course.relevance ?? 0) - (course.required ? 10000 : 0);
                if (aiActive && base <= 0) continue;
                if (!aiActive && course.required && base <= 0) continue;
            }
            // 同課名去重（非 pinned 課程，避免同名課程重複加入；課名為空則不去重）
            if (course.course && selectedCourseNames.has(course.course)) continue;
            if (hasPlannerConflictWithSelected(course, selected)) continue;
            if (hasConstraints && violatesPlannerConstraints(course, constraints, selectedSlotsByDay)) continue;

            const courseCredits = Number.isFinite(course.credits) ? course.credits : 0;

            // 找對應實習課
            const labCourse = findLabCourse(course);
            const labCredits = labCourse && Number.isFinite(labCourse.credits) ? labCourse.credits : 0;
            const totalNeeded = courseCredits + (labCourse ? labCredits : 0);

            if (currentCredits + totalNeeded <= hardCap) {
                currentCredits += addCourseToSelected(course);
                if (labCourse) {
                    if (hasPlannerConflictWithSelected(labCourse, selected)) {
                        labConflictWarnings.push(`「${course.course}」的實習課「${labCourse.course}」與其他課程衝堂，未自動加入。`);
                    } else {
                        currentCredits += addCourseToSelected(labCourse);
                    }
                }
            } else if (currentCredits + courseCredits <= hardCap) {
                // 學分不夠同時加主課+實習，只加主課
                currentCredits += addCourseToSelected(course);
                if (labCourse) {
                    labConflictWarnings.push(`「${course.course}」的實習課「${labCourse.course}」因學分不足未自動加入。`);
                }
            }
        }

        // 把實習衝堂警告加進 warnings
        if (labConflictWarnings.length) {
            state.planner.warnings = [...(state.planner.warnings || []), ...labConflictWarnings];
        }

        state.planner.selected = selected;
        const pinnedCount = allSorted.filter(c => c.pinned).length;
        const pinnedSelected = Array.from(selected.values()).filter(c => c.pinned).length;
        console.log(`[Planner] autoSelect: pool=${state.planner.pool.length}, allSorted=${allSorted.length}, pinned=${pinnedCount}, pinnedSelected=${pinnedSelected}, selected=${selected.size}, credits=${currentCredits}, targetCredits=${targetCredits}, hardCap=${hardCap}`);
    }

    function plannerAddCourse(courseId) {
        const course = state.planner.pool.find((item) => item.id === courseId);
        if (!course) return;
        if (state.planner.selected.has(course.id)) return;
        if (hasPlannerConflictWithSelected(course, state.planner.selected)) {
            showToast('此課程與目前課表衝堂，無法加入。', 'error');
            return;
        }
        state.planner.selected.set(course.id, course);
        renderPlanner();
    }

    function plannerRemoveCourse(courseId) {
        const course = state.planner.selected.get(courseId);
        if (!course) return;
        if (course.pinned) {
            showToast('已上傳課程無法移除，請重新上傳 PDF。', 'error');
            return;
        }
        state.planner.selected.delete(courseId);
        // fromCard entry 移除後也從 pool 清掉，不出現在候選清單
        if (course.fromCard) {
            state.planner.pool = state.planner.pool.filter((c) => c.id !== courseId);
        }
        // 確保 pinned 課程始終在 selected 中
        state.planner.pool.forEach((c) => {
            if (c.pinned && !state.planner.selected.has(c.id)) {
                state.planner.selected.set(c.id, c);
            }
        });
        renderPlanner();
    }

    function renderPlanner() {
        if (!elements.plannerSummary || !elements.plannerSelectedList || !elements.plannerCandidateList) return;
        document.dispatchEvent(new CustomEvent('planner-updated'));

        const summary = elements.plannerSummary;
        const selectedContainer = elements.plannerSelectedList;
        const candidateContainer = elements.plannerCandidateList;

        selectedContainer.innerHTML = '';
        candidateContainer.innerHTML = '';
        summary.classList.remove('hidden');

        if (!state.planner.hasPlan) {
            const warningText = state.planner.warnings.length ? `（${state.planner.warnings.join(' ')}）` : '';
            summary.textContent = `尚未產生課表，請先上傳課表 PDF，並設定目標學分。${warningText}`;
            selectedContainer.appendChild(createPlannerEmptyState('尚未有建議課表。'));
            candidateContainer.appendChild(createPlannerEmptyState('尚未有可加入課程。'));
            renderPlannerTimetable();
            return;
        }

        const selectedList = Array.from(state.planner.selected.values()).sort((a, b) => {
            // 已上傳課程（pinned）固定排最後
            if (a.pinned !== b.pinned) return a.pinned ? 1 : -1;
            return comparePlannerCourses(b, a);
        });
        const selectedCredits = getPlannerCreditsFromMap(state.planner.selected);
        const targetCredits = state.planner.targetCredits;
        const missingCredits = Math.max(targetCredits - selectedCredits, 0);
        const unknownTimeCount = selectedList.filter((course) => !course.timeSlots.length).length;

        const warnings = state.planner.warnings.filter(Boolean);
        const warningText = warnings.length ? `。提醒：${warnings.join(' ')}` : '';
        const unknownTimeText = unknownTimeCount
            ? `。其中 ${unknownTimeCount} 門課缺少節次，無法完整檢查衝堂`
            : '';
        const grade = state.planner.studentGrade;
        const minCredits = grade && grade >= 4 ? 9 : 12;
        const gradeWarning = grade && selectedCredits < minCredits
            ? `。⚠️ 注意：逢甲規定${grade >= 4 ? '四、五' : '一至三'}年級每學期至少需修 ${minCredits} 學分（目前僅 ${selectedCredits} 學分）`
            : '';
        summary.textContent =
            `目前已排 ${selectedList.length} 門課，共 ${selectedCredits} 學分（目標 ${targetCredits}）` +
            (missingCredits > 0 ? `，尚差 ${missingCredits} 學分` : '，已達成目標') +
            `${gradeWarning}${unknownTimeText}${warningText}`;

        if (!selectedList.length) {
            selectedContainer.appendChild(createPlannerEmptyState('沒有選到課程，請放寬條件或提高可選課程數量。'));
        } else {
            const fragment = document.createDocumentFragment();
            selectedList.forEach((course) => {
                const card = createPlannerCourseCard(course, {
                    actionLabel: '移除',
                    onAction: () => plannerRemoveCourse(course.id),
                    actionDisabled: course.pinned,
                    actionTitle: course.pinned ? '已上傳課程不可移除' : ''
                });
                fragment.appendChild(card);
            });
            selectedContainer.appendChild(fragment);
        }

        const selectedIds = new Set(state.planner.selected.keys());
        const allCandidates = state.planner.pool
            .filter((course) => !selectedIds.has(course.id))
            .sort((a, b) => comparePlannerCourses(b, a));

        if (!allCandidates.length) {
            candidateContainer.appendChild(createPlannerEmptyState('沒有更多可加入課程。'));
            renderPlannerTimetable();
            return;
        }

        // Score candidates against userContext and uploaded course names separately.
        const userContextTokens = buildPlannerUserContextTokens();
        const uploadedCourseTokens = buildPlannerUploadedCourseTokens();

        function scoreBg(course) {
            if (!userContextTokens.length) return 0;
            // Only use tokens that are meaningful (length >= 2 and not pure stop-words)
            const STOP = new Set(['我','你','他','她','想','要','修','的','了','是','不','在','有','和','跟','都','也','會','可','到','這','那','去','來','做','把','被','就','而','但','或','及','與','以','由','對','因','為']);
            const meaningful = userContextTokens.filter((t) => t.length >= 2 && !STOP.has(t));
            if (!meaningful.length) return 0;

            const courseName = course.course.toLowerCase();
            const corpus = (course.matchCorpus || `${course.course} ${course.teacher} ${course.semester} ${course.dept}`).toLowerCase();

            let score = 0;
            meaningful.forEach((t) => {
                if (!corpus.includes(t)) return;
                // Course name match scores much higher than review/tag match
                const weight = courseName.includes(t) ? 10 : (t.length >= 3 ? 2 : 1);
                score += weight;
            });
            return score;
        }
        const uploadedCourseNames = new Set(
            (state.planner.uploadedCourses || []).map((c) => (c.course || '').toLowerCase())
        );
        function scoreCourse(course) {
            if (!uploadedCourseTokens.length) return 0;
            // 不推薦與上傳課程同名的課（那是已有的課）
            if (uploadedCourseNames.has((course.course || '').toLowerCase())) return 0;
            const corpus = (course.matchCorpus || `${course.course} ${course.teacher}`).toLowerCase();
            return uploadedCourseTokens.reduce((s, t) => s + (corpus.includes(t) ? (t.length >= 2 ? 2 : 1) : 0), 0);
        }

        const bgList = [];
        const courseList = [];
        const otherList = [];
        const seenCandidateNames = new Set(); // 同課名只顯示一個代表

        allCandidates.slice(0, 300).forEach((course) => {
            if (course.course && seenCandidateNames.has(course.course)) return;
            const bg = scoreBg(course);
            const cr = scoreCourse(course);
            const base = (course.relevance ?? 0) - (course.required ? 10000 : 0);
            if (bg > 0) {
                bgList.push(course);
                if (course.course) seenCandidateNames.add(course.course);
            } else if (cr > 0) {
                courseList.push(course);
                if (course.course) seenCandidateNames.add(course.course);
            } else if (base > 0) {
                // 其他推薦只顯示有關聯分數的課
                otherList.push(course);
                if (course.course) seenCandidateNames.add(course.course);
            }
        });

        // Build teacher map: courseName → [course objects] for teacher picker
        const teacherMap = new Map();
        allCandidates.forEach((c) => {
            const name = c.course;
            if (!teacherMap.has(name)) teacherMap.set(name, []);
            teacherMap.get(name).push(c);
        });

        function appendSection(container, title, list, limit) {
            if (!list.length) return;
            const header = document.createElement('h5');
            header.className = 'text-xs font-semibold text-notion-text-secondary dark:text-dark-text-secondary uppercase tracking-wider mt-3 mb-1';
            header.textContent = title;
            container.appendChild(header);
            const frag = document.createDocumentFragment();
            list.slice(0, limit).forEach((course) => {
                const conflict = hasPlannerConflictWithSelected(course, state.planner.selected);
                const teachers = teacherMap.get(course.course) || [course];
                const card = createPlannerCourseCard(course, {
                    actionLabel: conflict ? '衝堂' : '加入',
                    onAction: () => plannerAddCourseWithTeacherPicker(course, teachers, conflict),
                    actionDisabled: conflict,
                    actionTitle: conflict ? '與目前課表節次衝突' : ''
                });
                frag.appendChild(card);
            });
            container.appendChild(frag);
        }

        appendSection(candidateContainer, '依照背景補充說明推薦課程', bgList, 30);
        appendSection(candidateContainer, '其他推薦課程', otherList, 30);

        renderPlannerTimetable();
    }

    // Palette of distinct background colours (Tailwind-compatible inline styles).
    const TIMETABLE_COLORS = [
        '#bfdbfe', '#bbf7d0', '#fde68a', '#fecaca', '#e9d5ff',
        '#fed7aa', '#a5f3fc', '#fbcfe8', '#d9f99d', '#c7d2fe'
    ];
    const TIMETABLE_TEXT_COLORS = [
        '#1e40af', '#065f46', '#92400e', '#991b1b', '#6b21a8',
        '#92400e', '#0e7490', '#9d174d', '#365314', '#312e81'
    ];

    function renderPlannerTimetable() {
        const wrap = elements.plannerTimetableWrap;
        const table = elements.plannerTimetable;
        const legend = elements.plannerTimetableLegend;
        if (!wrap || !table) return;

        // Collect courses to display: uploaded courses overlaid with current selection.
        // The timetable shows all uploaded courses; selected ones are highlighted differently.
        const uploadedCourses = Array.isArray(state.planner.uploadedCourses)
            ? state.planner.uploadedCourses : [];

        const selectedCourses = state.planner.hasPlan
            ? Array.from(state.planner.selected.values()) : [];

        // Build a union list: uploaded + selected (deduplicated by name).
        const allCourses = [];
        const seenNames = new Set();
        [...uploadedCourses, ...selectedCourses].forEach((c) => {
            const name = toPlannerString(c?.course ?? c?.name);
            if (!name || seenNames.has(name)) return;
            seenNames.add(name);
            const times = Array.isArray(c.times) ? c.times : (Array.isArray(c.timeSlots) ? c.timeSlots : []);
            allCourses.push({ name, times });
        });

        if (!allCourses.length && !state.planner.hasPlan) {
            wrap.classList.add('hidden');
            if (elements.floatingTimetable) elements.floatingTimetable.classList.add('hidden');
            return;
        }
        wrap.classList.remove('hidden');

        // Assign a color to each course.
        const courseColorMap = new Map();
        allCourses.forEach((c, idx) => {
            courseColorMap.set(c.name, idx % TIMETABLE_COLORS.length);
        });

        // Build slot → course map.  Format of times entries: "MON3", "FRI11", etc.
        const slotMap = new Map(); // "MON3" → courseName
        allCourses.forEach(({ name, times }) => {
            times.forEach((slot) => {
                const normalized = String(slot).trim().toUpperCase();
                if (!slotMap.has(normalized)) slotMap.set(normalized, name);
            });
        });

        const selectedNames = new Set(selectedCourses.map((c) => toPlannerString(c?.course ?? c?.name)));

        const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
        const DAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];
        const PERIODS = Array.from({ length: 14 }, (_, i) => i + 1);

        // Determine which days have any course slots (show at minimum Mon-Sun but collapse empty weekend cols).
        const activeDaySet = new Set();
        slotMap.forEach((_, slot) => {
            const m = slot.match(/^(MON|TUE|WED|THU|FRI|SAT|SUN)/);
            if (m) activeDaySet.add(m[1]);
        });
        // Always show Mon-Fri; show Sat/Sun only if needed.
        const visibleDays = DAYS.filter((d, i) => i < 5 || activeDaySet.has(d));

        // Build table HTML.
        const cellBase = 'border border-notion-border dark:border-dark-border px-1 py-1 text-center align-middle';
        const headerCell = `${cellBase} font-semibold bg-notion-bg-secondary dark:bg-dark-card text-notion-text-secondary dark:text-dark-text-secondary text-xs`;

        let html = '<thead><tr>';
        html += `<th class="${headerCell}" style="width:2rem;min-width:2rem;">節</th>`;
        visibleDays.forEach((d) => {
            html += `<th class="${headerCell}" style="min-width:5rem;">${DAY_LABELS[DAYS.indexOf(d)]}</th>`;
        });
        html += '</tr></thead><tbody>';

        PERIODS.forEach((period) => {
            html += '<tr>';
            html += `<td class="${cellBase} text-notion-text-secondary dark:text-dark-text-secondary font-medium text-xs" style="width:2rem;min-width:2rem;">${period}</td>`;
            visibleDays.forEach((day) => {
                const slotKey = `${day}${period}`;
                const courseName = slotMap.get(slotKey) || '';
                if (courseName) {
                    const colorIdx = courseColorMap.get(courseName) ?? 0;
                    const bg = TIMETABLE_COLORS[colorIdx];
                    const fg = TIMETABLE_TEXT_COLORS[colorIdx];
                    const isSelected = selectedNames.has(courseName);
                    const opacity = isSelected ? '1' : '0.55';
                    const escapedName = courseName.replace(/"/g, '&quot;');
                    html += `<td class="${cellBase}" data-course="${escapedName}" style="background:${bg};color:${fg};opacity:${opacity};font-size:0.72rem;line-height:1.4;min-width:5rem;word-break:break-all;white-space:normal;">${courseName}</td>`;
                } else {
                    html += `<td class="${cellBase} bg-white dark:bg-dark-bg" style="min-width:5rem;"></td>`;
                }
            });
            html += '</tr>';
        });
        html += '</tbody>';
        table.innerHTML = html;

        // Sync to floating timetable with clickable remove on selected courses
        if (elements.floatingTimetableTable) {
            elements.floatingTimetableTable.innerHTML = html;
            // Add click-to-remove on selected (non-pinned) course cells
            elements.floatingTimetableTable.querySelectorAll('td[data-course]').forEach((td) => {
                const name = td.dataset.course;
                const entry = Array.from(state.planner.selected.values()).find((c) => c.course === name);
                if (entry && !entry.pinned) {
                    td.style.cursor = 'pointer';
                    td.title = `點擊移除「${name}」`;
                    td.addEventListener('click', () => {
                        plannerRemoveCourse(entry.id);
                    });
                }
            });
        }

        // Update legend.
        if (legend) {
            const parts = [];
            if (uploadedCourses.length) parts.push(`淡色=已辨識課程（固定課表，如需異動請洽系辦）`);
            if (selectedCourses.length) parts.push(`深色=已加入課表`);
            legend.textContent = parts.join('　');
        }

        // 如果已選課程為空，強制隱藏浮動課表
        if (!selectedCourses.length && elements.floatingTimetable) {
            elements.floatingTimetable.classList.add('hidden');
            elements.floatingTimetable.dataset.manuallyClosed = '';
        } else {
            updateFloatingTimetableVisibility();
        }
    }

    function updateFloatingTimetableVisibility() {
        const floating = elements.floatingTimetable;
        const wrap = elements.plannerTimetableWrap;
        if (!floating || !wrap) return;
        if (wrap.classList.contains('hidden')) {
            floating.classList.add('hidden');
            return;
        }
        const rect = wrap.getBoundingClientRect();
        const isAboveViewport = rect.bottom < 0;
        if (!isAboveViewport) {
            // 原課表回到視野，重置手動關閉狀態
            floating.dataset.manuallyClosed = '';
            floating.classList.add('hidden');
        } else if (floating.dataset.manuallyClosed !== 'true') {
            floating.classList.remove('hidden');
        }
    }

    function createPlannerCourseCard(course, options = {}) {
        const card = document.createElement('article');
        card.className = 'rounded-md border border-notion-border dark:border-dark-border bg-notion-bg-secondary dark:bg-dark-bg-secondary p-3 flex flex-col gap-1.5';

        const topRow = document.createElement('div');
        topRow.className = 'flex items-start justify-between gap-2';

        const titleWrap = document.createElement('div');
        titleWrap.className = 'min-w-0';
        const title = document.createElement('h4');
        title.className = 'text-sm font-semibold leading-snug';
        title.textContent = course.course;
        titleWrap.appendChild(title);

        if (course.teacher) {
            const teacher = document.createElement('p');
            teacher.className = 'text-xs text-notion-text-secondary dark:text-dark-text-secondary';
            teacher.textContent = course.teacher;
            titleWrap.appendChild(teacher);
        }

        const actionButton = document.createElement('button');
        actionButton.type = 'button';
        actionButton.className = 'px-2.5 py-1 rounded-md text-xs font-medium bg-white dark:bg-dark-card border border-notion-border dark:border-dark-border hover:bg-notion-bg-hover dark:hover:bg-dark-border transition-colors duration-100 disabled:opacity-50 disabled:cursor-not-allowed';
        actionButton.textContent = options.actionLabel || '加入';
        actionButton.disabled = Boolean(options.actionDisabled);
        if (options.actionTitle) {
            actionButton.title = options.actionTitle;
        }
        if (typeof options.onAction === 'function') {
            actionButton.addEventListener('click', options.onAction);
        }

        topRow.append(titleWrap, actionButton);
        card.appendChild(topRow);

        const info = document.createElement('p');
        info.className = 'text-xs text-notion-text-secondary dark:text-dark-text-secondary break-all';
        const timeLabel = course.timeSlots.length ? course.timeSlots.join(', ') : '節次未提供';
        const pinnedLabel = course.pinned ? '已上傳課程' : (course.required ? '必修' : '可選課程');
        const displayRelevance = Number.isFinite(course.relevance) ? Math.max(0, course.relevance - (course.required ? 10000 : 0)) : 0;
        const relevanceLabel = displayRelevance.toFixed(1);
        info.textContent = `${pinnedLabel}｜${course.credits} 學分｜關聯分數 ${relevanceLabel}｜${timeLabel}`;
        card.appendChild(info);

        return card;
    }

    function createPlannerEmptyState(text) {
        const empty = document.createElement('p');
        empty.className = 'text-xs text-notion-text-secondary dark:text-dark-text-secondary py-2';
        empty.textContent = text;
        return empty;
    }

    function plannerCourseSignature(course) {
        const name = toPlannerString(course.course).toLowerCase();
        const teacher = toPlannerString(course.teacher).toLowerCase();
        return `${name}|${teacher}`;
    }

    // Normalize a course name for fuzzy matching: remove all whitespace, convert full-width chars to ASCII.
    function normalizeCourseNameForMatch(s) {
        return toPlannerString(s)
            .replace(/\s+/g, '')                          // remove all spaces
            .replace(/[\uff01-\uff5e]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0)) // full-width → ASCII
            .toLowerCase();
    }

    // Look up credits for a PDF-parsed course from the fcu_courses catalog.
    // Matches by normalised course name (and optionally teacher name).
    function enrichPlannerCourseCredits(course) {
        if (course.credits != null) return course;

        // Strip trailing "(老師名)" suffixes that may be embedded in the parsed course name.
        // e.g. "專題研究(一)(陳錫民)" → "專題研究(一)", "體育(二)(黃素)" → "體育(二)"
        // Also handle unclosed brackets from PDF truncation: "體育(二)(黃素" → "體育(二)"
        const rawName = toPlannerString(course.course);
        let strippedName = rawName.replace(/[（(][^()（）]{2,6}[)）]$/, (match) => {
            const inner = match.replace(/[（()）]/g, '');
            if (/^[\u4e00-\u9fffA-Za-z]{2,6}$/.test(inner)) return '';
            return match;
        });
        // Remove unclosed trailing bracket like "(黃素" at end of string
        strippedName = strippedName.replace(/[（(][\u4e00-\u9fffA-Za-z]{1,6}$/, '');
        const name = normalizeCourseNameForMatch(strippedName);
        const teacher = normalizeCourseNameForMatch(course.teacher);

        // Check if a catalog teacher list contains our teacher (exact or prefix match).
        // Prefix match handles truncated names from PDF e.g. "黃素" matching "黃素珍".
        function teacherMatches(catalogTeacherStr) {
            if (!teacher) return false;
            return toPlannerString(catalogTeacherStr)
                .split(/[,，、\/]/)
                .map((t) => normalizeCourseNameForMatch(t))
                .filter(Boolean)
                .some((t) => t === teacher || (teacher.length >= 2 && t.startsWith(teacher)));
        }

        // Pass 1: exact course name match
        let best = null;
        let bestHasTeacher = false;
        // Collect all credits values for this course name to detect if they're all the same
        const exactMatches = [];
        for (const c of state.courses) {
            if (c.sourceKey !== 'fcu_scrape') continue;
            const cname = normalizeCourseNameForMatch(c.course);
            if (cname !== name) continue;
            exactMatches.push(c);
            const tm = teacherMatches(c.teacher);
            if (tm && !bestHasTeacher) {
                best = c;
                bestHasTeacher = true;
            } else if (!best) {
                best = c;
            }
            if (bestHasTeacher) break;
        }
        // If teacher is unknown but all matching entries have the same credits, use that value safely
        if (!bestHasTeacher && exactMatches.length) {
            const uniqueCredits = new Set(exactMatches.map((c) => c.credits).filter((v) => v != null));
            if (uniqueCredits.size === 1) {
                best = exactMatches[0];
                bestHasTeacher = false;
            }
        }
        if (best && best.credits != null) {
            return { ...course, credits: best.credits };
        }

        // Pass 2: prefix match — handles junk appended to course name in FCU PDF cells
        // e.g. "人工智慧導論資電330(電腦實習" → prefix "人工智慧導論" (min 4 chars, teacher must match)
        let prefixBest = null;
        let prefixBestLen = 0;
        for (const c of state.courses) {
            if (c.sourceKey !== 'fcu_scrape') continue;
            const cname = normalizeCourseNameForMatch(c.course);
            if (cname.length < 4 || !name.startsWith(cname) || cname.length <= prefixBestLen) continue;
            if (teacherMatches(c.teacher)) {
                prefixBest = c;
                prefixBestLen = cname.length;
            }
        }
        if (prefixBest && prefixBest.credits != null) {
            return { ...course, credits: prefixBest.credits };
        }

        return course;
    }

    function buildPlannerUserContextTokens() {
        const raw = (elements.userContext?.value || '').toLowerCase();
        return raw.split(/[\s,，、;/|]+/).map((t) => t.trim()).filter((t) => t.length >= 2);
    }

    function buildPlannerUploadedCourseTokens() {
        const uploaded = Array.isArray(state.planner.uploadedCourses) ? state.planner.uploadedCourses : [];
        const raw = uploaded.map((c) => toPlannerString(c.course)).join(' ').toLowerCase();
        return raw.split(/[\s,，、;/|]+/).map((t) => t.trim()).filter((t) => t.length >= 2);
    }

    function plannerAddCourseWithTeacherPicker(course, allTeacherVariants, conflict) {
        if (conflict) return;
        // Filter to non-conflicting, non-selected variants
        const available = allTeacherVariants.filter((v) => {
            if (state.planner.selected.has(v.id)) return false;
            if (hasPlannerConflictWithSelected(v, state.planner.selected)) return false;
            return true;
        });
        // Unique teachers
        const uniqueTeachers = [];
        const seenTeachers = new Set();
        available.forEach((v) => {
            const key = v.teacher || '（未知教師）';
            if (!seenTeachers.has(key)) { seenTeachers.add(key); uniqueTeachers.push(v); }
        });

        if (uniqueTeachers.length <= 1) {
            plannerAddCourse(course.id);
            return;
        }

        // Show inline teacher picker modal
        showPlannerTeacherPicker(course.course, uniqueTeachers);
    }

    function showPlannerTeacherPicker(courseName, variants) {
        // Remove any existing picker
        const existing = document.getElementById('planner-teacher-picker');
        if (existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.id = 'planner-teacher-picker';
        overlay.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black/40';
        overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

        const box = document.createElement('div');
        box.className = 'bg-white dark:bg-dark-card rounded-lg shadow-xl p-5 max-w-sm w-full mx-4';

        const title = document.createElement('h4');
        title.className = 'text-sm font-semibold mb-3';
        title.textContent = `選擇「${courseName}」的教師`;
        box.appendChild(title);

        const list = document.createElement('div');
        list.className = 'flex flex-col gap-2 max-h-60 overflow-y-auto';

        variants.forEach((v) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'text-left px-3 py-2 rounded-md border border-notion-border dark:border-dark-border text-sm hover:bg-notion-bg-hover dark:hover:bg-dark-border transition-colors';
            const teacherLabel = v.teacher || '（教師未提供）';
            const timeLabel = v.timeSlots?.length ? v.timeSlots.join(', ') : '節次未知';
            const relevanceLabel = Number.isFinite(v.relevance) ? ` · 關聯 ${Math.max(0, v.relevance - (v.required ? 10000 : 0)).toFixed(1)}` : '';
            btn.innerHTML = `<span class="font-medium">${teacherLabel}</span><span class="text-xs text-notion-text-secondary dark:text-dark-text-secondary ml-2">${timeLabel}${relevanceLabel}</span>`;
            btn.addEventListener('click', () => {
                overlay.remove();
                plannerAddCourse(v.id);
            });
            list.appendChild(btn);
        });

        box.appendChild(list);

        const cancelBtn = document.createElement('button');
        cancelBtn.type = 'button';
        cancelBtn.className = 'mt-3 text-xs text-notion-text-secondary dark:text-dark-text-secondary hover:underline';
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', () => overlay.remove());
        box.appendChild(cancelBtn);

        overlay.appendChild(box);
        document.body.appendChild(overlay);
    }

    function buildPlannerProfileTokens() {
        const tokens = new Set();
        const raw = [
            elements.userContext?.value || '',
            elements.courseInput?.value || '',
            ...Array.from(state.activeTagFilters),
            ...Array.from(state.favorites.values()).slice(0, 12).map((course) => course.course)
        ]
            .join(' ')
            .toLowerCase();

        // 先用標點切詞
        const segments = raw.split(/[\s,，、;/|。！？!?()（）【】]+/).map((t) => t.trim()).filter(Boolean);
        segments.forEach((token) => tokens.add(token));

        // 再對每個 segment 做 2-6 字的 n-gram 切片，捕捉中文課名
        segments.forEach((seg) => {
            for (let len = 2; len <= 6; len++) {
                for (let i = 0; i <= seg.length - len; i++) {
                    const sub = seg.slice(i, i + len);
                    if (/[\u4e00-\u9fff]/.test(sub)) tokens.add(sub);
                }
            }
        });

        state.activeTagFilters.forEach((tag) => {
            getTagSearchPhrases(tag).forEach((phrase) => {
                if (phrase) tokens.add(phrase.toLowerCase());
            });
        });

        return Array.from(tokens);
    }

    function computePlannerRelevance(course, profileTokens, aiKeywords = []) {
        const courseName = (course.course || '').toLowerCase();
        const corpus = [
            course.course,
            course.teacher,
            course.review,
            (course.tags || []).join(' '),
            course.matchCorpus
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();

        let score = 0;

        // AI 關鍵字評分（主要評分來源）
        aiKeywords.forEach(({ term, weight }) => {
            if (!term) return;
            const t = term.toLowerCase();
            if (courseName === t) {
                score += weight * 3;       // 課名完全相符：最高分
            } else if (courseName.includes(t) || t.includes(courseName)) {
                score += weight * 2;       // 課名部分相符
            } else if (corpus.includes(t)) {
                score += weight * 0.5;     // 只在 corpus 裡出現
            }
        });

        // fallback：profileTokens 簡單 token 比對（AI 無結果時）
        if (!aiKeywords.length) {
            profileTokens.forEach((token) => {
                if (!token || token.length < 2) return;
                if (courseName.includes(token)) {
                    score += token.length >= 3 ? 5 : 2;
                } else if (corpus.includes(token)) {
                    score += token.length >= 3 ? 2 : 1;
                }
            });
        }

        if (Number.isFinite(course.score)) {
            score += Math.max(0, Math.min(course.score, 100)) / 25;
        }
        if (Number.isFinite(course.difficulty)) {
            score += Math.max(0, 5 - course.difficulty) * 0.2;
        }
        if (course.required) {
            score += 10000;
        }

        return Number(score.toFixed(2));
    }

    function comparePlannerCourses(a, b) {
        if (a.required !== b.required) {
            return a.required ? 1 : -1;
        }
        if (a.relevance !== b.relevance) {
            return a.relevance - b.relevance;
        }
        const scoreA = Number.isFinite(a.score) ? a.score : -Infinity;
        const scoreB = Number.isFinite(b.score) ? b.score : -Infinity;
        if (scoreA !== scoreB) {
            return scoreA - scoreB;
        }
        return a.course.localeCompare(b.course, 'zh-Hant');
    }

    function hasPlannerConflictWithSelected(course, selectedMap) {
        for (const selected of selectedMap.values()) {
            if (plannerCoursesConflict(course, selected)) {
                return true;
            }
        }
        return false;
    }

    function plannerCoursesConflict(a, b) {
        if (!a.timeSlots.length || !b.timeSlots.length) return false;
        const bSet = new Set(b.timeSlots);
        return a.timeSlots.some((slot) => bSet.has(slot));
    }

    function getPlannerCreditsFromMap(map) {
        let sum = 0;
        map.forEach((course) => {
            sum += Number.isFinite(course.credits) ? course.credits : 0;
        });
        return sum;
    }

    function inferPlannerCredits(tags) {
        const normalized = Array.isArray(tags) ? tags.map((tag) => String(tag).toLowerCase()) : [];
        if (normalized.some((tag) => tag.includes('體育'))) return 1;
        if (normalized.some((tag) => tag.includes('通識') || tag.includes('語文'))) return 2;
        return 3;
    }

    function createPlannerId(item, index) {
        return [
            toPlannerString(item.course ?? item.course_name ?? item.name ?? item.title),
            toPlannerString(item.teacher ?? item.professor ?? item.instructor),
            toPlannerString(item.semester),
            index
        ].join('|');
    }

    function normalizePlannerTags(rawTags) {
        if (!Array.isArray(rawTags)) return [];
        return rawTags
            .map((tag) => toPlannerString(tag))
            .filter(Boolean)
            .slice(0, 20);
    }

    function normalizePlannerTimes(rawTimes) {
        if (!rawTimes) return [];
        const tokens = new Set();
        const values = Array.isArray(rawTimes) ? rawTimes : [rawTimes];
        values.forEach((value) => {
            const text = toPlannerString(value);
            if (!text) return;
            parsePlannerTimeExpression(text).forEach((slot) => tokens.add(slot));
        });
        return Array.from(tokens);
    }

    function parsePlannerTimeExpression(text) {
        const parts = text.split(/[\s,，、;；|/]+/).filter(Boolean);
        const slots = [];
        parts.forEach((part) => {
            normalizePlannerTimeToken(part).forEach((slot) => slots.push(slot));
        });
        return slots;
    }

    function normalizePlannerTimeToken(rawToken) {
        const token = toPlannerString(rawToken).replace(/[()（）]/g, '');
        if (!token) return [];

        let upper = token.toUpperCase();
        const dayAlias = [
            { regex: /^(?:星期|週|禮拜|礼拜)?一/, day: 'MON' },
            { regex: /^(?:星期|週|禮拜|礼拜)?二/, day: 'TUE' },
            { regex: /^(?:星期|週|禮拜|礼拜)?三/, day: 'WED' },
            { regex: /^(?:星期|週|禮拜|礼拜)?四/, day: 'THU' },
            { regex: /^(?:星期|週|禮拜|礼拜)?五/, day: 'FRI' },
            { regex: /^(?:星期|週|禮拜|礼拜)?六/, day: 'SAT' },
            { regex: /^(?:星期|週|禮拜|礼拜)?日|^(?:星期|週|禮拜|礼拜)?天/, day: 'SUN' }
        ];

        dayAlias.forEach(({ regex, day }) => {
            upper = upper.replace(regex, day);
        });

        upper = upper
            .replace(/^MONDAY/, 'MON')
            .replace(/^TUESDAY/, 'TUE')
            .replace(/^WEDNESDAY/, 'WED')
            .replace(/^THURSDAY/, 'THU')
            .replace(/^FRIDAY/, 'FRI')
            .replace(/^SATURDAY/, 'SAT')
            .replace(/^SUNDAY/, 'SUN')
            .replace(/[^A-Z0-9,-]/g, '');

        const dayMatch = upper.match(/^(MON|TUE|WED|THU|FRI|SAT|SUN)/);
        if (!dayMatch) return [];
        const day = dayMatch[1];
        const periodsRaw = upper.slice(day.length);
        const periods = expandPlannerPeriods(periodsRaw);
        if (!periods.length) return [];
        return periods.map((period) => `${day}${period}`);
    }

    function expandPlannerPeriods(periodsRaw) {
        if (!periodsRaw) return [];
        const chunks = periodsRaw.split(',').map((chunk) => chunk.trim()).filter(Boolean);
        const values = [];

        chunks.forEach((chunk) => {
            if (chunk.includes('-')) {
                const [left, right] = chunk.split('-');
                const start = parsePlannerPeriodSymbol(left);
                const end = parsePlannerPeriodSymbol(right);
                if (start !== null && end !== null) {
                    const min = Math.min(start, end);
                    const max = Math.max(start, end);
                    for (let value = min; value <= max; value++) {
                        values.push(value);
                    }
                }
                return;
            }

            if (/^\d{2,}$/.test(chunk)) {
                // Two-digit numbers >= 10 are actual period numbers (10-14).
                // Shorter sequences like "123" are legacy single-digit concatenations.
                if (chunk.length === 2) {
                    const num = Number(chunk);
                    if (num >= 10 && num <= 14) { values.push(num); return; }
                }
                chunk.split('').forEach((symbol) => {
                    const value = parsePlannerPeriodSymbol(symbol);
                    if (value !== null) values.push(value);
                });
                return;
            }

            const value = parsePlannerPeriodSymbol(chunk);
            if (value !== null) values.push(value);
        });

        const unique = Array.from(new Set(values.filter((value) => Number.isFinite(value))));
        return unique.sort((a, b) => a - b).map((value) => String(value));
    }

    function parsePlannerPeriodSymbol(symbol) {
        const token = toPlannerString(symbol).toUpperCase();
        if (!token) return null;
        if (/^\d+$/.test(token)) {
            const num = Number(token);
            return Number.isFinite(num) ? num : null;
        }
        const map = { A: 11, B: 12, C: 13, D: 14 };
        return map[token] ?? null;
    }

    function toPlannerString(value) {
        if (value === null || value === undefined) return '';
        return String(value).trim();
    }

    function toPlannerNumber(value) {
        if (value === null || value === undefined || value === '') return null;
        const numeric = Number(String(value).replace(/[^\d.-]/g, ''));
        return Number.isFinite(numeric) ? numeric : null;
    }

    async function performAnalysis(course, output, button) {
        const context = elements.userContext.value.trim();
        if (!context) {
            output.textContent = '請先在「背景補充說明」欄位描述你的需求，再啟動 AI 評估。';
            output.classList.remove('hidden');
            output.classList.add('text-notion-red');
            return;
        }

        output.classList.remove('hidden', 'text-notion-red');
        output.textContent = 'AI 評估進行中...';
        button.disabled = true;
        const originalBtnText = button.textContent;
        button.textContent = '評估中...';

        try {
            const response = await (window.authFetch || fetch)((window.API_BASE_URL || '') + '/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseName: course.course,
                    tags: course.tags,
                    userContext: context,
                    review: course.review
                })
            });

            if (!response.ok) {
                const payload = await safeParseJSON(response);
                throw new Error(payload?.error || 'AI 分析請求失敗，請稍後再試。');
            }

            const payload = await response.json();
            if (payload?.analysis) {
                output.textContent = payload.analysis;
            } else if (payload?.error) {
                output.textContent = payload.error;
                output.classList.add('text-notion-red');
            } else {
                output.textContent = 'AI 未傳回建議內容，請稍後再試。';
                output.classList.add('text-notion-red');
            }
        } catch (error) {
            output.textContent = error.message || 'AI 分析過程發生問題，請稍後再試。';
            output.classList.add('text-red-500');
        } finally {
            button.disabled = false;
            button.textContent = originalBtnText;
        }
    }

    function updateSummary(count, context = {}) {
        const summary = elements.resultsSummary;
        summary.classList.remove('hidden');

        if (context.isPreview) {
            summary.textContent = `精選熱門課程，挑出 ${count} 門課程供你快速參考。`;
            return;
        }

        const parts = [];
        if (context.query) {
            parts.push(`關鍵字「${context.query}」`);
        }
        if (context.tags && context.tags.length) {
            parts.push(`標籤 ${context.tags.join('、')}`);
        }
        if (context.sources && context.sources.length) {
            const labels = context.sources.map((key) => formatSource(key));
            parts.push(`資料來源 ${labels.join('、')}`);
        }
        if (context.minDifficulty !== null || context.maxDifficulty !== null) {
            const min = context.minDifficulty !== null ? context.minDifficulty : '不限';
            const max = context.maxDifficulty !== null ? context.maxDifficulty : '不限';
            parts.push(`難度 ${min} ~ ${max}`);
        }
        if (context.minScore !== null) {
            parts.push(`推薦分數 ≥ ${context.minScore}`);
        }

        const suffix = parts.length ? `（${parts.join('；')}）` : '';
        if (count) {
            summary.textContent = `共找到 ${count} 門課程${suffix}`;
        } else if (context.hasActiveFilters) {
            summary.textContent = `沒有找到符合條件的課程${suffix}，試著調整關鍵字或放寬篩選。`;
        } else {
            summary.textContent = '目前尚未搜尋課程，輸入關鍵字即可開始。';
        }
    }

    function showBootstrapError(message) {
        elements.resultsSummary.classList.remove('hidden');
        elements.resultsSummary.textContent = message;
        elements.searchResults.innerHTML = '';
        const error = document.createElement('div');
        error.className = 'col-span-full text-center text-notion-red text-sm py-8';
        error.textContent = message;
        elements.searchResults.appendChild(error);
    }

    async function safeParseJSON(response) {
        try {
            return await response.json();
        } catch {
            return null;
        }
    }

    function getNumericScore(course) {
        if (!course.score) return null;
        const numeric = Number(String(course.score).replace(/[^\d.]/g, ''));
        return Number.isFinite(numeric) ? numeric : null;
    }

    function parseSelectValue(value) {
        if (!value) return null;
        const num = Number(value);
        return Number.isFinite(num) ? num : null;
    }

    function formatSource(key) {
        return SOURCE_LABELS[key] || key || '其他';
    }

    function buildTagMeta(tags, corpus, sourceKey) {
        if (!tags.length) return [];
        return tags.map((label) => {
            const evidence = hasTextEvidence(label, corpus);
            return {
                label,
                confidence: computeTagConfidence(label, sourceKey, evidence)
            };
        });
    }

    function hasTextEvidence(tag, corpus) {
        if (!tag || !corpus) return false;
        const phrases = getTagSearchPhrases(tag);
        return phrases.some((phrase) => phrase && corpus.includes(phrase));
    }

    function computeTagConfidence(tag, sourceKey, hasEvidence) {
        if (!tag) return 'low';
        if (hasEvidence) return 'high';
        if (sourceKey !== 'converted_coursesd') return 'high';
        return 'low';
    }

    function normalizeTag(label) {
        return label ? label.toString().trim().toLowerCase().replace(/\s+/g, '') : '';
    }

    function getTagSearchPhrases(label) {
        if (!label) return [];
        const normalized = normalizeTag(label);
        const synonyms = TAG_SYNONYM_MAP[normalized] || [];
        const tokens = new Set();
        if (normalized) tokens.add(normalized);
        const lowerWithSpaces = label.toString().trim().toLowerCase();
        if (lowerWithSpaces) tokens.add(lowerWithSpaces);
        synonyms.forEach((phrase) => {
            if (phrase) {
                const lower = phrase.toLowerCase();
                tokens.add(lower);
                tokens.add(lower.replace(/\s+/g, ''));
            }
        });
        const englishParts = (label.match(/[A-Za-z0-9+#]+/g) || []).map((part) => part.toLowerCase());
        englishParts.forEach((part) => tokens.add(part));
        return Array.from(tokens).filter(Boolean);
    }

    function syncStateToURL(query, minDiff, maxDiff, minScore) {
        const params = new URLSearchParams();
        if (query) params.set('q', query);
        if (state.activeTagFilters.size) params.set('tags', Array.from(state.activeTagFilters).join(','));
        if (state.activeSourceFilters.size) params.set('sources', Array.from(state.activeSourceFilters).join(','));
        if (minDiff !== null) params.set('minDiff', minDiff);
        if (maxDiff !== null) params.set('maxDiff', maxDiff);
        if (minScore !== null) params.set('minScore', minScore);
        const sort = elements.sortSelect.value;
        if (sort && sort !== 'course') params.set('sort', sort);
        const url = params.toString() ? `?${params.toString()}` : window.location.pathname;
        history.replaceState(null, '', url);
    }

    function restoreStateFromURL() {
        const params = new URLSearchParams(window.location.search);
        if (!params.toString()) return false;

        const q = params.get('q');
        if (q) elements.courseInput.value = q;

        const tags = params.get('tags');
        if (tags) {
            tags.split(',').forEach((tag) => {
                state.activeTagFilters.add(tag);
                const labels = elements.tagFilters.querySelectorAll('label');
                labels.forEach((label) => {
                    const input = label.querySelector('input');
                    if (input && input.value === tag) {
                        input.checked = true;
                        label.classList.add('filter-chip-active');
                    }
                });
            });
        }

        const sources = params.get('sources');
        if (sources) {
            sources.split(',').forEach((src) => {
                state.activeSourceFilters.add(src);
                const labels = elements.sourceFilters.querySelectorAll('label');
                labels.forEach((label) => {
                    const input = label.querySelector('input');
                    if (input && input.value === src) {
                        input.checked = true;
                        label.classList.add('filter-chip-active');
                    }
                });
            });
        }

        if (params.get('minDiff')) elements.minDifficulty.value = params.get('minDiff');
        if (params.get('maxDiff')) elements.maxDifficulty.value = params.get('maxDiff');
        if (params.get('minScore')) elements.minScore.value = params.get('minScore');
        if (params.get('sort')) elements.sortSelect.value = params.get('sort');

        return Boolean(q || tags || sources || params.get('minDiff') || params.get('maxDiff') || params.get('minScore'));
    }
})();

// NID 登入模組
(() => {
    const API_BASE = window.API_BASE_URL || '';

    function getToken() { return sessionStorage.getItem('nid_token'); }
    function getUser() {
        try { return JSON.parse(sessionStorage.getItem('nid_user')); } catch { return null; }
    }

    // 讓全站 fetch 可以帶 JWT（掛到 window 供其他模組使用）
    window.authFetch = function(url, options = {}) {
        const token = getToken();
        if (token) {
            options.headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
        }
        return fetch(url, options);
    };

    function showLoginWall() {
        // 遮住整個頁面內容，強制登入
        const wall = document.createElement('div');
        wall.id = 'login-wall';
        wall.className = 'fixed inset-0 z-50 flex flex-col items-center justify-center bg-white dark:bg-dark-bg';
        wall.innerHTML = `
            <div class="text-center max-w-sm px-6">
                <div class="w-14 h-14 rounded-xl bg-notion-accent flex items-center justify-center text-white font-bold text-lg mx-auto mb-5">FCU</div>
                <h1 class="text-xl font-semibold mb-2">逢甲選課助手</h1>
                <p class="text-sm text-notion-text-secondary dark:text-dark-text-secondary mb-6">
                    請使用逢甲 NID 帳號登入，以記錄你的選課紀錄。
                </p>
                <button id="wall-login-btn"
                    class="w-full py-2.5 rounded-lg bg-notion-accent text-white font-medium hover:opacity-90 transition-opacity">
                    使用逢甲 NID 登入
                </button>
            </div>`;
        document.body.appendChild(wall);
        document.getElementById('wall-login-btn').addEventListener('click', startNidLogin);
    }

    function renderAuth() {
        const loginBtn = document.getElementById('nid-login-btn');
        const userInfo = document.getElementById('nid-user-info');
        const logoutBtn = document.getElementById('nid-logout-btn');
        const user = getUser();

        if (user) {
            loginBtn.classList.add('hidden');
            userInfo.textContent = `${user.name}（${user.unit_name || user.dept_name || user.type}）`;
            userInfo.classList.remove('hidden');
            logoutBtn.classList.remove('hidden');
        } else {
            loginBtn.classList.remove('hidden');
            userInfo.classList.add('hidden');
            logoutBtn.classList.add('hidden');
        }
    }

    async function startNidLogin() {
        try {
            const res = await fetch(`${API_BASE}/api/auth/nid-url`);
            const data = await res.json();
            if (data.url) window.location.href = data.url;
        } catch {
            alert('無法取得登入網址，請稍後再試。');
        }
    }

    document.getElementById('nid-login-btn')?.addEventListener('click', startNidLogin);
    document.getElementById('nid-logout-btn')?.addEventListener('click', () => {
        sessionStorage.removeItem('nid_token');
        sessionStorage.removeItem('nid_user');
        renderAuth();
        showLoginWall();
    });

    // 頁面載入時檢查是否已登入
    if (!getUser() || !getToken()) {
        showLoginWall();
    }
    renderAuth();
})();
