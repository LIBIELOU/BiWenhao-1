// 简历按钮功能
(function() {
    'use strict';
    
    // 预加载简历资源
    let resumePreloaded = false;
    
    function preloadResumeResources() {
        if (resumePreloaded) return;
        
        console.log('开始预加载简历资源...');
        
        // 预加载简历相关的 CSS 和 JS
        const resources = [
            '/styles.css',
            '/modules/resume-buttons.css',
            '/modules/resume-buttons.js'
        ];
        
        resources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = resource;
            document.head.appendChild(link);
        });
        
        resumePreloaded = true;
        console.log('简历资源预加载完成');
    }
    
    // 页面加载后预加载简历资源
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', preloadResumeResources);
    } else {
        preloadResumeResources();
    }
    
    // 简历侧边栏切换 - 与 styles.css 中的样式一致
    window.toggleResumeSidebar = function() {
        console.log('toggleResumeSidebar 被调用 (resume-buttons.js)');
        const sidebar = document.getElementById('resumeSidebar');
        const overlay = document.getElementById('resumeOverlay');
        const toggleBtn = document.getElementById('resumeToggleBtn') || document.querySelector('.resume-toggle');
        const body = document.body;
        
        if (!sidebar) {
            console.error('找不到简历侧边栏元素');
            return;
        }
        
        if (!overlay) {
            console.error('找不到简历遮罩元素');
            return;
        }
        
        if (!toggleBtn) {
            console.error('找不到简历切换按钮');
            return;
        }
        
        try {
            if (sidebar.classList.contains('open')) {
                // 关闭简历
                console.log('关闭简历');
                sidebar.classList.remove('open');
                overlay.classList.remove('show');
                toggleBtn.classList.remove('active');
                body.classList.remove('resume-open');
            } else {
                // 打开简历
                console.log('打开简历');
                sidebar.classList.add('open');
                overlay.classList.add('show');
                toggleBtn.classList.add('active');
                body.classList.add('resume-open');
            }
        } catch (error) {
            console.error('切换简历侧边栏时出错:', error);
        }
    };
    
    // 初始化简历功能
    window.initResumeFunctionality = function() {
        console.log('简历功能已初始化');
        
        // 可以在这里添加简历相关的功能
        // 例如：编辑简历、导出简历等
    };
    
    console.log('简历按钮模块已加载');
})();