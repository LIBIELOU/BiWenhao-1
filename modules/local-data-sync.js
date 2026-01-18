// 本地数据同步模块（静态版本禁用）
(function() {
    'use strict';
    
    window.LocalDataSync = {
        // 同步数据
        sync: function() {
            return new Promise(function(resolve, reject) {
                console.log('静态版本：本地数据同步功能已禁用');
                resolve({
                    success: true,
                    message: '静态版本无需同步'
                });
            });
        },
        
        // 手动同步
        manualSync: function() {
            return window.LocalDataSync.sync();
        },
        
        // 保存数据到本地
        saveToLocal: function(key, data) {
            try {
                localStorage.setItem(key, JSON.stringify(data));
                return {
                    success: true,
                    message: '数据已保存到本地'
                };
            } catch (e) {
                console.error('保存数据到本地失败:', e);
                return {
                    success: false,
                    message: '保存失败: ' + e.message
                };
            }
        },
        
        // 从本地加载数据
        loadFromLocal: function(key) {
            try {
                const data = localStorage.getItem(key);
                if (data) {
                    return {
                        success: true,
                        data: JSON.parse(data)
                    };
                }
                return {
                    success: false,
                    message: '未找到数据'
                };
            } catch (e) {
                console.error('从本地加载数据失败:', e);
                return {
                    success: false,
                    message: '加载失败: ' + e.message
                };
            }
        }
    };
    
    console.log('本地数据同步模块已加载（静态版本）');
})();