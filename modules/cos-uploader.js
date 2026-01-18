// 腾讯云COS上传功能（静态版本禁用）
(function() {
    'use strict';
    
    // COS配置
    window.COSUploader = {
        COS_CONFIG: {
            SecretId: '',
            SecretKey: '',
            Bucket: '',
            Region: '',
            Domain: '',
            Folder: 'uploads/'
        },
        
        // 初始化
        init: function() {
            console.log('COS上传器已初始化（静态版本）');
        },
        
        // 上传文件
        uploadFile: function(file, options) {
            return new Promise(function(resolve, reject) {
                console.log('静态版本：COS上传功能已禁用');
                reject(new Error('静态版本不支持COS上传'));
            });
        },
        
        // 获取文件分类
        getFileCategory: function(mimeType) {
            if (mimeType.startsWith('image/')) {
                return 'images';
            } else if (mimeType.startsWith('video/')) {
                return 'videos';
            }
            return 'other';
        },
        
        // 验证文件大小
        validateFileSize: function(file, maxSizeMB) {
            const maxSizeBytes = maxSizeMB * 1024 * 1024;
            return file.size <= maxSizeBytes;
        },
        
        // 加载配置
        loadConfig: function() {
            const savedConfig = localStorage.getItem('cosConfig');
            if (savedConfig) {
                try {
                    window.COSUploader.COS_CONFIG = JSON.parse(savedConfig);
                } catch (e) {
                    console.error('加载COS配置失败:', e);
                }
            }
        },
        
        // 保存配置
        saveConfig: function(config) {
            window.COSUploader.COS_CONFIG = config;
            localStorage.setItem('cosConfig', JSON.stringify(config));
        }
    };
    
    // 页面加载时初始化
    document.addEventListener('DOMContentLoaded', function() {
        window.COSUploader.init();
        window.COSUploader.loadConfig();
    });
})();