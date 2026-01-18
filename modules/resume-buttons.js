// 简历按钮功能
(function() {
    'use strict';
    
    // 简历侧边栏切换
    window.toggleResumeSidebar = function() {
        const sidebar = document.getElementById('resumeSidebar');
        if (sidebar) {
            sidebar.classList.toggle('active');
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