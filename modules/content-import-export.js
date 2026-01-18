// 内容导入导出功能（静态版本禁用）
(function() {
    'use strict';
    
    window.ContentImportExport = {
        // 导出内容
        exportContent: function(data) {
            return new Promise(function(resolve, reject) {
                console.log('静态版本：内容导出功能已禁用');
                reject(new Error('静态版本不支持内容导出'));
            });
        },
        
        // 导入内容
        importContent: function(file) {
            return new Promise(function(resolve, reject) {
                console.log('静态版本：内容导入功能已禁用');
                reject(new Error('静态版本不支持内容导入'));
            });
        }
    };
    
    console.log('内容导入导出模块已加载（静态版本）');
})();