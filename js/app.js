// 应用状态
const state = {
    currentChapter: 'chapter1',
    chapters: [
        { id: 'chapter1', title: '线性代数', file: 'docs/chapter1.md', enabled: true },
        { id: 'chapter2', title: '概率与信息论', file: 'docs/chapter2.md', enabled: false },
        { id: 'chapter3', title: '数值计算', file: 'docs/chapter3.md', enabled: false }
    ],
    isDarkMode: false,
    sidebarOpen: false
};

// DOM 元素
const elements = {
    menuToggle: null,
    themeToggle: null,
    chapterList: null,
    markdownContent: null,
    progressFill: null,
    currentChapter: null,
    tocList: null,
    tocFloat: null,
    prevBtn: null,
    nextBtn: null
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    initElements();
    initEventListeners();
    loadChapter('chapter1');
    initTheme();
});

// 初始化 DOM 元素引用
function initElements() {
    elements.menuToggle = document.getElementById('menuToggle');
    elements.themeToggle = document.getElementById('themeToggle');
    elements.chapterList = document.getElementById('chapter-list');
    elements.markdownContent = document.getElementById('markdown-content');
    elements.progressFill = document.getElementById('progressFill');
    elements.currentChapter = document.getElementById('currentChapter');
    elements.tocList = document.getElementById('toc-list');
    elements.tocFloat = document.getElementById('tocFloat');
    elements.prevBtn = document.querySelector('.prev-btn');
    elements.nextBtn = document.querySelector('.next-btn');
}

// 初始化事件监听器
function initEventListeners() {
    // 菜单切换
    elements.menuToggle.addEventListener('click', toggleSidebar);
    
    // 主题切换
    elements.themeToggle.addEventListener('click', toggleTheme);
    
    // 章节切换
    elements.chapterList.addEventListener('click', handleChapterClick);
    
    // 滚动进度
    window.addEventListener('scroll', updateProgress);
    
    // 底部导航
    elements.prevBtn.addEventListener('click', () => navigateChapter(-1));
    elements.nextBtn.addEventListener('click', () => navigateChapter(1));
}

// 初始化主题
function initTheme() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        enableDarkMode();
    }
}

// 切换侧边栏
function toggleSidebar() {
    const sidebar = document.querySelector('.sidebar');
    sidebar.classList.toggle('open');
    state.sidebarOpen = !state.sidebarOpen;
}

// 切换主题
function toggleTheme() {
    if (state.isDarkMode) {
        disableDarkMode();
    } else {
        enableDarkMode();
    }
}

function enableDarkMode() {
    document.documentElement.setAttribute('data-theme', 'dark');
    elements.themeToggle.textContent = '☀️';
    state.isDarkMode = true;
    localStorage.setItem('theme', 'dark');
}

function disableDarkMode() {
    document.documentElement.removeAttribute('data-theme');
    elements.themeToggle.textContent = '🌙';
    state.isDarkMode = false;
    localStorage.setItem('theme', 'light');
}

// 处理章节点击
function handleChapterClick(e) {
    const chapterItem = e.target.closest('.chapter-item');
    if (!chapterItem || chapterItem.classList.contains('disabled')) return;
    
    const chapterId = chapterItem.dataset.chapter;
    loadChapter(chapterId);
    
    // 移动端关闭侧边栏
    if (window.innerWidth <= 768) {
        toggleSidebar();
    }
}

// 加载章节
async function loadChapter(chapterId) {
    const chapter = state.chapters.find(c => c.id === chapterId);
    if (!chapter || !chapter.enabled) return;
    
    // 更新活动状态
    document.querySelectorAll('.chapter-item').forEach(item => {
        item.classList.remove('active');
        if (item.dataset.chapter === chapterId) {
            item.classList.add('active');
        }
    });
    
    // 显示加载状态
    elements.markdownContent.innerHTML = '<div class="loading"></div>';
    elements.currentChapter.textContent = chapter.title;
    state.currentChapter = chapterId;
    
    try {
        // 加载 Markdown 文件
        const response = await fetch(chapter.file);
        if (!response.ok) throw new Error('无法加载章节内容');
        
        const markdown = await response.text();
        
        // 渲染 Markdown
        const html = marked.parse(markdown);
        elements.markdownContent.innerHTML = html;
        
        // 渲染数学公式
        renderMathInElement(elements.markdownContent, {
            delimiters: [
                {left: '$$', right: '$$', display: true},
                {left: '$', right: '$', display: false},
                {left: '\\(', right: '\\)', display: false},
                {left: '\\[', right: '\\]', display: true}
            ],
            throwOnError: false
        });
        
        // 生成目录
        generateTOC();
        
        // 更新底部导航
        updateNavButtons();
        
        // 滚动到顶部
        window.scrollTo(0, 0);
        
    } catch (error) {
        console.error('加载章节失败:', error);
        elements.markdownContent.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: var(--text-secondary);">
                <h3>加载失败</h3>
                <p>无法加载章节内容，请稍后重试。</p>
            </div>
        `;
    }
}

// 生成目录
function generateTOC() {
    const headings = elements.markdownContent.querySelectorAll('h2, h3');
    elements.tocList.innerHTML = '';
    
    headings.forEach((heading, index) => {
        // 为标题添加 ID
        const id = `heading-${index}`;
        heading.id = id;
        
        // 创建目录项
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `#${id}`;
        a.textContent = heading.textContent;
        a.style.paddingLeft = heading.tagName === 'H3' ? '1rem' : '0';
        a.style.display = 'block';
        
        li.appendChild(a);
        elements.tocList.appendChild(li);
        
        // 点击平滑滚动
        a.addEventListener('click', (e) => {
            e.preventDefault();
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

// 更新阅读进度
function updateProgress() {
    const scrollTop = window.pageYOffset;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    elements.progressFill.style.width = `${progress}%`;
}

// 更新导航按钮
function updateNavButtons() {
    const currentIndex = state.chapters.findIndex(c => c.id === state.currentChapter);
    
    // 上一章按钮
    const hasPrev = currentIndex > 0;
    elements.prevBtn.disabled = !hasPrev;
    
    // 下一章按钮
    const hasNext = currentIndex < state.chapters.length - 1 && 
                    state.chapters[currentIndex + 1].enabled;
    elements.nextBtn.disabled = !hasNext;
}

// 导航章节
function navigateChapter(direction) {
    const currentIndex = state.chapters.findIndex(c => c.id === state.currentChapter);
    const newIndex = currentIndex + direction;
    
    if (newIndex >= 0 && newIndex < state.chapters.length) {
        const newChapter = state.chapters[newIndex];
        if (newChapter.enabled) {
            loadChapter(newChapter.id);
        }
    }
}

// 辅助函数：防抖
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// 响应式处理
window.addEventListener('resize', debounce(() => {
    if (window.innerWidth > 768 && state.sidebarOpen) {
        toggleSidebar();
    }
}, 250));
