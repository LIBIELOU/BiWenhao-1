// 视频缩略图生成器（静态版本禁用）
(function() {
    'use strict';
    
    window.VideoThumbnailGenerator = {
        // 生成缩略图
        generateThumbnail: function(videoFile, options) {
            return new Promise(function(resolve, reject) {
                console.log('静态版本：缩略图生成功能已禁用');
                reject(new Error('静态版本不支持缩略图生成'));
            });
        },
        
        // 从视频URL生成缩略图
        generateFromUrl: function(videoUrl, options) {
            return new Promise(function(resolve, reject) {
                console.log('静态版本：缩略图生成功能已禁用');
                reject(new Error('静态版本不支持缩略图生成'));
            });
        }
    };
    
    console.log('视频缩略图生成器已加载（静态版本）');
})();