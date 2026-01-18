// 内容同步模块（静态版本禁用）
(function() {
    'use strict';
    
    window.ContentSync = {
        // 同步内容
        sync: function() {
            return new Promise(function(resolve, reject) {
                console.log('静态版本：内容同步功能已禁用');
                reject(new Error('静态版本不支持内容同步'));
            });
        },
        
        // 手动同步
        manualSync: function() {
            return window.ContentSync.sync();
        }
    };
    
    console.log('内容同步模块已加载（静态版本）');
})();