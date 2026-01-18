// 视频模态框播放功能
(function() {
    'use strict';
    
    // 在模态框中播放视频
    window.playVideoInModal = function(videoUrl, title, description) {
        const modal = document.getElementById('videoModal');
        const videoPlayer = document.getElementById('videoPlayer');
        const videoTitle = document.getElementById('videoTitle');
        const videoDescription = document.getElementById('videoDescription');
        
        if (!modal || !videoPlayer) {
            console.error('视频模态框元素未找到');
            return;
        }
        
        // 设置视频源
        videoPlayer.src = videoUrl;
        videoPlayer.load();
        
        // 设置标题和描述
        if (videoTitle) {
            videoTitle.textContent = title || '视频播放';
        }
        if (videoDescription) {
            videoDescription.textContent = description || '';
        }
        
        // 显示模态框
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // 自动播放视频
        videoPlayer.play().catch(function(error) {
            console.log('自动播放失败，可能需要用户交互:', error);
        });
    };
    
    // 关闭视频模态框
    window.closeVideoModal = function() {
        const modal = document.getElementById('videoModal');
        const videoPlayer = document.getElementById('videoPlayer');
        
        if (modal) {
            modal.style.display = 'none';
        }
        
        if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer.src = '';
        }
        
        document.body.style.overflow = 'auto';
    };
    
    // 页面加载完成后绑定关闭按钮事件
    document.addEventListener('DOMContentLoaded', function() {
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeVideoModal);
        }
        
        // 点击模态框外部关闭
        window.addEventListener('click', function(e) {
            const modal = document.getElementById('videoModal');
            if (modal && e.target === modal) {
                closeVideoModal();
            }
        });
        
        // ESC键关闭模态框
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeVideoModal();
            }
        });
    });
})();