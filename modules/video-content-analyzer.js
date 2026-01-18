// 视频内容分析器（静态版本禁用）
(function() {
    'use strict';
    
    window.VideoContentAnalyzer = {
        // 分析视频内容
        analyzeVideo: function(videoFile, options) {
            return new Promise(function(resolve, reject) {
                console.log('静态版本：视频内容分析功能已禁用');
                reject(new Error('静态版本不支持视频内容分析'));
            });
        },
        
        // 获取视频元数据
        getMetadata: function(videoFile) {
            return new Promise(function(resolve, reject) {
                const video = document.createElement('video');
                video.preload = 'metadata';
                
                video.onloadedmetadata = function() {
                    const metadata = {
                        duration: video.duration,
                        width: video.videoWidth,
                        height: video.videoHeight
                    };
                    URL.revokeObjectURL(video.src);
                    resolve(metadata);
                };
                
                video.onerror = function() {
                    URL.revokeObjectURL(video.src);
                    reject(new Error('无法读取视频元数据'));
                };
                
                video.src = URL.createObjectURL(videoFile);
            });
        }
    };
    
    console.log('视频内容分析器已加载（静态版本）');
})();