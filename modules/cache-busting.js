// 缓存破坏模块
(function() {
    'use strict';
    
    window.CacheBusting = {
        // 生成版本号
        getVersion: function() {
            return Date.now().toString();
        },
        
        // 更新资源URL
        updateResourceUrls: function() {
            const version = window.CacheBusting.getVersion();
            
            // 更新CSS文件
            const cssLinks = document.querySelectorAll('link[rel="stylesheet"]');
            cssLinks.forEach(function(link) {
                const href = link.getAttribute('href');
                if (href && !href.includes('?v=')) {
                    link.setAttribute('href', href + '?v=' + version);
                }
            });
            
            // 更新JS文件
            const scriptTags = document.querySelectorAll('script[src]');
            scriptTags.forEach(function(script) {
                const src = script.getAttribute('src');
                if (src && !src.includes('?v=')) {
                    script.setAttribute('src', src + '?v=' + version);
                }
            });
        }
    };
    
    console.log('缓存破坏模块已加载');
})();