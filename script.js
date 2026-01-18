
// 静态数据加载
let contentData = {};
let slideData = [];
let portfolioData = [];

// 尝试从静态数据文件加载
if (typeof WEBSITE_DATA !== 'undefined') {
  contentData = WEBSITE_DATA.data.contentData || {};
  slideData = WEBSITE_DATA.data.slideData || [];
  if (WEBSITE_DATA.data.portfolioData) {
    portfolioData = Array.isArray(WEBSITE_DATA.data.portfolioData) 
      ? WEBSITE_DATA.data.portfolioData 
      : JSON.parse(WEBSITE_DATA.data.portfolioData);
  }
}

// 幻灯片数据 - 已使用静态数据
// const slideData = [...];

// 幻灯片控制变量
let currentSlideIndex = 0;
let slideInterval;

// 作品内容数据 - 已使用静态数据
// const contentData = {...};

// 视频作品数据 - 已使用静态数据
// const portfolioData = [...];

// DOM元素
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');
const navLinks = document.querySelectorAll('.nav-link');
const filterBtns = document.querySelectorAll('.filter-btn');
const portfolioGrid = document.querySelector('.portfolio-grid');
const modal = document.getElementById('videoModal');
const closeModal = document.querySelector('.close');

// 管理员相关DOM元素
const adminLoginBtn = document.getElementById('adminLoginBtn');
const adminModal = document.getElementById('adminModal');
const adminClose = document.querySelector('.admin-close');
const adminLoginForm = document.getElementById('adminLoginForm');
const adminPanel = document.getElementById('adminPanel');
const logoutBtn = document.getElementById('logoutBtn');
const uploadForm = document.getElementById('uploadForm');
const videoList = document.getElementById('videoList');

// 管理员状态
let isAdminLoggedIn = false;

// 管理员凭据 (实际应用中应该使用更安全的方式)
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: 'admin123'
};

// 初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 页面刷新后自动滚动到顶部
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    // 加载COS配置
    if (window.COSUploader) {
        loadCOSConfig();
    }
    
    setupEventListeners();
    setupSmoothScroll();
    checkAdminStatus();
    loadVideosFromStorage();
    loadImagesFromStorage(); // 加载图片数据
    initSlideshow();
    
    // 先加载内容数据（从服务器或本地）
    // loadContentData 内部会调用渲染函数，所以这里不需要再调用 renderAllContent()
    await loadContentData();
    
    // 更新联系信息
    updateContactInfo();
    
    setupAIGCCategoryDropdown();
    
    // 初始化简历功能
    initResumeFunctionality();
    
    // 立即确保管理员按钮可见
    const adminOnlyElements = document.querySelectorAll('.admin-only');
    adminOnlyElements.forEach(el => {
        el.style.display = 'block';
        el.style.visibility = 'visible';
    });
    
    // 额外确保管理员按钮和事件监听器设置
    setTimeout(() => {
        const adminBtn = document.getElementById('adminLoginBtn');
        if (adminBtn) {
            adminBtn.parentElement.style.display = 'block';
            adminBtn.parentElement.style.visibility = 'visible';
            
            // 移除旧的事件监听器并添加新的
            adminBtn.removeEventListener('click', handleAdminLoginClick);
            adminBtn.addEventListener('click', handleAdminLoginClick);
            
            console.log('管理员按钮已设置:', adminBtn);
        } else {
            console.error('找不到管理员按钮');
        }
    }, 100);
    
    // 初始化AIGC全部分类视图
    setTimeout(() => {
        filterAIGCContent('all');
    }, 200);
    
    // 延迟重新绑定图片点击事件，确保所有元素都已加载
    setTimeout(() => {
        rebindImageClickEvents();
    }, 1000);
    
    // 额外的简历功能初始化
    setTimeout(() => {
        console.log('额外的简历功能初始化');
        initResumeFunctionality();
    }, 500);
    
    // 如果是管理员已登录状态，更新COS状态指示器
    if (isAdminLoggedIn) {
        setTimeout(() => {
            updateCOSStatus();
        }, 100);
    }
    
    // 添加窗口大小变化监听器，用于重新计算图片尺寸
    window.addEventListener('resize', function() {
        // 检查当前是否在摄影或动画分类
        const aigcGrid = document.getElementById('aigcGrid');
        if (aigcGrid && (aigcGrid.classList.contains('category-photography') || aigcGrid.classList.contains('category-animation'))) {
            // 重新调整所有图片容器的尺寸
            const portfolioItems = aigcGrid.querySelectorAll('.portfolio-item');
            portfolioItems.forEach(item => {
                const img = item.querySelector('img');
                if (img && img.classList.contains('loaded')) {
                    adjustImageContainerSize(img, item);
                }
            });
        }
    });
});

// 管理员登录点击处理函数
function handleAdminLoginClick(e) {
    e.preventDefault();
    e.stopPropagation();
    console.log('管理员登录按钮被点击');
    
    // 如果已经登录，直接打开管理员面板
    if (isAdminLoggedIn) {
        showAdminInterface();
        return;
    }
    
    const adminModal = document.getElementById('adminModal');
    if (adminModal) {
        adminModal.style.display = 'block';
        console.log('管理员模态框已显示');
        
        // 获取保存的登录信息
        const savedUsername = localStorage.getItem('adminUsername');
        const savedPassword = localStorage.getItem('adminPassword');
        const rememberPassword = localStorage.getItem('rememberPassword') === 'true';
        
        // 填充表单
        const usernameInput = document.getElementById('adminUsername');
        const passwordInput = document.getElementById('adminPassword');
        const rememberCheckbox = document.getElementById('rememberPassword');
        
        if (usernameInput) {
            usernameInput.value = savedUsername || '';
        }
        if (passwordInput) {
            passwordInput.value = savedPassword || '';
        }
        if (rememberCheckbox) {
            rememberCheckbox.checked = rememberPassword;
        }
        
        // 聚焦到用户名输入框（如果没有保存的用户名）或密码输入框（如果有保存的用户名）
        setTimeout(() => {
            if (savedUsername) {
                if (passwordInput) passwordInput.focus();
            } else {
                if (usernameInput) usernameInput.focus();
            }
        }, 100);
    } else {
        console.error('找不到管理员模态框');
    }
}

// 设置事件监听器
function setupEventListeners() {
    // 移动端菜单切换
    hamburger.addEventListener('click', () => {
        hamburger.classList.toggle('active');
        navMenu.classList.toggle('active');
    });

    // 导航链接点击事件
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            hamburger.classList.remove('active');
            navMenu.classList.remove('active');
            
            // 设置活动链接
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
        });
    });
    
    // 管理员登录按钮 - 确保元素存在
    const adminLoginBtn = document.getElementById('adminLoginBtn');
    if (adminLoginBtn) {
        adminLoginBtn.addEventListener('click', handleAdminLoginClick);
    }

    // 筛选按钮点击事件
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 更新活动按钮
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // 筛选作品
            const filter = btn.getAttribute('data-filter');
            renderPortfolioItems(filter);
        });
    });

    // 模态框关闭事件
    closeModal.addEventListener('click', () => {
        closeVideoModal();
    });

    // 点击模态框外部关闭
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeVideoModal();
        }
        if (e.target === adminModal) {
            adminModal.style.display = 'none';
        }
        // 账号详情模态框
        const accountDetailsModal = document.getElementById('accountDetailsModal');
        if (accountDetailsModal && e.target === accountDetailsModal) {
            closeAccountDetailsModal();
        }
    });

    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            closeVideoModal();
        }
        if (e.key === 'Escape' && adminModal.style.display === 'block') {
            adminModal.style.display = 'none';
        }
        // 账号详情模态框
        const accountDetailsModal = document.getElementById('accountDetailsModal');
        if (e.key === 'Escape' && accountDetailsModal) {
            closeAccountDetailsModal();
        }
    });

    

    // 管理员模态框关闭
    const adminClose = document.querySelector('.admin-close');
    if (adminClose) {
        adminClose.addEventListener('click', () => {
            const adminModal = document.getElementById('adminModal');
            if (adminModal) {
                adminModal.style.display = 'none';
            }
        });
    }

    // 管理员登录表单
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleAdminLogin();
        });
    }

    // 返回主页按钮
    const backToHomeBtn = document.getElementById('backToHomeBtn');
    if (backToHomeBtn) {
        backToHomeBtn.addEventListener('click', () => {
            handleBackToHome();
        });
    }

    // 退出登录
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            handleAdminLogout();
        });
    }

    

    // 配置COS按钮
    const configCOSBtn = document.getElementById('configCOSBtn');
    if (configCOSBtn) {
        configCOSBtn.addEventListener('click', () => {
            console.log('配置COS按钮被点击');
            showCOSConfigModal();
        });
    } else {
        console.error('找不到配置COS按钮');
    }

    // 数据同步按钮
    const syncDataBtn = document.getElementById('syncDataBtn');
    if (syncDataBtn) {
        syncDataBtn.addEventListener('click', () => {
            console.log('数据同步按钮被点击');
            if (window.LocalDataSync) {
                showNotification('正在同步数据...', 'info');
                window.LocalDataSync.manualSync().then(() => {
                    showNotification('数据同步完成', 'success');
                }).catch((error) => {
                    console.error('数据同步失败:', error);
                    // showNotification('数据同步失败', 'error'); // 静态版本禁用数据同步失败提示
                });
            } else {
                showNotification('数据同步模块未加载', 'error');
            }
        });
    } else {
        console.error('找不到数据同步按钮');
    }

    // 媒体上传表单
    uploadForm.addEventListener('submit', (e) => {
        e.preventDefault();
        handleMediaUpload();
    });
    
    // 联系信息表单提交
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            handleContactInfoSave();
        });
    }
    
    // 媒体类型选择变化
    const mediaTypeSelect = document.getElementById('mediaType');
    if (mediaTypeSelect) {
        mediaTypeSelect.addEventListener('change', (e) => {
            const mediaType = e.target.value;
            const durationGroup = document.getElementById('videoDurationGroup');
            const fileInput = document.getElementById('mediaFile');
            const fileTypeHint = document.getElementById('fileTypeHint');
            
            if (mediaType === 'video') {
                if (durationGroup) durationGroup.style.display = 'block';
                if (fileInput) fileInput.accept = 'video/*';
                if (fileTypeHint) fileTypeHint.textContent = '支持MP4、AVI、MOV等视频格式';
            } else if (mediaType === 'image') {
                if (durationGroup) durationGroup.style.display = 'none';
                if (fileInput) fileInput.accept = 'image/*';
                if (fileTypeHint) fileTypeHint.textContent = '支持JPG、PNG、GIF等图片格式';
            } else {
                if (durationGroup) durationGroup.style.display = 'none';
                if (fileInput) fileInput.accept = 'video/*,image/*';
                if (fileTypeHint) fileTypeHint.textContent = '支持视频和图片文件';
            }
        });
    }

    // 添加方式选择变化
    const uploadMethodSelect = document.getElementById('uploadMethod');
    if (uploadMethodSelect) {
        uploadMethodSelect.addEventListener('change', (e) => {
            const uploadMethod = e.target.value;
            const mediaFileGroup = document.getElementById('mediaFileGroup');
            const mediaLinkGroup = document.getElementById('mediaLinkGroup');
            const mediaFileInput = document.getElementById('mediaFile');
            const mediaLinkInput = document.getElementById('mediaLink');
            
            if (uploadMethod === 'file') {
                if (mediaFileGroup) mediaFileGroup.style.display = 'block';
                if (mediaLinkGroup) mediaLinkGroup.style.display = 'none';
                if (mediaFileInput) mediaFileInput.required = true;
                if (mediaLinkInput) mediaLinkInput.required = false;
            } else if (uploadMethod === 'link') {
                if (mediaFileGroup) mediaFileGroup.style.display = 'none';
                if (mediaLinkGroup) mediaLinkGroup.style.display = 'block';
                if (mediaFileInput) mediaFileInput.required = false;
                if (mediaLinkInput) mediaLinkInput.required = true;
            }
        });
    }

    // 视频文件选择事件
    const videoFileInput = document.getElementById('videoFile');
    if (videoFileInput) {
        videoFileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // 显示文件信息
                const videoUrlGroup = document.getElementById('videoUrlGroup');
                const videoUrlInput = document.getElementById('videoUrl');
                
                if (videoUrlGroup) videoUrlGroup.style.display = 'block';
                if (videoUrlInput) videoUrlInput.value = `已选择文件: ${file.name}`;
                
                // 如果没有填写时长，尝试从视频文件获取
                const videoDurationInput = document.getElementById('videoDuration');
                if (videoDurationInput && !videoDurationInput.value) {
                    getVideoDuration(file);
                }
            }
        });
    }

    
}

// 渲染作品集项目
function renderPortfolioItems(filter) {
    // 清空现有内容 - 使用 video-grid 而不是 portfolio-grid
    const portfolioGrid = document.querySelector('.video-grid');
    if (!portfolioGrid) {
        console.error('找不到作品集网格容器 (.video-grid)');
        return;
    }
    
    // 保留默认的示例视频（如果没有上传的视频）
    if (portfolioData.length === 0) {
        console.log('没有上传的视频，保持默认显示');
        return;
    }
    
    // 清空现有内容
    portfolioGrid.innerHTML = '';
    
    // 筛选数据
    const filteredData = filter === 'all' 
        ? portfolioData 
        : portfolioData.filter(item => item.category === filter);
    
    // 如果没有筛选结果
    if (filteredData.length === 0) {
        portfolioGrid.innerHTML = '<p class="no-results">该分类下暂无作品</p>';
        return;
    }
    
    // 渲染每个作品项
    filteredData.forEach((item, index) => {
        const portfolioItem = createPortfolioItem(item);
        portfolioItem.style.animationDelay = `${index * 0.1}s`;
        portfolioGrid.appendChild(portfolioItem);
    });
    
    console.log(`已渲染 ${filteredData.length} 个视频作品`);
}

// 创建作品集项目元素
function createPortfolioItem(item) {
    const div = document.createElement('div');
    div.className = 'video-item';
    div.setAttribute('data-category', item.category);
    
    div.innerHTML = `
        <div class="video-thumbnail" onclick="playVideoInModal('${item.videoUrl}', '${item.title}', '${item.description}')">
            <img src="${item.thumbnail}" alt="${item.title}">
        </div>
        <h4>${item.title}</h4>
        <p>${item.description}</p>
    `;
    
    return div;
}

// 打开视频模态框
function openVideoModal(item) {
    const videoTitle = document.getElementById('videoTitle');
    const videoDescription = document.getElementById('videoDescription');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoDuration = document.getElementById('videoDuration');
    const videoYear = document.getElementById('videoYear');
    const downloadBtn = document.getElementById('downloadBtn');
    const shareBtn = document.getElementById('shareBtn');
    
    // 设置内容
    videoTitle.textContent = item.title;
    videoDescription.textContent = item.description;
    videoDuration.innerHTML = `<i class="fas fa-clock"></i> ${item.duration}`;
    videoYear.innerHTML = `<i class="fas fa-calendar"></i> ${item.year}`;
    
    // 设置视频源
    videoPlayer.src = item.videoUrl;
    videoPlayer.load();
    
    // 添加视频元数据加载事件，自动调整视频尺寸
    videoPlayer.addEventListener('loadedmetadata', function() {
        const videoAspectRatio = videoPlayer.videoWidth / videoPlayer.videoHeight;
        const windowAspectRatio = window.innerWidth / window.innerHeight;
        
        // 根据视频和窗口的长宽比调整视频样式
        if (videoAspectRatio > windowAspectRatio) {
            // 视频更宽，以宽度为准
            videoPlayer.style.width = '100vw';
            videoPlayer.style.height = 'auto';
        } else {
            // 视频更高，以高度为准
            videoPlayer.style.width = 'auto';
            videoPlayer.style.height = '100vh';
        }
        
        // 确保视频居中
        videoPlayer.style.position = 'absolute';
        videoPlayer.style.top = '50%';
        videoPlayer.style.left = '50%';
        videoPlayer.style.transform = 'translate(-50%, -50%)';
    });
    
    // 设置下载按钮
    downloadBtn.onclick = () => {
        const link = document.createElement('a');
        link.href = item.videoUrl;
        link.download = `${item.title}.mp4`;
        link.click();
    };
    
    // 设置分享按钮
    shareBtn.onclick = () => {
        if (navigator.share) {
            navigator.share({
                title: item.title,
                text: item.description,
                url: window.location.href
            });
        } else {
            // 复制链接到剪贴板
            navigator.clipboard.writeText(window.location.href);
            showNotification('链接已复制到剪贴板');
        }
    };
    
    // 显示模态框
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 设置平滑滚动
function setupSmoothScroll() {
    // 为所有锚点链接添加平滑滚动
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 导航栏滚动效果
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.padding = '10px 0';
        navbar.style.background = 'rgba(0, 0, 0, 0.95)';
    } else {
        navbar.style.padding = '0';
        navbar.style.background = 'rgba(0, 0, 0, 0.9)';
    }
});

// 页面滚动动画
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('section-visible');
        }
    });
}, observerOptions);

// 观察所有作品区域
document.addEventListener('DOMContentLoaded', () => {
    const portfolioSections = document.querySelectorAll('.portfolio-section');
    portfolioSections.forEach(section => {
        observer.observe(section);
    });
    
    // 平滑滚动到作品区域
    setupSmoothScrollToPortfolio();
});

// 设置平滑滚动到作品区域
function setupSmoothScrollToPortfolio() {
    // 修改原有的平滑滚动功能
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// 水平滚动功能
function setupHorizontalScroll() {
    const scrollTrack = document.querySelector('.scroll-track');
    if (!scrollTrack) return;
    
    let isDown = false;
    let startX;
    let scrollLeft;
    
    scrollTrack.addEventListener('mousedown', (e) => {
        isDown = true;
        scrollTrack.style.cursor = 'grabbing';
        startX = e.pageX - scrollTrack.offsetLeft;
        scrollLeft = scrollTrack.scrollLeft;
    });
    
    scrollTrack.addEventListener('mouseleave', () => {
        isDown = false;
        scrollTrack.style.cursor = 'grab';
    });
    
    scrollTrack.addEventListener('mouseup', () => {
        isDown = false;
        scrollTrack.style.cursor = 'grab';
    });
    
    scrollTrack.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - scrollTrack.offsetLeft;
        const walk = (x - startX) * 2;
        scrollTrack.scrollLeft = scrollLeft - walk;
    });
}

// 初始化水平滚动
document.addEventListener('DOMContentLoaded', () => {
    setupHorizontalScroll();
});

// 视频播放控制
function setupVideoControls() {
    const playButtons = document.querySelectorAll('.play-btn');
    const videoContainers = document.querySelectorAll('.video-container');
    
    playButtons.forEach(button => {
        button.addEventListener('click', () => {
            const container = button.closest('.video-container');
            const video = container.querySelector('video');
            
            if (video) {
                if (video.paused) {
                    video.play();
                    button.innerHTML = '<i class="fas fa-pause"></i>';
                } else {
                    video.pause();
                    button.innerHTML = '<i class="fas fa-play"></i>';
                }
            }
        });
    });
    
    // 视频结束时重置播放按钮
    videoContainers.forEach(container => {
        const video = container.querySelector('video');
        const playButton = container.querySelector('.play-btn');
        
        if (video && playButton) {
            video.addEventListener('ended', () => {
                playButton.innerHTML = '<i class="fas fa-play"></i>';
            });
        }
    });
}

// 初始化视频控制
document.addEventListener('DOMContentLoaded', () => {
    setupVideoControls();
});

// 账号关注按钮功能
function setupFollowButtons() {
    const followButtons = document.querySelectorAll('.follow-btn');
    
    followButtons.forEach(button => {
        button.addEventListener('click', () => {
            if (button.textContent === '关注' || button.textContent === '订阅') {
                button.textContent = '已关注';
                button.style.background = 'rgba(120, 120, 198, 0.3)';
                button.style.borderColor = 'rgba(120, 120, 198, 0.5)';
                button.style.color = '#7878c6';
            } else {
                button.textContent = button.textContent === '已关注' ? '关注' : '订阅';
                button.style.background = 'rgba(120, 120, 198, 0.2)';
                button.style.borderColor = 'rgba(120, 120, 198, 0.3)';
            }
        });
    });
}

// 初始化关注按钮
document.addEventListener('DOMContentLoaded', () => {
    setupFollowButtons();
});

// 查看详情按钮功能
function setupViewButtons() {
    const viewButtons = document.querySelectorAll('.view-btn');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', () => {
            // 这里可以添加打开详情页面的逻辑
            console.log('查看详情');
        });
    });
}

// 初始化查看详情按钮
document.addEventListener('DOMContentLoaded', () => {
    setupViewButtons();
});

// 添加作品功能（可扩展）
function addPortfolioItem(item) {
    portfolioData.push(item);
    renderPortfolioItems('all');
}

// 更新作品功能（可扩展）
function updatePortfolioItem(id, updatedItem) {
    const index = portfolioData.findIndex(item => item.id === id);
    if (index !== -1) {
        portfolioData[index] = { ...portfolioData[index], ...updatedItem };
        renderPortfolioItems('all');
    }
}

// 删除作品功能（可扩展）
function removePortfolioItem(id) {
    const index = portfolioData.findIndex(item => item.id === id);
    if (index !== -1) {
        portfolioData.splice(index, 1);
        renderPortfolioItems('all');
    }
}



// 管理员功能
function checkAdminStatus() {
  // 静态版本禁用管理员状态检查
  isAdminLoggedIn = false;
}

// 测试管理员功能
window.testAdminLogin = function() {
    const adminModal = document.getElementById('adminModal');
    if (adminModal) {
        adminModal.style.display = 'block';
        console.log('测试：管理员模态框已显示');
    } else {
        console.error('测试：找不到管理员模态框');
    }
};

// 强制显示管理员按钮
window.showAdminButton = function() {
    const adminBtn = document.getElementById('adminLoginBtn');
    if (adminBtn) {
        adminBtn.parentElement.style.display = 'block';
        adminBtn.parentElement.style.visibility = 'visible';
        console.log('测试：管理员按钮已强制显示');
    } else {
        console.error('测试：找不到管理员按钮');
    }
};

function handleAdminLogin() {
  // 静态版本禁用管理员登录
  console.log('静态版本：管理员功能已禁用');
  showNotification('静态版本不支持管理员功能', 'info');
}

function handleBackToHome() {
    // 隐藏管理员面板，但保持登录状态
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
    
    // 滚动到页面顶部
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
    
    showNotification('已返回主页');
}

function handleAdminLogout() {
    isAdminLoggedIn = false;
    localStorage.setItem('adminLoggedIn', 'false');
    
    // 询问用户是否要清除保存的登录信息
    const rememberPassword = localStorage.getItem('rememberPassword') === 'true';
    if (rememberPassword) {
        if (confirm('是否要清除保存的登录信息？')) {
            localStorage.removeItem('adminUsername');
            localStorage.removeItem('adminPassword');
            localStorage.removeItem('rememberPassword');
        }
    }
    
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.style.display = 'none';
    }
    document.body.style.overflow = 'auto';
    showNotification('已退出登录');
}

function showAdminInterface() {
  // 静态版本禁用管理员界面
  console.log('静态版本：管理员界面已禁用');
}

// 媒体文件上传功能（集成腾讯云COS）
async function handleMediaUpload() {
    const titleInput = document.getElementById('mediaTitle');
    const typeInput = document.getElementById('mediaType');
    const durationInput = document.getElementById('videoDuration');
    const fileInput = document.getElementById('mediaFile');
    const linkInput = document.getElementById('mediaLink');
    const uploadMethodInput = document.getElementById('uploadMethod');
    const uploadForm = document.getElementById('uploadForm');
    const submitBtn = uploadForm ? uploadForm.querySelector('button[type="submit"]') : null;
    
    if (!titleInput || !typeInput || !uploadMethodInput) {
        showNotification('表单元素未找到', 'error');
        return;
    }
    
    const title = titleInput.value;
    const mediaType = typeInput.value;
    const uploadMethod = uploadMethodInput.value;
    let duration = durationInput ? durationInput.value : '';
    
    if (!mediaType) {
        showNotification('请选择作品类型', 'error');
        return;
    }
    
    if (!uploadMethod) {
        showNotification('请选择添加方式', 'error');
        return;
    }
    
    // 禁用提交按钮并显示上传进度
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 处理中...';
    }
    
    try {
        if (uploadMethod === 'file') {
            // 上传文件模式
            const mediaFile = fileInput.files[0];
            
            if (!mediaFile) {
                showNotification('请选择文件', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '添加作品';
                }
                return;
            }
            
            // 验证文件类型与选择类型是否匹配
            const fileCategory = window.COSUploader.getFileCategory(mediaFile.type);
            if ((mediaType === 'video' && fileCategory !== 'videos') || 
                (mediaType === 'image' && fileCategory !== 'images')) {
                showNotification('文件类型与选择的作品类型不匹配', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '添加作品';
                }
                return;
            }
            
            // 验证文件大小
            const maxSizeMB = mediaType === 'video' ? 500 : 20;
            if (!window.COSUploader.validateFileSize(mediaFile, maxSizeMB)) {
                showNotification(`${mediaType === 'video' ? '视频' : '图片'}文件大小不能超过${maxSizeMB}MB`, 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '添加作品';
                }
                return;
            }
            
            // 检查COS配置
            if (!window.COSUploader.COS_CONFIG.SecretId || !window.COSUploader.COS_CONFIG.SecretKey) {
                showNotification('请先配置腾讯云COS参数', 'error');
                showCOSConfigModal();
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '添加作品';
                }
                return;
            }
            
            // 如果是视频且时长为空，先获取视频时长
            if (mediaType === 'video' && !duration) {
                duration = await getVideoDurationAsync(mediaFile);
            }
            
            let uploadResult;
            
            // 如果是视频，自动使用第一帧作为缩略图
            if (mediaType === 'video') {
                // 显示缩略图生成进度
                if (submitBtn) {
                    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 生成视频缩略图...';
                }
                
                try {
                    // 自动捕获视频第一帧作为缩略图
                    const thumbnailUrl = await captureFirstFrame(mediaFile);
                    
                    // 将缩略图转换为文件
                    const thumbnailFile = window.videoThumbnailGenerator.dataUrlToFile(
                        thumbnailUrl,
                        `thumbnail_${mediaFile.name.split('.')[0]}.jpg`
                    );
                    
                    // 上传文件到腾讯云COS
                    uploadResult = await window.COSUploader.uploadVideoWithCustomThumbnail(
                        mediaFile,
                        thumbnailFile,
                        (progress, type) => {
                            const progressText = type === 'thumbnail' ? 
                                `上传缩略图 ${progress}%` : 
                                `上传视频 ${progress}%`;
                            
                            if (submitBtn) {
                                submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${progressText}`;
                            }
                        }
                    );
                    
                    // 设置上传结果
                    uploadResult.videoUrl = uploadResult.video.url;
                    uploadResult.thumbnailUrl = uploadResult.thumbnail.url;
                    uploadResult.videoKey = uploadResult.video.key;
                    uploadResult.thumbnailKey = uploadResult.thumbnail.key;
                    
                } catch (error) {
                    console.error('缩略图生成失败，使用默认方式:', error);
                    // 如果缩略图生成失败，回退到默认方式
                    uploadResult = await window.COSUploader.uploadVideoWithThumbnail(
                        mediaFile,
                        (progress, type) => {
                            const progressText = type === 'thumbnail' ? 
                                `生成缩略图 ${progress}%` : 
                                `上传视频 ${progress}%`;
                            
                            if (submitBtn) {
                                submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> ${progressText}`;
                            }
                        }
                    );
                }
            } else {
                // 图片上传
                uploadResult = await window.COSUploader.uploadImage(
                    mediaFile,
                    (progress) => {
                        if (submitBtn) {
                            submitBtn.innerHTML = `<i class="fas fa-spinner fa-spin"></i> 上传图片 ${progress}%`;
                        }
                    }
                );
            }
            
            // 自动生成默认信息
            const categories = ['commercial', 'artistic', 'documentary'];
            const categoryNames = {
                'commercial': '商业',
                'artistic': '艺术',
                'documentary': '纪录片'
            };
            
            // 随机生成默认信息
            const category = categories[Math.floor(Math.random() * categories.length)];
            const description = `精彩作品《${title}》，展现了独特的创意和专业的制作水准，是一部值得细细品味的优秀作品。`;
            const tags = [];
            
            const year = new Date().getFullYear();
            
            // 创建新的媒体对象，使用COS返回的URL
            const newMedia = {
                id: Date.now(),
                title,
                type: mediaType,
                category,
                categoryName: categoryNames[category],
                description,
                duration: duration || '',
                year,
                fileName: mediaFile.name,
                size: uploadResult.size || uploadResult.video.size,
                uploadTime: new Date().toISOString(),
                tags: tags
            };
            
            // 根据媒体类型设置不同的URL
            if (mediaType === 'video') {
                newMedia.videoUrl = uploadResult.videoUrl || uploadResult.video.url;
                newMedia.thumbnail = uploadResult.thumbnailUrl || uploadResult.thumbnail.url;
                newMedia.cosKey = uploadResult.videoKey || uploadResult.video.key;
                newMedia.thumbnailKey = uploadResult.thumbnailKey || uploadResult.thumbnail.key;
            } else {
                newMedia.imageUrl = uploadResult.url;
                newMedia.thumbnail = uploadResult.url; // 图片自身就是缩略图
                newMedia.cosKey = uploadResult.key;
            }
            
            // 保存到对应的存储
            if (mediaType === 'video') {
                portfolioData.push(newMedia);
                saveVideosToStorage();
            } else {
                // 如果是图片，添加到图片数据存储
                if (!window.imageData) {
                    window.imageData = [];
                }
                window.imageData.push(newMedia);
                saveImagesToStorage();
            }
            
            // 更新UI
            if (mediaType === 'video') {
                renderPortfolioItems('all');
                renderVideoList();
            } else {
                renderImageList();
            }
            
            // 重置表单
            if (uploadForm) {
                uploadForm.reset();
                const mediaUrlGroup = document.getElementById('mediaUrlGroup');
                if (mediaUrlGroup) {
                    mediaUrlGroup.style.display = 'none';
                }
            }
            
            // 清理临时缩略图
            window.currentVideoThumbnail = null;
            
            // 恢复提交按钮
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '添加作品';
            }
            
            showNotification(`作品《${title}》已成功上传到腾讯云`);
            
            // 显示上传详情
            showUploadDetails(newMedia);
            
        } else if (uploadMethod === 'link' && mediaType === 'video') {
            // 添加视频链接模式
            const videoLink = linkInput.value;
            
            if (!videoLink) {
                showNotification('请输入视频链接', 'error');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '添加作品';
                }
                return;
            }
            
            // 显示提取缩略图进度
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 提取视频首帧...';
            }
            
            // 从视频链接提取首帧
            const thumbnailData = await captureFirstFrameFromUrl(videoLink);
            
            // 保存缩略图到本地
            if (submitBtn) {
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 保存缩略图...';
            }
            
            const timestamp = Date.now();
            const thumbnailFilename = `thumbnail_${timestamp}.jpg`;
            
            const saveResponse = await fetch('/api/save-thumbnail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    thumbnailData: thumbnailData,
                    filename: thumbnailFilename
                })
            });
            
            const saveResult = await saveResponse.json();
            
            if (!saveResult.success) {
                throw new Error('保存缩略图失败: ' + (saveResult.error || '未知错误'));
            }
            
            // 自动生成默认信息
            const categories = ['commercial', 'artistic', 'documentary'];
            const categoryNames = {
                'commercial': '商业',
                'artistic': '艺术',
                'documentary': '纪录片'
            };
            
            const category = categories[Math.floor(Math.random() * categories.length)];
            const description = `精彩作品《${title}》，展现了独特的创意和专业的制作水准，是一部值得细细品味的优秀作品。`;
            const tags = [];
            
            const year = new Date().getFullYear();
            
            // 创建新的媒体对象
            const newMedia = {
                id: timestamp,
                title,
                type: mediaType,
                category,
                categoryName: categoryNames[category],
                description,
                duration: duration || '',
                year,
                fileName: videoLink.split('/').pop() || 'video.mp4',
                size: 0,
                uploadTime: new Date().toISOString(),
                tags: tags,
                videoUrl: videoLink,
                thumbnail: saveResult.path, // 使用本地缩略图路径
                localThumbnail: true // 标记为本地缩略图
            };
            
            // 保存到视频数据存储
            portfolioData.push(newMedia);
            saveVideosToStorage();
            
            // 更新UI
            renderPortfolioItems('all');
            renderVideoList();
            
            // 重置表单
            if (uploadForm) {
                uploadForm.reset();
                const mediaUrlGroup = document.getElementById('mediaUrlGroup');
                if (mediaUrlGroup) {
                    mediaUrlGroup.style.display = 'none';
                }
            }
            
            // 恢复提交按钮
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '添加作品';
            }
            
            showNotification(`作品《${title}》已成功添加,缩略图已保存到本地`);
            
            // 显示上传详情
            showUploadDetails(newMedia);
        } else {
            showNotification('当前仅支持添加视频链接', 'error');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerHTML = '添加作品';
            }
        }
        
    } catch (error) {
        console.error('媒体上传失败:', error);
        
        // 恢复提交按钮
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '添加作品';
        }
        
        // 显示更详细的错误信息
        let errorMessage = '操作失败';
        if (error.message) {
            errorMessage += `: ${error.message}`;
        }
        
        // 如果是COS配置相关错误，提供解决方案
        if (error.message.includes('配置') || error.message.includes('SecretId') || error.message.includes('SecretKey')) {
            errorMessage += '\n\n建议解决方案：\n1. 检查腾讯云COS配置是否正确\n2. 确认SecretId和SecretKey是否有效\n3. 确认存储桶名称和地域是否正确';
        }
        
        // 如果是网络错误，提供更多诊断信息
        if (error.message.includes('网络错误') || error.message.includes('fetch')) {
            errorMessage += '\n\n网络错误诊断：\n1. 检查网络连接是否正常\n2. 确认视频链接是否可访问\n3. 确认视频链接是否支持跨域访问\n4. 检查是否有防火墙或代理阻止请求';
        }
        
        showNotification(errorMessage, 'error');
        
        // 提供测试COS配置的选项
        setTimeout(() => {
            if (confirm('是否要测试腾讯云COS配置以诊断问题？')) {
                testCOSConfiguration();
            }
        }, 1000);
    }
}

// 保存联系信息
async function handleContactInfoSave() {
    const emailInput = document.getElementById('contactEmail');
    const phoneInput = document.getElementById('contactPhone');
    const locationInput = document.getElementById('contactLocation');
    
    if (!emailInput || !phoneInput || !locationInput) {
        showNotification('表单元素未找到', 'error');
        return;
    }
    
    const email = emailInput.value;
    const phone = phoneInput.value;
    const location = locationInput.value;
    
    // 更新 contentData
    if (!contentData.contactData) {
        contentData.contactData = {};
    }
    
    contentData.contactData.email = email;
    contentData.contactData.phone = phone;
    contentData.contactData.location = location;
    
    // 更新页面显示
    updateContactInfo();
    
    // 保存到 localStorage
    localStorage.setItem('contentData', JSON.stringify(contentData));
    
    // 同步到服务器
    try {
        await syncContentToServer();
        showNotification('联系方式已保存', 'success');
    } catch (error) {
        console.error('保存联系方式失败:', error);
        showNotification('保存失败，请重试', 'error');
    }
}

// 填充联系信息表单
function fillContactForm() {
    if (!contentData.contactData) return;
    
    const emailInput = document.getElementById('contactEmail');
    const phoneInput = document.getElementById('contactPhone');
    const locationInput = document.getElementById('contactLocation');
    
    if (emailInput) {
        emailInput.value = contentData.contactData.email || '';
    }
    if (phoneInput) {
        phoneInput.value = contentData.contactData.phone || '';
    }
    if (locationInput) {
        locationInput.value = contentData.contactData.location || '';
    }
}

// 异步获取视频时长
function getVideoDurationAsync(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = function() {
            const duration = video.duration;
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            
            // 更新时长输入框
            const durationInput = document.getElementById('videoDuration');
            if (durationInput) {
                durationInput.value = formattedDuration;
            }
            
            resolve(formattedDuration);
            window.URL.revokeObjectURL(video.src);
        };
        
        video.onerror = function() {
            reject(new Error('无法读取视频时长'));
        };
        
        video.src = URL.createObjectURL(file);
    });
}

// 显示COS配置模态框
function showCOSConfigModal() {
    // 检查COSUploader是否已加载
    if (!window.COSUploader) {
        console.error('COSUploader未加载');
        showNotification('COS上传组件未加载，请刷新页面重试', 'error');
        return;
    }
    
    // 检查是否已存在配置模态框
    const existingModal = document.getElementById('cosConfigModal');
    if (existingModal) {
        existingModal.remove();
    }
    
    // 获取当前配置
    const currentConfig = window.COSUploader.COS_CONFIG;
    
    // 创建模态框HTML
    const modalHtml = `
        <div id="cosConfigModal" class="modal" style="display: block;">
            <div class="modal-content">
                <span class="close" onclick="closeCOSConfigModal()">&times;</span>
                <h2>腾讯云COS配置</h2>
                <form id="cosConfigForm">
                    <div class="form-group">
                        <label for="cosSecretId">SecretId</label>
                        <input type="text" id="cosSecretId" value="${currentConfig.SecretId || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="cosSecretKey">SecretKey</label>
                        <input type="password" id="cosSecretKey" value="${currentConfig.SecretKey || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="cosBucket">存储桶名称</label>
                        <input type="text" id="cosBucket" value="${currentConfig.Bucket || ''}" placeholder="例如：video-portfolio-1250000000" required>
                    </div>
                    <div class="form-group">
                        <label for="cosRegion">地域</label>
                        <select id="cosRegion" required>
                            <option value="">请选择地域</option>
                            <option value="ap-beijing" ${currentConfig.Region === 'ap-beijing' ? 'selected' : ''}>北京</option>
                            <option value="ap-shanghai" ${currentConfig.Region === 'ap-shanghai' ? 'selected' : ''}>上海</option>
                            <option value="ap-guangzhou" ${currentConfig.Region === 'ap-guangzhou' ? 'selected' : ''}>广州</option>
                            <option value="ap-chengdu" ${currentConfig.Region === 'ap-chengdu' ? 'selected' : ''}>成都</option>
                            <option value="ap-chongqing" ${currentConfig.Region === 'ap-chongqing' ? 'selected' : ''}>重庆</option>
                            <option value="ap-singapore" ${currentConfig.Region === 'ap-singapore' ? 'selected' : ''}>新加坡</option>
                            <option value="ap-hongkong" ${currentConfig.Region === 'ap-hongkong' ? 'selected' : ''}>香港</option>
                            <option value="na-toronto" ${currentConfig.Region === 'na-toronto' ? 'selected' : ''}>多伦多</option>
                            <option value="eu-frankfurt" ${currentConfig.Region === 'eu-frankfurt' ? 'selected' : ''}>法兰克福</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="cosDomain">自定义域名（可选）</label>
                        <input type="text" id="cosDomain" value="${currentConfig.Domain || ''}" placeholder="例如：https://cdn.example.com">
                    </div>
                    <button type="submit" class="btn btn-primary">保存配置</button>
                </form>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 绑定表单提交事件
    const configForm = document.getElementById('cosConfigForm');
    if (configForm) {
        configForm.addEventListener('submit', saveCOSConfig);
    }
}

// 保存COS配置
function saveCOSConfig(e) {
    e.preventDefault();
    
    const config = {
        SecretId: document.getElementById('cosSecretId').value,
        SecretKey: document.getElementById('cosSecretKey').value,
        Bucket: document.getElementById('cosBucket').value,
        Region: document.getElementById('cosRegion').value,
        Domain: document.getElementById('cosDomain').value,
        Folder: 'uploads/'
    };
    
    // 更新COS配置
    Object.assign(window.COSUploader.COS_CONFIG, config);
    
    // 保存到localStorage
    localStorage.setItem('cosConfig', JSON.stringify(config));
    
    // 更新状态指示器
    updateCOSStatus();
    
    // 关闭模态框
    closeCOSConfigModal();
    
    showNotification('COS配置已保存');
}

// 关闭COS配置模态框
function closeCOSConfigModal() {
    const modal = document.getElementById('cosConfigModal');
    if (modal) {
        modal.remove();
    }
}

// 显示上传详情
function showUploadDetails(media) {
    // 检查是否已存在上传详情区域
    let detailsContainer = document.getElementById('uploadDetailsContainer');
    if (!detailsContainer) {
        // 创建上传详情容器
        detailsContainer = document.createElement('div');
        detailsContainer.id = 'uploadDetailsContainer';
        detailsContainer.className = 'upload-details-container';
        
        // 插入到上传表单后面
        const uploadForm = document.getElementById('uploadForm');
        if (uploadForm && uploadForm.parentNode) {
            uploadForm.parentNode.insertBefore(detailsContainer, uploadForm.nextSibling);
        }
    }
    
    // 根据媒体类型生成不同的详情内容
    let detailsHtml = `
        <div class="upload-details-header">
            <h3><i class="fas fa-check-circle"></i> 上传成功</h3>
            <button class="close-details-btn" onclick="closeUploadDetails()">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="upload-details-content">
            <div class="media-info">
                <h4>${media.title}</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">类型:</span>
                        <span class="info-value">${media.type === 'video' ? '视频' : '图片'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">大小:</span>
                        <span class="info-value">${window.COSUploader.formatFileSize(media.size)}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">上传时间:</span>
                        <span class="info-value">${new Date(media.uploadTime).toLocaleString()}</span>
                    </div>
                    ${media.duration ? `
                    <div class="info-item">
                        <span class="info-label">时长:</span>
                        <span class="info-value">${media.duration}</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="url-section">
                <h5>资源链接</h5>
                ${media.type === 'video' ? `
                <div class="url-item">
                    <label>视频链接:</label>
                    <div class="url-container">
                        <input type="text" value="${media.videoUrl}" readonly class="url-input">
                        <button class="btn btn-small copy-btn" onclick="copyToClipboard('${media.videoUrl}')">
                            <i class="fas fa-copy"></i> 复制
                        </button>
                    </div>
                </div>
                <div class="url-item">
                    <label>缩略图链接:</label>
                    <div class="url-container">
                        <input type="text" value="${media.thumbnail}" readonly class="url-input">
                        <button class="btn btn-small copy-btn" onclick="copyToClipboard('${media.thumbnail}')">
                            <i class="fas fa-copy"></i> 复制
                        </button>
                    </div>
                </div>
                ` : `
                <div class="url-item">
                    <label>图片链接:</label>
                    <div class="url-container">
                        <input type="text" value="${media.imageUrl || media.thumbnail}" readonly class="url-input">
                        <button class="btn btn-small copy-btn" onclick="copyToClipboard('${media.imageUrl || media.thumbnail}')">
                            <i class="fas fa-copy"></i> 复制
                        </button>
                    </div>
                </div>
                `}
            </div>
            
            <div class="preview-section">
                <h5>预览</h5>
                <div class="preview-container">
                    ${media.type === 'video' ? `
                    <video controls style="max-width: 100%; max-height: 200px;">
                        <source src="${media.videoUrl}" type="video/mp4">
                    </video>
                    ` : `
                    <img src="${media.imageUrl || media.thumbnail}" alt="${media.title}" style="max-width: 100%; max-height: 200px;">
                    `}
                </div>
            </div>
        </div>
    `;
    
    detailsContainer.innerHTML = detailsHtml;
    detailsContainer.style.display = 'block';
    
    // 添加显示动画
    detailsContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// 关闭上传详情
function closeUploadDetails() {
    const detailsContainer = document.getElementById('uploadDetailsContainer');
    if (detailsContainer) {
        detailsContainer.style.display = 'none';
    }
}

// 复制到剪贴板
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showNotification('链接已复制到剪贴板');
    }).catch(err => {
        console.error('复制失败:', err);
        showNotification('复制失败', 'error');
    });
}

// 加载COS配置
function loadCOSConfig() {
    const savedConfig = localStorage.getItem('cosConfig');
    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            Object.assign(window.COSUploader.COS_CONFIG, config);
        } catch (e) {
            console.error('加载COS配置失败:', e);
        }
    }
}











// 更新COS状态指示器
function updateCOSStatus() {
    const cosStatus = document.getElementById('cosStatus');
    const cosStatusText = document.getElementById('cosStatusText');
    
    if (!cosStatus || !cosStatusText) {
        console.error('找不到COS状态指示器元素');
        return;
    }
    
    // 检查COSUploader是否已加载
    if (!window.COSUploader) {
        cosStatus.style.display = 'flex';
        cosStatus.className = 'cos-status unconfigured';
        cosStatusText.innerHTML = 'COS上传组件未加载 <button class="btn btn-small" onclick="testCOSConfiguration()">测试</button>';
        return;
    }
    
    // 检查COS配置是否完整
    const config = window.COSUploader.COS_CONFIG;
    const isConfigured = config.SecretId && config.SecretKey && config.Bucket && config.Region;
    
    if (isConfigured) {
        // 配置完成
        cosStatus.style.display = 'flex';
        cosStatus.className = 'cos-status configured';
        cosStatusText.innerHTML = '腾讯云COS已配置 <button class="btn btn-small" onclick="testCOSConfiguration()">测试</button>';
    } else {
        // 未配置
        cosStatus.style.display = 'flex';
        cosStatus.className = 'cos-status unconfigured';
        cosStatusText.innerHTML = '腾讯云COS未配置 <button class="btn btn-small" onclick="showCOSConfigModal()">配置</button>';
        
        // 如果是首次登录且未配置，自动弹出配置窗口
        const hasShownConfig = localStorage.getItem('cosConfigShown');
        if (!hasShownConfig) {
            setTimeout(() => {
                showCOSConfigModal();
                localStorage.setItem('cosConfigShown', 'true');
            }, 1000);
        }
    }
}

// 测试COS配置
async function testCOSConfiguration() {
    console.log('开始测试COS配置...');
    
    // 显示测试中状态
    const cosStatusText = document.getElementById('cosStatusText');
    if (cosStatusText) {
        cosStatusText.innerHTML = '正在测试COS配置... <button class="btn btn-small" disabled>测试中</button>';
    }
    
    try {
        // 调用COSUploader的测试函数
        const testResult = await window.COSUploader.testCOSConfig();
        
        if (testResult.success) {
            showNotification('COS配置测试成功！签名生成正常', 'success');
            console.log('COS配置测试成功:', testResult);
        } else {
            showNotification(`COS配置测试失败: ${testResult.message}`, 'error');
            console.error('COS配置测试失败:', testResult);
            
            // 显示详细的配置状态
            if (testResult.config) {
                const configDetails = Object.entries(testResult.config)
                    .map(([key, value]) => `${key}: ${value}`)
                    .join('\n');
                showNotification(`配置详情:\n${configDetails}`, 'info');
            }
        }
    } catch (error) {
        console.error('测试COS配置时出错:', error);
        showNotification(`测试出错: ${error.message}`, 'error');
    } finally {
        // 恢复状态显示
        updateCOSStatus();
    }
}

// 视频管理功能
function renderVideoList() {
    const videoList = document.getElementById('videoList');
    if (!videoList) {
        console.error('视频列表容器未找到');
        return;
    }
    
    videoList.innerHTML = '';
    
    if (portfolioData.length === 0) {
        videoList.innerHTML = '<p>暂无视频作品</p>';
        return;
    }
    
    portfolioData.forEach(video => {
        const videoItem = document.createElement('div');
        videoItem.className = 'media-item';
        videoItem.innerHTML = `
            <div class="media-preview">
                <img src="${video.thumbnail}" alt="${video.title}">
            </div>
            <div class="media-info">
                <h4>${video.title}</h4>
            </div>
            <div class="media-links">
                <div class="link-item">
                    <label>视频链接:</label>
                    <div class="link-container">
                        <input type="text" value="${video.videoUrl || ''}" readonly class="link-input">
                        <button class="btn btn-small copy-btn" onclick="copyToClipboard('${video.videoUrl || ''}')">复制</button>
                    </div>
                </div>
                <div class="link-item">
                    <label>缩略图链接:</label>
                    <div class="link-container">
                        <input type="text" value="${video.thumbnail || ''}" readonly class="link-input">
                        <button class="btn btn-small copy-btn" onclick="copyToClipboard('${video.thumbnail || ''}')">复制</button>
                    </div>
                </div>
            </div>
            <div class="media-item-actions">
                <button class="btn btn-small btn-edit" onclick="editVideo(${video.id})">编辑</button>
                <button class="btn btn-small btn-delete" onclick="deleteVideo(${video.id})">删除</button>
            </div>
        `;
        videoList.appendChild(videoItem);
    });
}

function deleteVideo(id) {
    if (confirm('确定要删除这个视频吗？')) {
        const index = portfolioData.findIndex(video => video.id === id);
        if (index !== -1) {
            portfolioData.splice(index, 1);
            saveVideosToStorage();
            renderPortfolioItems('all');
            renderVideoList();
            showNotification('视频已删除');
        }
    }
}

// 获取视频时长和缩略图
function getVideoDuration(file) {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = function() {
        const duration = video.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        const durationInput = document.getElementById('videoDuration');
        if (durationInput) {
            durationInput.value = formattedDuration;
        }
        showNotification(`已自动识别视频时长: ${formattedDuration}`);
        
        // 获取视频缩略图
        captureVideoThumbnail(video, file.name);
    };
    
    video.onerror = function() {
        showNotification('无法读取视频时长，请手动输入', 'error');
    };
    
    video.src = URL.createObjectURL(file);
}

// 捕获视频缩略图
function captureVideoThumbnail(video, fileName) {
    // 设置视频到第一帧
    video.currentTime = 0;
    
    video.onseeked = function() {
        try {
            // 创建canvas来捕获视频帧
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 设置canvas尺寸（保持视频比例）
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            
            // 绘制视频当前帧到canvas
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
            
            // 将canvas转换为图片URL
            const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
            
            // 保存缩略图到全局变量
            window.currentVideoThumbnail = thumbnailUrl;
            
            showNotification('已自动生成视频缩略图');
            
            // 清理
            window.URL.revokeObjectURL(video.src);
        } catch (error) {
            console.error('生成缩略图失败:', error);
            showNotification('无法生成缩略图，将使用默认图片', 'error');
        }
    };
    
    video.onerror = function() {
        showNotification('无法生成缩略图，将使用默认图片', 'error');
    };
}

// 捕获视频第一帧作为缩略图
async function captureFirstFrame(file) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.muted = true;
        
        video.onloadedmetadata = function() {
            // 设置视频到第一帧
            video.currentTime = 0;
        };
        
        video.onseeked = function() {
            try {
                // 创建canvas来捕获视频帧
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 设置canvas尺寸（保持视频比例）
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                // 绘制视频当前帧到canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // 将canvas转换为图片URL
                const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
                
                // 清理
                window.URL.revokeObjectURL(video.src);
                
                resolve(thumbnailUrl);
            } catch (error) {
                console.error('生成缩略图失败:', error);
                reject(error);
            }
        };
        
        video.onerror = function() {
            reject(new Error('无法加载视频'));
        };
        
        video.src = URL.createObjectURL(file);
    });
}

// 从视频URL提取首帧
async function captureFirstFrameFromUrl(url) {
    return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.crossOrigin = 'anonymous'; // 允许跨域访问
        video.preload = 'metadata';
        video.muted = true;
        
        video.onloadedmetadata = function() {
            // 设置视频到第一帧
            video.currentTime = 0;
        };
        
        video.onseeked = function() {
            try {
                // 创建canvas来捕获视频帧
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // 设置canvas尺寸（保持视频比例）
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
                
                // 绘制视频当前帧到canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // 将canvas转换为图片URL
                const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8);
                
                // 清理
                video.src = '';
                
                resolve(thumbnailUrl);
            } catch (error) {
                console.error('生成缩略图失败:', error);
                reject(error);
            }
        };
        
        video.onerror = function() {
            reject(new Error('无法加载视频，请检查视频链接是否正确且支持跨域访问'));
        };
        
        video.src = url;
    });
}

function editVideo(id) {
    const video = portfolioData.find(v => v.id === id);
    if (video) {
        // 填充表单
        const titleInput = document.getElementById('videoTitle');
        const durationInput = document.getElementById('videoDuration');
        
        if (titleInput) titleInput.value = video.title;
        if (durationInput) durationInput.value = video.duration;
        
        // 显示文件信息（如果有文件名）
        if (video.fileName) {
            const videoUrlGroup = document.getElementById('videoUrlGroup');
            const videoUrlInput = document.getElementById('videoUrl');
            if (videoUrlGroup) videoUrlGroup.style.display = 'block';
            if (videoUrlInput) videoUrlInput.value = `原文件: ${video.fileName}`;
        }
        
        // 删除原视频
        const index = portfolioData.findIndex(v => v.id === id);
        if (index !== -1) {
            portfolioData.splice(index, 1);
        }
        
        // 滚动到上传表单
        const adminSection = document.querySelector('.admin-section');
        if (adminSection) {
            adminSection.scrollIntoView({ behavior: 'smooth' });
        }
        showNotification('请修改信息后重新提交');
    }
}

// 数据持久化
async function saveVideosToStorage() {
    // 保存到本地存储
    localStorage.setItem('portfolioData', JSON.stringify(portfolioData));
    console.log('视频内容已保存到本地存储');
    
    // 触发本地数据同步
    if (window.LocalDataSync) {
        setTimeout(() => {
            window.LocalDataSync.manualSync();
        }, 500);
    }
}

async function loadVideosFromStorage() {
    // 从本地存储加载
    const savedData = localStorage.getItem('portfolioData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (parsedData.length > 0) {
                portfolioData.length = 0; // 清空现有数据
                portfolioData.push(...parsedData);
                renderPortfolioItems('all');
            }
        } catch (e) {
            console.error('加载数据失败:', e);
        }
    }
}

// 图片数据持久化
async function saveImagesToStorage() {
    if (window.imageData) {
        // 保存到本地存储
        localStorage.setItem('imageData', JSON.stringify(window.imageData));
        console.log('图片内容已保存到本地存储');
        
        // 触发本地数据同步
        if (window.LocalDataSync) {
            setTimeout(() => {
                window.LocalDataSync.manualSync();
            }, 500);
        }
    }
}

async function loadImagesFromStorage() {
    // 从本地存储加载
    const savedData = localStorage.getItem('imageData');
    if (savedData) {
        try {
            const parsedData = JSON.parse(savedData);
            if (parsedData.length > 0) {
                window.imageData = parsedData;
                renderImageList();
            }
        } catch (e) {
            console.error('加载图片数据失败:', e);
        }
    }
}

// 渲染图片列表
function renderImageList() {
    const imageList = document.getElementById('imageList');
    if (!imageList) return;
    
    imageList.innerHTML = '';
    
    if (!window.imageData || window.imageData.length === 0) {
        imageList.innerHTML = '<p>暂无图片作品</p>';
        return;
    }
    
    window.imageData.forEach(image => {
        const imageItem = document.createElement('div');
        imageItem.className = 'media-item';
        imageItem.innerHTML = `
            <div class="media-preview">
                <img src="${image.thumbnail}" alt="${image.title}" style="max-width: 100px; max-height: 100px;">
            </div>
            <div class="media-info">
                <h4>${image.title}</h4>
                <p>类型: 图片</p>
                <p>分类: ${image.categoryName}</p>
                <p>大小: ${window.COSUploader.formatFileSize(image.size)}</p>
            </div>
            <div class="media-links">
                <div class="link-item">
                    <label>图片链接:</label>
                    <div class="link-container">
                        <input type="text" value="${image.imageUrl || image.thumbnail || ''}" readonly class="link-input">
                        <button class="btn btn-small copy-btn" onclick="copyToClipboard('${image.imageUrl || image.thumbnail || ''}')">复制</button>
                    </div>
                </div>
            </div>
            <div class="media-item-actions">
                <button class="btn btn-small btn-edit" onclick="editImage(${image.id})">编辑</button>
                <button class="btn btn-small btn-delete" onclick="deleteImage(${image.id})">删除</button>
            </div>
        `;
        imageList.appendChild(imageItem);
    });
}

// 删除图片
function deleteImage(id) {
    if (confirm('确定要删除这个图片吗？')) {
        if (!window.imageData) return;
        
        const index = window.imageData.findIndex(image => image.id === id);
        if (index !== -1) {
            window.imageData.splice(index, 1);
            saveImagesToStorage();
            renderImageList();
            showNotification('图片已删除');
        }
    }
}

// 编辑图片
function editImage(id) {
    if (!window.imageData) return;
    
    const image = window.imageData.find(img => img.id === id);
    if (image) {
        // 填充表单
        const titleInput = document.getElementById('mediaTitle');
        const typeInput = document.getElementById('mediaType');
        
        if (titleInput) titleInput.value = image.title;
        if (typeInput) typeInput.value = 'image';
        
        // 触发类型变化事件
        if (typeInput) {
            typeInput.dispatchEvent(new Event('change'));
        }
        
        // 删除原图片
        const index = window.imageData.findIndex(img => img.id === id);
        if (index !== -1) {
            window.imageData.splice(index, 1);
        }
        
        // 滚动到上传表单
        const adminSection = document.querySelector('.admin-section');
        if (adminSection) {
            adminSection.scrollIntoView({ behavior: 'smooth' });
        }
        showNotification('请修改信息后重新提交');
    }
}

// 复制百度网盘提取码功能
function copyBaiduCode(code) {
    const textArea = document.createElement('textarea');
    textArea.value = code;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    // 显示复制成功提示
    showNotification('提取码已复制到剪贴板');
}

// 显示通知功能
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = 'notification';
    
    // 处理多行消息
    if (typeof message === 'string' && message.includes('\n')) {
        // 将换行符转换为<br>标签
        notification.innerHTML = message.replace(/\n/g, '<br>');
    } else {
        notification.textContent = message;
    }
    
    // 根据类型设置颜色
    let bgColor = '#e50914'; // 默认红色
    if (type === 'error') {
        bgColor = '#dc3545'; // 错误红色
    } else if (type === 'info') {
        bgColor = '#17a2b8'; // 信息蓝色
    }
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${bgColor};
        color: white;
        padding: 15px 25px;
        border-radius: 5px;
        z-index: 3000;
        animation: slideInRight 0.3s ease;
        max-width: 500px;
        white-space: pre-line;
        line-height: 1.5;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 5000); // 增加显示时间到5秒，以便用户阅读多行信息
}

// 幻灯片初始化
function initSlideshow() {
    showSlide(currentSlideIndex);
    startSlideShow();
    
    // 鼠标悬停时暂停自动播放
    const slideshowContainer = document.querySelector('.slideshow-container');
    slideshowContainer.addEventListener('mouseenter', stopSlideShow);
    slideshowContainer.addEventListener('mouseleave', startSlideShow);
}

// 显示指定索引的幻灯片
function showSlide(index) {
    const slides = document.querySelectorAll('.slide');
    const indicators = document.querySelectorAll('.indicator');
    
    // 检查是否有幻灯片
    if (slides.length === 0) {
        console.warn('没有找到幻灯片');
        return;
    }
    
    // 处理循环索引
    if (index >= slides.length) {
        currentSlideIndex = 0;
    } else if (index < 0) {
        currentSlideIndex = slides.length - 1;
    } else {
        currentSlideIndex = index;
    }
    
    // 隐藏所有幻灯片和指示器
    slides.forEach(slide => slide.classList.remove('active'));
    indicators.forEach(indicator => indicator.classList.remove('active'));
    
    // 显示当前幻灯片和指示器
    if (slides[currentSlideIndex]) {
        slides[currentSlideIndex].classList.add('active');
    }
    if (indicators[currentSlideIndex]) {
        indicators[currentSlideIndex].classList.add('active');
    }
}

// 切换到下一张或上一张幻灯片
function changeSlide(direction) {
    showSlide(currentSlideIndex + direction);
    resetSlideShow();
}

// 直接跳转到指定幻灯片
function currentSlide(index) {
    showSlide(index - 1);
    resetSlideShow();
}

// 开始自动播放
function startSlideShow() {
    slideInterval = setInterval(() => {
        changeSlide(1);
    }, 5000); // 每5秒切换一次
}

// 停止自动播放
function stopSlideShow() {
    clearInterval(slideInterval);
}

// 重置自动播放（用户交互后重新开始计时）
function resetSlideShow() {
    stopSlideShow();
    startSlideShow();
}

// 自定义幻灯片图片内容
function updateSlideImages(newSlideData) {
    console.log('updateSlideImages 被调用');
    console.log('传入的 newSlideData:', newSlideData);
    
    // 先创建副本，避免清空数组时丢失数据
    const slideDataCopy = [...newSlideData];
    
    slideData.length = 0; // 清空现有数据
    slideData.push(...slideDataCopy); // 添加新数据
    
    console.log('更新后的 slideData:', slideData);
    
    // 更新DOM中的幻灯片
    const slides = document.querySelectorAll('.slide');
    const indicators = document.querySelectorAll('.indicator');
    
    console.log('找到的幻灯片数量:', slides.length);
    console.log('找到的指示器数量:', indicators.length);
    
    // 清空现有幻灯片
    slides.forEach(slide => slide.remove());
    indicators.forEach(indicator => indicator.remove());
    
    // 创建新的幻灯片
    const slideshowContainer = document.querySelector('.slideshow-container');
    const indicatorsContainer = document.querySelector('.slide-indicators');
    
    console.log('幻灯片容器:', slideshowContainer);
    console.log('指示器容器:', indicatorsContainer);
    
    if (!slideshowContainer) {
        console.error('找不到幻灯片容器');
        return;
    }
    
    if (!indicatorsContainer) {
        console.error('找不到指示器容器');
        return;
    }
    
    slideData.forEach((slide, index) => {
        console.log(`创建幻灯片 ${index + 1}:`, slide);
        
        // 创建幻灯片元素
        const slideElement = document.createElement('div');
        slideElement.className = `slide ${index === 0 ? 'active' : ''}`;
        slideElement.innerHTML = `
            <div class="slide-content">
                <img src="${slide.image}" alt="${slide.title}" class="slide-image">
                <div class="slide-overlay">
                    <div class="hero-content">
                        <h1 class="hero-title">${slide.title}</h1>
                        <p class="hero-subtitle">${slide.subtitle}</p>
                        <a href="#portfolio" class="btn btn-primary">查看作品</a>
                    </div>
                </div>
            </div>
        `;
        slideshowContainer.appendChild(slideElement);
        
        // 创建指示器元素
        const indicator = document.createElement('span');
        indicator.className = `indicator ${index === 0 ? 'active' : ''}`;
        indicator.setAttribute('onclick', `currentSlide(${index + 1})`);
        indicatorsContainer.appendChild(indicator);
    });
    
    console.log('轮播图更新完成');
    console.log('当前幻灯片数量:', document.querySelectorAll('.slide').length);
    console.log('当前指示器数量:', document.querySelectorAll('.indicator').length);
    
    // 重置幻灯片索引并重新初始化
    currentSlideIndex = 0;
    resetSlideShow();
}

// 添加键盘控制幻灯片
document.addEventListener('keydown', (e) => {
    // 左箭头键 - 上一张
    if (e.key === 'ArrowLeft') {
        changeSlide(-1);
    }
    // 右箭头键 - 下一张
    else if (e.key === 'ArrowRight') {
        changeSlide(1);
    }
});

// 添加触摸滑动支持
let touchStartX = 0;
let touchEndX = 0;

const slideshowContainer = document.querySelector('.slideshow-container');

slideshowContainer.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
});

slideshowContainer.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
});

function handleSwipe() {
    // 向右滑动 - 上一张
    if (touchEndX < touchStartX - 50) {
        changeSlide(1);
    }
    // 向左滑动 - 下一张
    if (touchEndX > touchStartX + 50) {
        changeSlide(-1);
    }
}

// 内容数据管理
async function loadContentData() {
  // 静态版本直接使用 WEBSITE_DATA
  if (typeof WEBSITE_DATA !== 'undefined') {
    console.log('使用静态数据');
    console.log('AIGC作品数量:', contentData.aigc?.items?.length || 0);
    console.log('视频作品数量:', contentData.videos?.items?.length || 0);
    console.log('作品集数量:', portfolioData.length);
    console.log('轮播图数量:', slideData.length);
    renderAllContent();
    // 更新轮播图
    if (slideData && slideData.length > 0) {
      updateSlideImages(slideData);
      console.log('已更新静态轮播图');
    }
    return;
  }
  
  // 动态版本：从服务器加载数据
  try {
    const response = await fetch('/api/get-website-content');
    if (response.ok) {
      const data = await response.json();
      contentData = data.data.contentData || {};
      slideData = data.data.slideData || [];
      if (data.data.portfolioData) {
        portfolioData = Array.isArray(data.data.portfolioData) 
          ? data.data.portfolioData 
          : JSON.parse(data.data.portfolioData);
      }
      renderAllContent();
    }
  } catch (error) {
    console.error('加载内容数据失败:', error);
  }
}

function saveContentData() {
    localStorage.setItem('contentData', JSON.stringify(contentData));
    
    // 自动同步到服务器
    syncContentToServer();
}

// 同步内容到服务器
async function syncContentToServer() {
    try {
        // 获取关于我内容
        const aboutContent = localStorage.getItem('aboutContent') || getAboutContent();
        
        // 获取 portfolioData（上传的视频数据）
        const portfolioDataStr = localStorage.getItem('portfolioData');
        const portfolioDataArr = portfolioDataStr ? JSON.parse(portfolioDataStr) : [];
        
        // 准备要同步的数据（与 website-content.json 的格式匹配）
        const syncData = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            data: {
                contentData: {
                    aigc: contentData.aigc,
                    videos: contentData.videos,
                    effects: contentData.effects,
                    accounts: contentData.accounts,
                    contactData: contentData.contactData
                },
                slideData: slideData,
                aboutContent: aboutContent,
                portfolioData: portfolioDataArr
            },
            meta: {
                lastUpdated: new Date().toISOString(),
                version: '1.0.0'
            }
        };

        console.log('准备同步数据到服务器:', syncData);

        // 发送同步请求
        const response = await fetch('/api/sync-website-content', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(syncData)
        });

        if (response.ok) {
            const result = await response.json();
            console.log('内容已同步到服务器:', result);
            showNotification('内容已自动同步到服务器', 'success');
        } else {
            const errorText = await response.text();
            console.error('同步失败:', response.status, errorText);
            showNotification(`同步失败 (${response.status}): ${errorText}`, 'error');
        }
    } catch (error) {
        console.error('同步内容到服务器时出错:', error);
        showNotification(`同步出错: ${error.message}`, 'error');
    }
}

// 保存轮播图数据
function saveSlideData() {
    localStorage.setItem('slideData', JSON.stringify(slideData));
    
    // 自动同步到服务器
    syncContentToServer();
}

// 渲染所有内容
// 编辑内容项
function editContentItem(category, itemId) {
    if (!isAdminLoggedIn) {
        showNotification('请先登录管理员账号', 'error');
        return;
    }
    
    const item = contentData[category].items.find(i => i.id === itemId);
    if (!item) return;
    
    // 打开管理员面板并切换到对应的标签
    const adminPanel = document.getElementById('adminPanel');
    if (adminPanel) {
        adminPanel.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // 添加内容管理界面（如果还没有添加）
        if (!document.querySelector('.content-management-tabs')) {
            addContentManagementToAdmin();
        }
        
        // 切换到对应的标签
        setTimeout(() => {
            const tabBtn = document.querySelector(`[data-tab="${category}"]`);
            if (tabBtn) {
                tabBtn.click();
            }
        }, 100);
    }
    
    showNotification(`正在编辑: ${item.title}`, 'info');
}

// 添加内容管理界面到管理员面板
function addContentManagementToAdmin() {
    const adminContent = document.querySelector('.admin-content');
    if (!adminContent) {
        console.error('管理员内容区域未找到');
        return;
    }
    
    // 添加内容管理区域
    const contentManagementSection = document.createElement('div');
    contentManagementSection.className = 'admin-section';
    contentManagementSection.innerHTML = `
        <h3>内容管理</h3>
        <div class="content-management-tabs">
            <button class="tab-btn active" data-tab="slideshow">轮播图</button>
            <button class="tab-btn" data-tab="aigc">AIGC作品</button>
            <button class="tab-btn" data-tab="videos">视频作品</button>
            <button class="tab-btn" data-tab="effects">特效作品</button>
            <button class="tab-btn" data-tab="accounts">过往账号</button>
            <button class="tab-btn" data-tab="about">关于我</button>
        </div>
        
        <div class="tab-content active" id="slideshow-tab">
            <h4>轮播图管理</h4>
            <form id="slideshow-form" class="content-form">
                <div class="form-group">
                    <label>轮播图列表</label>
                    <div id="slideshow-items-list"></div>
                    <button type="button" class="btn btn-secondary" onclick="addNewSlide()">添加新轮播图</button>
                </div>
                <button type="submit" class="btn btn-primary">保存轮播图</button>
            </form>
        </div>
        
        <div class="tab-content" id="aigc-tab">
            <h4>一、二、三横向分级AIGC作品管理</h4>
            <form id="aigc-form" class="content-form">
                <div class="form-group">
                    <label for="aigc-title">区域标题</label>
                    <input type="text" id="aigc-title" value="${contentData.aigc.title}">
                </div>
                <div class="form-group">
                    <label for="aigc-subtitle">区域副标题</label>
                    <input type="text" id="aigc-subtitle" value="${contentData.aigc.subtitle}">
                </div>
                <div class="form-group">
                    <label>AIGC作品列表</label>
                    <div id="aigc-items-list"></div>
                    <button type="button" class="btn btn-secondary" onclick="addNewItem('aigc')">添加新作品</button>
                </div>
                <button type="submit" class="btn btn-primary">保存AIGC内容</button>
            </form>
        </div>
        
        <div class="tab-content" id="videos-tab">
            <h4>视频作品管理</h4>
            <form id="videos-form" class="content-form">
                <div class="form-group">
                    <label for="videos-title">区域标题</label>
                    <input type="text" id="videos-title" value="${contentData.videos.title}">
                </div>
                <div class="form-group">
                    <label for="videos-subtitle">区域副标题</label>
                    <input type="text" id="videos-subtitle" value="${contentData.videos.subtitle}">
                </div>
                <div class="form-group">
                    <label for="featured-title">精选视频标题</label>
                    <input type="text" id="featured-title" value="${contentData.videos.featured.title}">
                </div>
                <div class="form-group">
                    <label for="featured-desc">精选视频描述</label>
                    <textarea id="featured-desc">${contentData.videos.featured.description}</textarea>
                </div>
                <div class="form-group">
                    <label for="featured-thumbnail">精选视频封面</label>
                    <input type="text" id="featured-thumbnail" value="${contentData.videos.featured.thumbnail}">
                </div>
                <div class="form-group">
                    <label>视频作品列表</label>
                    <div id="videos-items-list"></div>
                    <button type="button" class="btn btn-secondary" onclick="addNewItem('videos')">添加新视频</button>
                </div>
                <button type="submit" class="btn btn-primary">保存视频内容</button>
            </form>
        </div>
        
        <div class="tab-content" id="effects-tab">
            <h4>特效作品管理</h4>
            <form id="effects-form" class="content-form">
                <div class="form-group">
                    <label for="effects-title">区域标题</label>
                    <input type="text" id="effects-title" value="${contentData.effects.title}">
                </div>
                <div class="form-group">
                    <label for="effects-subtitle">区域副标题</label>
                    <input type="text" id="effects-subtitle" value="${contentData.effects.subtitle}">
                </div>
                <div class="form-group">
                    <label>特效作品列表</label>
                    <div id="effects-items-list"></div>
                    <button type="button" class="btn btn-secondary" onclick="addNewItem('effects')">添加新特效</button>
                </div>
                <button type="submit" class="btn btn-primary">保存特效内容</button>
            </form>
        </div>
        
        <div class="tab-content" id="accounts-tab">
            <h4>过往账号管理</h4>
            <form id="accounts-form" class="content-form">
                <div class="form-group">
                    <label for="accounts-title">区域标题</label>
                    <input type="text" id="accounts-title" value="${contentData.accounts.title}">
                </div>
                <div class="form-group">
                    <label for="accounts-subtitle">区域副标题</label>
                    <input type="text" id="accounts-subtitle" value="${contentData.accounts.subtitle}">
                </div>
                <div class="form-group">
                    <label>账号列表</label>
                    <div id="accounts-items-list"></div>
                    <button type="button" class="btn btn-secondary" onclick="addNewItem('accounts')">添加新账号</button>
                </div>
                <button type="submit" class="btn btn-primary">保存账号内容</button>
            </form>
        </div>
        
        <div class="tab-content" id="about-tab">
            <h4>关于我页面管理</h4>
            <form id="about-form" class="content-form">
                <div class="form-group">
                    <label for="about-content">关于我内容</label>
                    <textarea id="about-content" rows="10" placeholder="请输入关于我的内容，支持HTML格式">${getAboutContent()}</textarea>
                </div>
                <div class="form-group">
                    <label>预览</label>
                    <div class="about-preview" id="about-preview">
                        ${getAboutContent()}
                    </div>
                </div>
                <button type="submit" class="btn btn-primary">保存关于我内容</button>
            </form>
        </div>
    `;
    
    adminContent.appendChild(contentManagementSection);
    
    // 设置标签切换功能
    setupContentManagementTabs();
    
    // 渲染各个标签的内容列表
    renderAIGCItemsList();
    renderVideoItemsList();
    renderEffectsItemsList();
    renderAccountsItemsList();
    
    // 设置表单提交事件
    setupContentForms();
}

// 设置内容管理标签切换
function setupContentManagementTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.getAttribute('data-tab');
            
            // 切换按钮状态
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            
            // 切换内容显示
            tabContents.forEach(content => content.classList.remove('active'));
            const targetTab = document.getElementById(`${tabName}-tab`);
            if (targetTab) {
                targetTab.classList.add('active');
            }
            
            // 如果切换到轮播图标签，初始化拖拽排序
            if (tabName === 'slideshow') {
                initSlideshowDragSort();
            }
            
            // 如果切换到关于我标签，初始化实时预览
            if (tabName === 'about') {
                initAboutPreview();
            }
        });
    });
    
    // 渲染轮播图列表
    renderSlideshowItemsList();
}

// 渲染轮播图项目列表
function renderSlideshowItemsList() {
    const container = document.getElementById('slideshow-items-list');
    if (!container) return;
    
    // 添加轮播图统计信息
    const statsElement = document.createElement('div');
    statsElement.className = 'slideshow-stats';
    statsElement.innerHTML = `
        <div class="stats-info">
            <span>当前轮播图总数: <strong>${slideData.length}</strong></span>
            <button type="button" class="btn btn-small btn-secondary" onclick="window.scrollTo({top: 0, behavior: 'smooth'})">
                <i class="fas fa-eye"></i> 预览轮播图
            </button>
        </div>
    `;
    container.innerHTML = '';
    container.appendChild(statsElement);
    
    // 如果没有轮播图，显示提示
    if (slideData.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-icon">
                <i class="fas fa-images"></i>
            </div>
            <h3>还没有轮播图</h3>
            <p>点击下面的按钮添加您的第一个轮播图</p>
        `;
        container.appendChild(emptyState);
        return;
    }
    
    slideData.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'editable-item';
        itemElement.innerHTML = `
            <div class="item-header">
                <h5>轮播图 ${index + 1}</h5>
                <button type="button" class="btn btn-small btn-delete" onclick="removeSlide(${index})">删除</button>
            </div>
            <div class="form-group">
                <label>标题</label>
                <input type="text" data-field="title" data-index="${index}" value="${item.title}">
            </div>
            <div class="form-group">
                <label>副标题</label>
                <textarea data-field="subtitle" data-index="${index}">${item.subtitle}</textarea>
            </div>
            <div class="form-group">
                <label>图片URL</label>
                <input type="text" data-field="image" data-index="${index}" value="${item.image}" onkeyup="previewSlideImage(${index}, this.value)">
                <div class="image-preview" id="preview-${index}">
                    <img src="${item.image}" alt="预览图片" onerror="this.src='https://picsum.photos/seed/error/400/200.jpg'">
                    <small>图片预览</small>
                </div>
            </div>
        `;
        container.appendChild(itemElement);
    });
    
    // 初始化拖拽排序
    setTimeout(() => {
        initSlideshowDragSort();
    }, 100);
}

// 添加新轮播图
function addNewSlide() {
    const newSlide = {
        image: "https://picsum.photos/seed/newslide" + Date.now() + "/1920/1080.jpg",
        title: "新轮播图标题 " + (slideData.length + 1),
        subtitle: "新轮播图副标题"
    };
    
    slideData.push(newSlide);
    saveSlideData();
    renderSlideshowItemsList();
    // 创建副本避免引用问题
    updateSlideImages([...slideData]);
    
    // 滚动到新添加的轮播图
    setTimeout(() => {
        const slideshowItems = document.querySelectorAll('#slideshow-items-list .editable-item');
        if (slideshowItems.length > 0) {
            slideshowItems[slideshowItems.length - 1].scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
        }
    }, 100);
    
    showNotification('已添加新轮播图', 'success');
}

// 删除轮播图
function removeSlide(index) {
    if (confirm('确定要删除这个轮播图吗？此操作不可撤销。')) {
        slideData.splice(index, 1);
        saveSlideData();
        renderSlideshowItemsList();
        // 创建副本避免引用问题
        updateSlideImages([...slideData]);
        showNotification('轮播图已删除', 'success');
        
        // 如果删除后没有轮播图了，提示用户添加
        if (slideData.length === 0) {
            setTimeout(() => {
                showNotification('当前没有轮播图，请添加新的轮播图', 'info');
            }, 1000);
        }
    }
}

// 渲染AIGC项目列表
function renderAIGCItemsList() {
    const container = document.getElementById('aigc-items-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    contentData.aigc.items.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'editable-item';
        itemElement.setAttribute('data-type', item.type);
        itemElement.innerHTML = `
            <div class="item-header">
                <h5>作品 ${index + 1}</h5>
                <button type="button" class="btn btn-small btn-delete" onclick="removeItem('aigc', ${item.id})">删除</button>
            </div>
            <div class="form-group">
                <label>标题</label>
                <input type="text" data-field="title" data-id="${item.id}" value="${item.title}">
            </div>
            <div class="form-group">
                <label>描述</label>
                <textarea data-field="description" data-id="${item.id}">${item.description}</textarea>
            </div>
            <div class="form-group">
                <label>分类</label>
                <select data-field="type" data-id="${item.id}">
                    <option value="photography" ${item.type === 'photography' ? 'selected' : ''}>一、AI摄影作品</option>
                    <option value="video" ${item.type === 'video' ? 'selected' : ''}>二、AI影片</option>
                    <option value="animation" ${item.type === 'animation' ? 'selected' : ''}>三、AI动画设计</option>
                </select>
            </div>
            <div class="form-group">
                <label>图片URL</label>
                <input type="text" data-field="image" data-id="${item.id}" value="${item.image}">
            </div>
            <div class="form-group video-url-group" data-type="${item.type}">
                <label>视频URL</label>
                <input type="text" data-field="videoUrl" data-id="${item.id}" value="${item.videoUrl || ''}" placeholder="仅视频作品需要填写">
            </div>
            <div class="form-group video-upload-group" data-type="${item.type}">
                <label>或上传视频文件</label>
                <input type="file" data-field="videoFile" data-id="${item.id}" accept="video/*" onchange="handleAIGCVideoUpload(this, ${item.id})">
                <div class="video-upload-info"></div>
            </div>
            <!-- 尺寸已自动根据图片方向识别，无需手动设置 -->
        `;
        container.appendChild(itemElement);
    });
    
    // 设置类型变化监听器
    setupAIGCTypeChangeListeners();
}

// 渲染视频项目列表
function renderVideoItemsList() {
    const container = document.getElementById('videos-items-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    contentData.videos.items.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'editable-item';
        itemElement.innerHTML = `
            <div class="item-header">
                <h5>视频 ${index + 1}</h5>
                <button type="button" class="btn btn-small btn-delete" onclick="removeItem('videos', ${item.id})">删除</button>
            </div>
            <div class="form-group">
                <label>标题</label>
                <input type="text" data-field="title" data-id="${item.id}" value="${item.title}">
            </div>
            <div class="form-group">
                <label>描述</label>
                <textarea data-field="description" data-id="${item.id}">${item.description}</textarea>
            </div>
            <div class="form-group">
                <label>缩略图URL</label>
                <input type="text" data-field="thumbnail" data-id="${item.id}" value="${item.thumbnail}">
            </div>
            <div class="form-group">
                <label>视频URL</label>
                <input type="text" data-field="videoUrl" data-id="${item.id}" value="${item.videoUrl}">
            </div>
        `;
        container.appendChild(itemElement);
    });
}

// 渲染特效项目列表
function renderEffectsItemsList() {
    const container = document.getElementById('effects-items-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    contentData.effects.items.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'editable-item';
        itemElement.innerHTML = `
            <div class="item-header">
                <h5>特效 ${index + 1}</h5>
                <button type="button" class="btn btn-small btn-delete" onclick="removeItem('effects', ${item.id})">删除</button>
            </div>
            <div class="form-group">
                <label>标题</label>
                <input type="text" data-field="title" data-id="${item.id}" value="${item.title}">
            </div>
            <div class="form-group">
                <label>描述</label>
                <textarea data-field="description" data-id="${item.id}">${item.description}</textarea>
            </div>
            <div class="form-group">
                <label>图片URL</label>
                <input type="text" data-field="image" data-id="${item.id}" value="${item.image}">
            </div>
            <div class="form-group">
                <label>视频URL</label>
                <input type="text" data-field="videoUrl" data-id="${item.id}" value="${item.videoUrl || ''}" placeholder="输入视频链接">
            </div>
        `;
        container.appendChild(itemElement);
    });
}

// 渲染账号项目列表
function renderAccountsItemsList() {
    const container = document.getElementById('accounts-items-list');
    if (!container) return;
    
    container.innerHTML = '';
    
    contentData.accounts.items.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'editable-item';
        itemElement.innerHTML = `
            <div class="item-header">
                <h5>账号 ${index + 1}</h5>
                <button type="button" class="btn btn-small btn-delete" onclick="removeItem('accounts', ${item.id})">删除</button>
            </div>
            <div class="form-group">
                <label>平台名称</label>
                <input type="text" data-field="platform" data-id="${item.id}" value="${item.platform}">
            </div>
            <div class="form-group">
                <label>用户名</label>
                <input type="text" data-field="username" data-id="${item.id}" value="${item.username}">
            </div>
            <div class="form-group">
                <label>粉丝数</label>
                <input type="text" data-field="followers" data-id="${item.id}" value="${item.followers}">
            </div>
            <div class="form-group">
                <label>作品数</label>
                <input type="text" data-field="works" data-id="${item.id}" value="${item.works}">
            </div>
            <div class="form-group">
                <label>${item.platform === 'Instagram' ? '平均点赞' : '播放量'}</label>
                <input type="text" data-field="${item.platform === 'Instagram' ? 'likes' : 'views'}" data-id="${item.id}" value="${item.views || item.likes}">
            </div>
            <div class="form-group">
                <label>预览图URL</label>
                <input type="text" data-field="preview" data-id="${item.id}" value="${item.preview}">
            </div>
            <div class="form-group">
                <label>链接</label>
                <input type="text" data-field="link" data-id="${item.id}" value="${item.link}">
            </div>
        `;
        container.appendChild(itemElement);
    });
}

// 预览轮播图图片
function previewSlideImage(index, imageUrl) {
    const previewContainer = document.getElementById(`preview-${index}`);
    if (previewContainer) {
        const img = previewContainer.querySelector('img');
        if (img) {
            img.src = imageUrl;
        }
    }
}

// 处理AIGC视频上传
function handleAIGCVideoUpload(input, itemId) {
    const file = input.files[0];
    if (!file) return;
    
    // 检查文件类型
    if (!file.type.startsWith('video/')) {
        showNotification('请选择视频文件', 'error');
        input.value = '';
        return;
    }
    
    // 创建视频URL
    const videoUrl = URL.createObjectURL(file);
    
    // 更新对应的视频URL输入框
    const videoUrlInput = document.querySelector(`input[data-field="videoUrl"][data-id="${itemId}"]`);
    if (videoUrlInput) {
        videoUrlInput.value = videoUrl;
    }
    
    // 显示上传信息
    const infoDiv = input.parentElement.querySelector('.video-upload-info');
    if (infoDiv) {
        infoDiv.innerHTML = `
            <div class="upload-success">
                <i class="fas fa-check-circle"></i>
                <span>已上传: ${file.name}</span>
                <small>大小: ${(file.size / 1024 / 1024).toFixed(2)} MB</small>
            </div>
        `;
    }
    
    // 获取视频时长
    getAIGCVideoDuration(file, itemId);
    
    showNotification('视频上传成功', 'success');
}

// 获取AIGC视频时长
function getAIGCVideoDuration(file, itemId) {
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = function() {
        const duration = video.duration;
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        // 将时长信息保存到项目数据中
        const item = contentData.aigc.items.find(i => i.id === itemId);
        if (item) {
            item.duration = formattedDuration;
        }
        
        // 显示时长信息
        const infoDiv = document.querySelector(`input[data-field="videoFile"][data-id="${itemId}"]`)
            .parentElement.querySelector('.video-upload-info');
        if (infoDiv) {
            const durationInfo = document.createElement('small');
            durationInfo.textContent = `时长: ${formattedDuration}`;
            infoDiv.appendChild(durationInfo);
        }
        
        // 清理
        window.URL.revokeObjectURL(video.src);
    };
    
    video.onerror = function() {
        showNotification('无法读取视频时长', 'error');
    };
    
    video.src = URL.createObjectURL(file);
}

// 通用视频播放函数
function playVideoInModal(videoUrl, title, description) {
    console.log('playVideoInModal 被调用');
    console.log('视频URL:', videoUrl);
    console.log('视频标题:', title);
    
    // 使用现有的视频模态框
    const videoModal = document.getElementById('videoModal');
    const videoPlayer = document.getElementById('videoPlayer');
    const videoPlayerElement = videoPlayer ? videoPlayer.closest('.video-player') : null;
    const videoTitle = document.getElementById('videoTitle');
    const videoDescription = document.getElementById('videoDescription');
    
    if (!videoModal || !videoPlayer || !videoTitle || !videoDescription) {
        console.error('视频模态框元素未找到');
        console.log('videoModal:', !!videoModal);
        console.log('videoPlayer:', !!videoPlayer);
        console.log('videoTitle:', !!videoTitle);
        console.log('videoDescription:', !!videoDescription);
        return;
    }
    
    // 重置视频播放器尺寸
    if (videoPlayerElement) {
        videoPlayerElement.style.width = '';
        videoPlayerElement.style.height = '';
        videoPlayerElement.classList.remove('landscape-video');
        videoPlayerElement.classList.remove('portrait-video');
    }
    
    // 添加视频事件监听器
    videoPlayer.onerror = function(e) {
        console.error('视频加载错误:', e);
        console.log('错误详情:', videoPlayer.error);
    };
    
    videoPlayer.onloadeddata = function() {
        console.log('视频数据已加载');
    };
    
    // 设置视频源和标题
    videoPlayer.src = videoUrl;
    videoPlayer.load();
    videoTitle.textContent = title;
    videoDescription.textContent = description || '';
    
    // 添加视频元数据加载事件，自动调整视频尺寸
    videoPlayer.addEventListener('loadedmetadata', function() {
        // 重置视频样式，确保视频显示
        videoPlayer.style.position = '';
        videoPlayer.style.top = '';
        videoPlayer.style.left = '';
        videoPlayer.style.transform = '';
        videoPlayer.style.width = '100%';
        videoPlayer.style.height = '100%';
        videoPlayer.style.objectFit = 'contain';
        
        console.log('视频元数据已加载，视频尺寸:', videoPlayer.videoWidth, 'x', videoPlayer.videoHeight);
        
        // 判断是否为横屏视频（宽度 > 高度）
        if (videoPlayer.videoWidth > videoPlayer.videoHeight) {
            // 横屏视频：设置为 854x480
            if (videoPlayerElement) {
                videoPlayerElement.classList.add('landscape-video');
                videoPlayerElement.style.width = '854px';
                videoPlayerElement.style.height = '480px';
                console.log('横屏视频：设置为 854x480');
            }
        } else if (videoPlayer.videoHeight > videoPlayer.videoWidth) {
            // 竖屏视频：设置为 480x854
            if (videoPlayerElement) {
                videoPlayerElement.classList.add('portrait-video');
                videoPlayerElement.style.width = '480px';
                videoPlayerElement.style.height = '854px';
                console.log('竖屏视频：设置为 480x854');
            }
        } else {
            // 方形视频：保持默认
            console.log('方形视频：保持默认');
        }
    });
    
    // 隐藏元数据信息（对于非作品集视频）
    const videoDuration = document.getElementById('videoDuration');
    const videoYear = document.getElementById('videoYear');
    if (videoDuration) videoDuration.style.display = 'none';
    if (videoYear) videoYear.style.display = 'none';
    
    // 显示模态框
    videoModal.classList.add('show');
    document.body.style.overflow = 'hidden';
    console.log('视频模态框已显示');
    
    // 自动播放视频
    videoPlayer.play().catch(error => {
        console.log('自动播放失败，用户可能需要手动点击播放:', error);
    });
}

// 播放AIGC视频
function playAIGCVideo(videoUrl, title) {
    console.log('playAIGCVideo 被调用');
    console.log('AIGC视频URL:', videoUrl);
    console.log('AIGC视频标题:', title);
    playVideoInModal(videoUrl, title, 'AIGC作品展示');
}

// 打开图片放大模态框
function openImageModal(imageUrl, title, description) {
    console.log('openImageModal 被调用');
    console.log('图片URL:', imageUrl);
    console.log('图片标题:', title);
    
    // 检查是否已存在图片模态框
    let imageModal = document.getElementById('imageModal');
    
    if (!imageModal) {
        // 创建图片模态框
        imageModal = document.createElement('div');
        imageModal.id = 'imageModal';
        imageModal.className = 'modal';
        imageModal.innerHTML = `
            <div class="modal-content image-modal-content">
                <span class="close image-modal-close">&times;</span>
                <div class="image-modal-container">
                    <div class="image-modal-header">
                        <h2 id="imageModalTitle"></h2>
                    </div>
                    <div class="image-modal-body">
                        <div class="image-modal-image-container">
                            <img id="imageModalImage" src="" alt="">
                            <div class="image-modal-loading">
                                <i class="fas fa-spinner fa-spin"></i>
                                <span>加载中...</span>
                            </div>
                        </div>
                        <div class="image-modal-info">
                            <p id="imageModalDescription"></p>
                        </div>
                    </div>
                    
                </div>
            </div>
        `;
        
        document.body.appendChild(imageModal);
        
        // 添加关闭事件
        const closeBtn = imageModal.querySelector('.image-modal-close');
        closeBtn.addEventListener('click', closeImageModal);
        
        // 点击模态框外部关闭
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal) {
                closeImageModal();
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && imageModal.style.display === 'block') {
                closeImageModal();
            }
        });
        
        
    }
    
    // 设置内容
    const modalTitle = document.getElementById('imageModalTitle');
    const modalImage = document.getElementById('imageModalImage');
    const modalDescription = document.getElementById('imageModalDescription');
    const loadingIndicator = imageModal.querySelector('.image-modal-loading');
    
    modalTitle.textContent = title;
    modalDescription.textContent = description || '';
    
    // 显示加载指示器
    loadingIndicator.style.display = 'flex';
    modalImage.style.display = 'none';
    
    // 加载图片
    const img = new Image();
    img.onload = function() {
        modalImage.src = imageUrl;
        modalImage.style.display = 'block';
        loadingIndicator.style.display = 'none';
        
        // 根据图片尺寸调整显示方式
        const imageWidth = img.naturalWidth;
        const imageHeight = img.naturalHeight;
        const aspectRatio = imageWidth / imageHeight;
        
        // 获取视口尺寸
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // 计算适合的显示尺寸，确保图片适应屏幕
        let displayWidth, displayHeight;
        
        // 设置最大显示尺寸为视口的85%
        const maxDisplayWidth = viewportWidth * 0.85;
        const maxDisplayHeight = viewportHeight * 0.85;
        
        if (aspectRatio > 1) {
            // 横屏图片：以宽度为基准，确保图片完整显示
            displayWidth = Math.min(imageWidth, maxDisplayWidth);
            displayHeight = displayWidth / aspectRatio;
            
            // 如果高度超出视口，则以高度为基准重新计算
            if (displayHeight > maxDisplayHeight) {
                displayHeight = maxDisplayHeight;
                displayWidth = displayHeight * aspectRatio;
            }
        } else {
            // 竖屏图片：以高度为基准
            displayHeight = Math.min(imageHeight, maxDisplayHeight);
            displayWidth = displayHeight * aspectRatio;
            
            // 如果宽度超出视口，则以宽度为基准重新计算
            if (displayWidth > maxDisplayWidth) {
                displayWidth = maxDisplayWidth;
                displayHeight = displayWidth / aspectRatio;
            }
        }
        
        // 应用尺寸，让模态框适配图片大小
        modalImage.style.width = displayWidth + 'px';
        modalImage.style.height = displayHeight + 'px';
        modalImage.style.maxWidth = '85vw';
        modalImage.style.maxHeight = '85vh';
        modalImage.style.margin = '0 auto';
        modalImage.style.display = 'block';
        modalImage.style.objectFit = 'contain';
        
        // 调整模态框和内容的大小以适配图片
        const modalContent = imageModal.querySelector('.modal-content');
        if (modalContent) {
            modalContent.style.width = displayWidth + 'px';
            modalContent.style.height = displayHeight + 'px';
            modalContent.style.maxWidth = '90vw';
            modalContent.style.maxHeight = '90vh';
            modalContent.style.background = 'transparent';
        }
        
        // 调整图片模态框内容的大小
        const imageModalContent = imageModal.querySelector('.image-modal-content');
        if (imageModalContent) {
            imageModalContent.style.width = displayWidth + 'px';
            imageModalContent.style.height = displayHeight + 'px';
            imageModalContent.style.maxWidth = '90vw';
            imageModalContent.style.maxHeight = '90vh';
            imageModalContent.style.background = 'transparent';
        }
        
        // 调整图片容器的大小
        const imageContainer = imageModal.querySelector('.image-modal-image-container');
        if (imageContainer) {
            imageContainer.style.width = displayWidth + 'px';
            imageContainer.style.height = displayHeight + 'px';
            imageContainer.style.padding = '0';
        }
    };
    
    img.onerror = function() {
        loadingIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i><span>图片加载失败</span>';
    };
    
    img.src = imageUrl;
    
    // 显示模态框
    imageModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 关闭图片模态框
function closeImageModal() {
    const imageModal = document.getElementById('imageModal');
    if (imageModal) {
        imageModal.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
}

// 下载图片
function downloadImage(imageUrl, title) {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('图片下载已开始');
}

// 分享图片
function shareImage(title, imageUrl) {
    if (navigator.share) {
        navigator.share({
            title: title,
            text: `查看这个精彩的AI作品：${title}`,
            url: imageUrl
        }).catch(err => {
            console.log('分享失败:', err);
            // 复制链接到剪贴板作为备选方案
            copyToClipboard(imageUrl);
        });
    } else {
        // 复制链接到剪贴板
        copyToClipboard(imageUrl);
    }
}

// 关闭AIGC视频模态框
function closeAIGCVideoModal() {
    const videoModal = document.getElementById('videoModal');
    const videoPlayer = document.getElementById('videoPlayer');
    
    if (videoModal) {
        videoModal.style.display = 'none';
    }
    
    if (videoPlayer) {
        videoPlayer.pause();
        videoPlayer.currentTime = 0;
    }
    
    document.body.style.overflow = 'auto';
}

// 初始化轮播图拖拽排序
function initSlideshowDragSort() {
    const container = document.getElementById('slideshow-items-list');
    if (!container) return;
    
    const items = container.querySelectorAll('.editable-item');
    let draggedItem = null;
    
    items.forEach(item => {
        // 添加拖拽手柄
        const header = item.querySelector('.item-header');
        if (header && !header.querySelector('.drag-handle')) {
            const dragHandle = document.createElement('div');
            dragHandle.className = 'drag-handle';
            dragHandle.innerHTML = '<i class="fas fa-grip-vertical"></i>';
            dragHandle.style.cursor = 'move';
            dragHandle.style.marginRight = '10px';
            dragHandle.style.color = '#aaa';
            header.insertBefore(dragHandle, header.firstChild);
        }
        
        // 使项目可拖拽
        item.draggable = true;
        
        // 拖拽开始
        item.addEventListener('dragstart', (e) => {
            draggedItem = item;
            item.style.opacity = '0.5';
            e.dataTransfer.effectAllowed = 'move';
        });
        
        // 拖拽结束
        item.addEventListener('dragend', () => {
            item.style.opacity = '';
            draggedItem = null;
        });
        
        // 拖拽经过
        item.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (item !== draggedItem) {
                const rect = item.getBoundingClientRect();
                const midpoint = rect.top + rect.height / 2;
                
                if (e.clientY < midpoint) {
                    container.insertBefore(draggedItem, item);
                } else {
                    container.insertBefore(draggedItem, item.nextSibling);
                }
                
                // 更新轮播图数据顺序
                updateSlideOrder();
                // 重新渲染列表以更新索引
                renderSlideshowItemsList();
                // 重新初始化拖拽
                initSlideshowDragSort();
            }
        });
    });
}

// 更新轮播图顺序
function updateSlideOrder() {
    const items = document.querySelectorAll('#slideshow-items-list .editable-item');
    const newOrder = [];
    
    items.forEach(item => {
        const titleInput = item.querySelector('input[data-field="title"]');
        if (titleInput) {
            const index = parseInt(titleInput.getAttribute('data-index'));
            if (slideData[index]) {
                newOrder.push(slideData[index]);
            }
        }
    });
    
    // 更新slideData数组
    slideData.length = 0;
    slideData.push(...newOrder);
}

// 添加新项目
function addNewItem(category) {
    const newItem = {
        id: Date.now(),
        title: "新项目",
        description: "项目描述",
        image: "https://picsum.photos/seed/new/400/300.jpg"
    };
    
    if (category === 'aigc') {
        newItem.type = "photography";
        // 移除size属性，让图片根据自身宽高比自动调整显示
        newItem.videoUrl = "";
        newItem.title = "新AI摄影作品";
    } else if (category === 'videos') {
        newItem.title = "新视频";
        newItem.thumbnail = "https://picsum.photos/seed/newvideo/400/225.jpg";
        newItem.videoUrl = "";
    } else if (category === 'effects') {
        newItem.title = "新特效";
        newItem.videoUrl = "";
    } else if (category === 'accounts') {
        newItem.platform = "新平台";
        newItem.username = "@newaccount";
        newItem.followers = "0";
        newItem.works = "0";
        newItem.views = "0";
        newItem.preview = "https://picsum.photos/seed/newaccount/300/200.jpg";
        newItem.link = "";
        newItem.icon = "fas fa-user";
    }
    
    contentData[category].items.push(newItem);
    
    // 自动保存数据
    saveContentData();
    
    // 重新渲染对应的列表
    if (category === 'aigc') {
        renderAIGCItemsList();
        renderAIGCContent();
        filterAIGCContent('all'); // 重新渲染全部分类视图
    }
    else if (category === 'videos') renderVideoItemsList();
    else if (category === 'effects') renderEffectsItemsList();
    else if (category === 'accounts') renderAccountsItemsList();
    
    showNotification('已添加新项目', 'success');
}

// 删除项目
function removeItem(category, itemId) {
    if (confirm('确定要删除这个项目吗？')) {
        const index = contentData[category].items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            contentData[category].items.splice(index, 1);
            
            // 自动保存数据
            saveContentData();
            
            // 重新渲染对应的列表
            if (category === 'aigc') {
                renderAIGCItemsList();
                renderAIGCContent();
                filterAIGCContent('all'); // 重新渲染全部分类视图
            }
            else if (category === 'videos') renderVideoItemsList();
            else if (category === 'effects') renderEffectsItemsList();
            else if (category === 'accounts') renderAccountsItemsList();
            
            showNotification('项目已删除', 'success');
        }
    }
}

// 监听AIGC项目类型变化
function setupAIGCTypeChangeListeners() {
    const typeSelects = document.querySelectorAll('#aigc-items-list select[data-field="type"]');
    
    typeSelects.forEach(select => {
        select.addEventListener('change', function() {
            const itemId = parseInt(this.getAttribute('data-id'));
            const itemElement = this.closest('.editable-item');
            const videoUrlGroup = itemElement.querySelector('.video-url-group');
            const videoUploadGroup = itemElement.querySelector('.video-upload-group');
            
            // 根据选择的类型显示或隐藏视频相关字段
            if (this.value === 'video') {
                if (videoUrlGroup) videoUrlGroup.style.display = 'block';
                if (videoUploadGroup) videoUploadGroup.style.display = 'block';
                itemElement.setAttribute('data-type', 'video');
            } else {
                if (videoUrlGroup) videoUrlGroup.style.display = 'none';
                if (videoUploadGroup) videoUploadGroup.style.display = 'none';
                itemElement.setAttribute('data-type', this.value);
            }
        });
    });
}

// 设置内容表单提交
function setupContentForms() {
    // 轮播图表单
    const slideshowForm = document.getElementById('slideshow-form');
    if (slideshowForm) {
        slideshowForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            console.log('轮播图表单提交');
            
            // 添加保存中动画
            const submitBtn = slideshowForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '保存中...';
            submitBtn.disabled = true;
            
            // 更新轮播图数据
            const inputs = document.querySelectorAll('#slideshow-items-list input, #slideshow-items-list textarea');
            console.log('找到的输入元素数量:', inputs.length);
            
            inputs.forEach(input => {
                const field = input.getAttribute('data-field');
                const index = parseInt(input.getAttribute('data-index'));
                console.log(`更新 slideData[${index}].${field} = ${input.value}`);
                if (slideData[index]) {
                    slideData[index][field] = input.value;
                }
            });
            
            console.log('更新后的 slideData:', slideData);
            
            // 保存轮播图数据并更新显示
            saveSlideData();
            // 创建副本避免引用问题
            updateSlideImages([...slideData]);
            
            // 添加保存成功动画
            setTimeout(() => {
                submitBtn.textContent = '保存成功 ✓';
                submitBtn.style.backgroundColor = '#28a745';
                
                setTimeout(() => {
                    submitBtn.textContent = originalText;
                    submitBtn.style.backgroundColor = '';
                    submitBtn.disabled = false;
                }, 1500);
            }, 500);
            
            showNotification('轮播图已保存');
        });
    }
    
    // 关于我表单
    const aboutForm = document.getElementById('about-form');
    if (aboutForm) {
        aboutForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const aboutContentTextarea = document.getElementById('about-content');
            
            if (aboutContentTextarea) {
                const newContent = aboutContentTextarea.value;
                saveAboutContent(newContent);
                
                // 添加保存成功动画
                const submitBtn = aboutForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = '保存中...';
                submitBtn.disabled = true;
                
                setTimeout(() => {
                    submitBtn.textContent = '保存成功 ✓';
                    submitBtn.style.backgroundColor = '#28a745';
                    
                    setTimeout(() => {
                        submitBtn.textContent = originalText;
                        submitBtn.style.backgroundColor = '';
                        submitBtn.disabled = false;
                    }, 1500);
                }, 500);
                
                showNotification('关于我内容已保存');
            }
        });
    }
    
    // AIGC表单
    const aigcForm = document.getElementById('aigc-form');
    if (aigcForm) {
        aigcForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('aigc-title');
            const subtitleInput = document.getElementById('aigc-subtitle');
            
            if (titleInput) contentData.aigc.title = titleInput.value;
            if (subtitleInput) contentData.aigc.subtitle = subtitleInput.value;
            
            // 更新项目数据
            const inputs = document.querySelectorAll('#aigc-items-list input, #aigc-items-list textarea, #aigc-items-list select');
            inputs.forEach(input => {
                const field = input.getAttribute('data-field');
                const id = parseInt(input.getAttribute('data-id'));
                const item = contentData.aigc.items.find(i => i.id === id);
                if (item) {
                    item[field] = input.value;
                }
            });
            
            saveContentData();
            renderAIGCContent();
            filterAIGCContent('all'); // 重新渲染全部分类视图
            showNotification('AIGC内容已保存');
        });
    }
    
    // 视频表单
    const videosForm = document.getElementById('videos-form');
    if (videosForm) {
        videosForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('videos-title');
            const subtitleInput = document.getElementById('videos-subtitle');
            const featuredTitleInput = document.getElementById('featured-title');
            const featuredDescInput = document.getElementById('featured-desc');
            const featuredThumbnailInput = document.getElementById('featured-thumbnail');
            
            if (titleInput) contentData.videos.title = titleInput.value;
            if (subtitleInput) contentData.videos.subtitle = subtitleInput.value;
            if (featuredTitleInput) contentData.videos.featured.title = featuredTitleInput.value;
            if (featuredDescInput) contentData.videos.featured.description = featuredDescInput.value;
            if (featuredThumbnailInput) contentData.videos.featured.thumbnail = featuredThumbnailInput.value;
            
            // 更新项目数据
            const inputs = document.querySelectorAll('#videos-items-list input, #videos-items-list textarea');
            inputs.forEach(input => {
                const field = input.getAttribute('data-field');
                const id = parseInt(input.getAttribute('data-id'));
                const item = contentData.videos.items.find(i => i.id === id);
                if (item) {
                    item[field] = input.value;
                }
            });
            
            saveContentData();
            renderVideoContent();
            showNotification('视频内容已保存');
        });
    }
    
    // 特效表单
    const effectsForm = document.getElementById('effects-form');
    if (effectsForm) {
        effectsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('effects-title');
            const subtitleInput = document.getElementById('effects-subtitle');
            
            if (titleInput) contentData.effects.title = titleInput.value;
            if (subtitleInput) contentData.effects.subtitle = subtitleInput.value;
            
            // 更新项目数据
            const inputs = document.querySelectorAll('#effects-items-list input, #effects-items-list textarea');
            inputs.forEach(input => {
                const field = input.getAttribute('data-field');
                const id = parseInt(input.getAttribute('data-id'));
                const item = contentData.effects.items.find(i => i.id === id);
                if (item) {
                    item[field] = input.value;
                }
            });
            
            saveContentData();
            renderEffectsContent();
            showNotification('特效内容已保存');
        });
    }
    
    // 账号表单
    const accountsForm = document.getElementById('accounts-form');
    if (accountsForm) {
        accountsForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('accounts-title');
            const subtitleInput = document.getElementById('accounts-subtitle');
            
            if (titleInput) contentData.accounts.title = titleInput.value;
            if (subtitleInput) contentData.accounts.subtitle = subtitleInput.value;
            
            // 更新项目数据
            const inputs = document.querySelectorAll('#accounts-items-list input, #accounts-items-list textarea');
            inputs.forEach(input => {
                const field = input.getAttribute('data-field');
                const id = parseInt(input.getAttribute('data-id'));
                const item = contentData.accounts.items.find(i => i.id === id);
            if (item) {
                item[field] = input.value;
            }
        });
        
        saveContentData();
        renderAccountsContent();
        showNotification('账号内容已保存');
        });
    }
}

// 修改showAdminInterface函数，添加内容管理界面
function showAdminInterface() {
    if (isAdminLoggedIn) {
        const adminPanel = document.getElementById('adminPanel');
        if (adminPanel) {
            adminPanel.style.display = 'block';
            document.body.style.overflow = 'hidden';
            renderVideoList();
            
            // 添加内容管理界面（如果还没有添加）
            if (!document.querySelector('.content-management-tabs')) {
                addContentManagementToAdmin();
            }
        }
    }
}

function renderAllContent() {
    renderAIGCContent();
    renderVideoContent();
    renderEffectsContent();
    renderAccountsContent();
}

function renderAIGCContent() {
    const section = document.querySelector('.aigc-section');
    if (!section) return;
    
    // 更新标题和副标题
    section.querySelector('.section-title').textContent = contentData.aigc.title;
    section.querySelector('.section-subtitle').textContent = contentData.aigc.subtitle;
    
    // 更新作品项
    const scrollTrack = section.querySelector('.scroll-track');
    if (scrollTrack) {
        scrollTrack.innerHTML = '';
        
        contentData.aigc.items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = `portfolio-item ${item.size}-item`;
            itemElement.innerHTML = `
                <div class="item-image">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="item-overlay">
                        <div class="item-content">
                            <h3>${item.title}</h3>
                            <p>${item.description}</p>
                            <button class="view-btn" onclick="editContentItem('aigc', ${item.id})">查看详情</button>
                        </div>
                    </div>
                </div>
            `;
            scrollTrack.appendChild(itemElement);
        });
    }
}

function renderVideoContent() {
    const section = document.querySelector('.video-section');
    if (!section) return;
    
    // 更新标题和副标题
    section.querySelector('.section-title').textContent = contentData.videos.title;
    section.querySelector('.section-subtitle').textContent = contentData.videos.subtitle;
    
    // 更新精选视频
    const featuredVideo = section.querySelector('.featured-video');
    if (featuredVideo) {
        const videoContainer = featuredVideo.querySelector('.video-container video');
        const videoInfo = featuredVideo.querySelector('.video-info');
        
        if (videoContainer) {
            videoContainer.poster = contentData.videos.featured.thumbnail;
            if (contentData.videos.featured.videoUrl) {
                videoContainer.src = contentData.videos.featured.videoUrl;
            }
        }
        
        if (videoInfo) {
            const videoTitle = videoInfo.querySelector('h3');
            const videoDesc = videoInfo.querySelector('p');
            if (videoTitle) videoTitle.textContent = contentData.videos.featured.title;
            if (videoDesc) videoDesc.textContent = contentData.videos.featured.description;
        }
    }
    
    // 更新视频网格
    const videoGrid = section.querySelector('.video-grid');
    if (videoGrid) {
        videoGrid.innerHTML = '';
        
        contentData.videos.items.forEach(item => {
            const videoItem = document.createElement('div');
            videoItem.className = 'video-item';
            videoItem.innerHTML = `
                <div class="video-thumbnail" onclick="playVideoInModal('${item.videoUrl}', '${item.title}', '${item.description}')">
                    <img src="${item.thumbnail}" alt="${item.title}">
                </div>
                <h4>${item.title}</h4>
                <p>${item.description}</p>
            `;
            videoGrid.appendChild(videoItem);
        });
    }
}

function renderEffectsContent() {
    const section = document.querySelector('.effects-section');
    if (!section) return;
    
    // 更新标题和副标题
    section.querySelector('.section-title').textContent = contentData.effects.title;
    section.querySelector('.section-subtitle').textContent = contentData.effects.subtitle;
    
    // 更新特效作品
    const effectsShowcase = section.querySelector('.effects-showcase');
    if (effectsShowcase) {
        effectsShowcase.innerHTML = '';
        
        contentData.effects.items.forEach(item => {
            const effectItem = document.createElement('div');
            effectItem.className = 'effect-item';
            effectItem.innerHTML = `
                <div class="effect-preview" onclick="playVideoInModal('${item.videoUrl}', '${item.title}', '${item.description}')">
                    <img src="${item.image}" alt="${item.title}">
                    <div class="effect-hover">
                        <div class="effect-info">
                            <h3>${item.title}</h3>
                            <p>${item.description}</p>
                        </div>
                    </div>
                </div>
            `;
            effectsShowcase.appendChild(effectItem);
        });
    }
}

function renderAccountsContent() {
    const section = document.querySelector('.accounts-section');
    if (!section) return;
    
    // 更新标题和副标题
    section.querySelector('.section-title').textContent = contentData.accounts.title;
    section.querySelector('.section-subtitle').textContent = contentData.accounts.subtitle;
    
    // 更新账号卡片
    const accountsGrid = section.querySelector('.accounts-grid');
    if (accountsGrid) {
        accountsGrid.innerHTML = '';
        
        contentData.accounts.items.forEach(item => {
            const accountCard = document.createElement('div');
            accountCard.className = 'account-card';
            
            const statsHtml = item.likes 
                ? `<div class="stat">
                    <span class="stat-number">${item.likes}</span>
                    <span class="stat-label">平均点赞</span>
                </div>`
                : `<div class="stat">
                    <span class="stat-number">${item.views}</span>
                    <span class="stat-label">播放量</span>
                </div>`;
            
            accountCard.innerHTML = `
                <div class="account-header">
                    <div class="platform-icon">
                        <i class="${item.icon}"></i>
                    </div>
                    <div class="account-info">
                        <h3>${item.platform}</h3>
                        <p>${item.username}</p>
                    </div>
                    <button class="follow-btn" onclick="editContentItem('accounts', ${item.id})">编辑</button>
                </div>
                <div class="account-stats">
                    <div class="stat">
                        <span class="stat-number">${item.followers}</span>
                        <span class="stat-label">粉丝</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${item.works}</span>
                        <span class="stat-label">作品</span>
                    </div>
                    ${statsHtml}
                </div>
                <div class="account-preview">
                    <a href="${item.link || '#'}" target="_blank" class="account-preview-link" onclick="event.stopPropagation()">
                        <img src="${item.preview}" alt="作品预览">
                        <div class="account-preview-overlay">
                            <div class="preview-actions">
                                <button class="btn btn-primary view-details-btn" onclick="event.stopPropagation(); viewAccountDetails(${item.id})">
                                    <i class="fas fa-eye"></i> 查看详情
                                </button>
                            </div>
                        </div>
                    </a>
                </div>
            `;
            
            // 为整个卡片添加点击事件（用于编辑）
            accountCard.addEventListener('click', (e) => {
                // 如果点击的是预览图片链接，不触发编辑
                if (!e.target.closest('.account-preview-link')) {
                    editContentItem('accounts', item.id);
                }
            });
            
            accountsGrid.appendChild(accountCard);
        });
    }
}

function viewAccountDetails(accountId) {
    // 查找账号数据
    const account = contentData.accounts.items.find(item => item.id === accountId);
    if (!account) {
        showNotification('找不到账号信息', 'error');
        return;
    }
    
    // 创建详情模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'accountDetailsModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeAccountDetailsModal()">&times;</span>
            <div class="account-details">
                <div class="account-details-header">
                    <div class="platform-icon">
                        <i class="${account.icon}"></i>
                    </div>
                    <div class="account-info">
                        <h2>${account.platform}</h2>
                        <p>${account.username}</p>
                    </div>
                    <a href="${account.link || '#'}" target="_blank" class="btn btn-primary">
                        <i class="fas fa-external-link-alt"></i> 访问主页
                    </a>
                </div>
                
                <div class="account-details-stats">
                    <div class="stat">
                        <span class="stat-number">${account.followers}</span>
                        <span class="stat-label">粉丝</span>
                    </div>
                    <div class="stat">
                        <span class="stat-number">${account.works}</span>
                        <span class="stat-label">作品</span>
                    </div>
                    ${account.likes ? `
                    <div class="stat">
                        <span class="stat-number">${account.likes}</span>
                        <span class="stat-label">平均点赞</span>
                    </div>` : `
                    <div class="stat">
                        <span class="stat-number">${account.views}</span>
                        <span class="stat-label">播放量</span>
                    </div>`}
                </div>
                
                <div class="account-details-preview">
                    <h3>作品预览</h3>
                    <div class="preview-container">
                        <img src="${account.preview}" alt="${account.platform}作品预览">
                    </div>
                </div>
                
                <div class="account-details-description">
                    <h3>账号简介</h3>
                    <p>这是${account.platform}平台上的个人账号，主要分享创意视频作品。在这里您可以找到我的最新作品和创作动态。</p>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function closeAccountDetailsModal() {
    const modal = document.getElementById('accountDetailsModal');
    if (modal) {
        modal.remove();
        document.body.style.overflow = 'auto';
    }
}

function editContentItem(section, itemId) {
    if (!isAdminLoggedIn) {
        showNotification('请先登录管理员账号');
        return;
    }
    
    // 显示内容编辑模态框
    showContentEditModal(section, itemId);
}

function showContentEditModal(section, itemId) {
    // 创建内容编辑模态框
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'contentEditModal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close" onclick="closeContentEditModal()">&times;</span>
            <div class="content-edit-form">
                <h2>编辑内容</h2>
                <form id="contentEditForm">
                    <!-- 表单内容将根据不同部分动态生成 -->
                </form>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    modal.style.display = 'block';
    
    // 根据不同部分生成表单
    generateContentEditForm(section, itemId);
}

function generateContentEditForm(section, itemId) {
    const form = document.getElementById('contentEditForm');
    let formHtml = '';
    
    if (section === 'aigc') {
        const item = contentData.aigc.items.find(i => i.id === itemId);
        formHtml = `
            <div class="form-group">
                <label for="aigcTitle">标题</label>
                <input type="text" id="aigcTitle" value="${item.title}" required>
            </div>
            <div class="form-group">
                <label for="aigcDescription">描述</label>
                <textarea id="aigcDescription" required>${item.description}</textarea>
            </div>
            <div class="form-group">
                <label for="aigcImage">图片URL</label>
                <input type="url" id="aigcImage" value="${item.image}" required>
            </div>
            <div class="form-group">
                <label for="aigcSize">尺寸</label>
                <select id="aigcSize">
                    <option value="large" ${item.size === 'large' ? 'selected' : ''}>大</option>
                    <option value="small" ${item.size === 'small' ? 'selected' : ''}>小</option>
                </select>
            </div>
            <button type="button" onclick="saveContentEdit('aigc', ${itemId})" class="btn btn-primary">保存</button>
        `;
    } else if (section === 'videos') {
        // 视频内容编辑表单
        formHtml = `
            <div class="form-group">
                <label for="videoTitle">标题</label>
                <input type="text" id="videoTitle" required>
            </div>
            <div class="form-group">
                <label for="videoDescription">描述</label>
                <textarea id="videoDescription" required></textarea>
            </div>
            <div class="form-group">
                <label for="videoThumbnail">缩略图URL</label>
                <input type="url" id="videoThumbnail" required>
            </div>
            <div class="form-group">
                <label for="videoUrl">视频URL</label>
                <input type="url" id="videoUrl">
            </div>
            <button type="button" onclick="saveContentEdit('videos', ${itemId})" class="btn btn-primary">保存</button>
        `;
    }
    // 其他部分的表单可以类似添加
    
    form.innerHTML = formHtml;
}

function saveContentEdit(section, itemId) {
    if (section === 'aigc') {
        const item = contentData.aigc.items.find(i => i.id === itemId);
        item.title = document.getElementById('aigcTitle').value;
        item.description = document.getElementById('aigcDescription').value;
        item.image = document.getElementById('aigcImage').value;
        item.size = document.getElementById('aigcSize').value;
    }
    // 其他部分的保存逻辑可以类似添加
    
    saveContentData();
    renderAllContent();
    closeContentEditModal();
    showNotification('内容已更新');
}

function closeContentEditModal() {
    const modal = document.getElementById('contentEditModal');
    if (modal && document.body.contains(modal)) {
        document.body.removeChild(modal);
    }
}

// 添加键盘快捷键
document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + K 打开搜索功能（可扩展）
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        // 可以在这里添加搜索功能
    }
});

// 播放/暂停切换
function togglePlayPause() {
    const videoPlayer = document.getElementById('videoPlayer');
    if (videoPlayer.paused) {
        videoPlayer.play();
    } else {
        videoPlayer.pause();
    }
}

// 全屏切换
function toggleFullscreen() {
    const videoPlayer = document.getElementById('videoPlayer');
    if (!document.fullscreenElement) {
        videoPlayer.requestFullscreen().catch(err => {
            showNotification(`无法进入全屏模式: ${err.message}`);
        });
    } else {
        document.exitFullscreen();
    }
}



// 关闭视频模态框
function closeVideoModal() {
    const modal = document.getElementById('videoModal');
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        
        // 停止视频播放
        const videoPlayer = document.getElementById('videoPlayer');
        const videoPlayerElement = videoPlayer ? videoPlayer.closest('.video-player') : null;
        
        if (videoPlayer) {
            videoPlayer.pause();
            videoPlayer.src = '';
        }
        
        // 重置视频播放器尺寸
        if (videoPlayerElement) {
            videoPlayerElement.style.width = '';
            videoPlayerElement.style.height = '';
            videoPlayerElement.classList.remove('landscape-video');
            videoPlayerElement.classList.remove('portrait-video');
        }
    }
}

// AIGC二级横向标题分类功能
function setupAIGCCategoryDropdown() {
    const categoryTitles = document.querySelectorAll('.category-title');
    
    if (categoryTitles.length === 0) {
        console.error('AIGC分类标题元素未找到');
        return;
    }
    
    // 点击分类标题
    categoryTitles.forEach(title => {
        title.addEventListener('click', function(e) {
            e.preventDefault();
            
            const category = this.getAttribute('data-category');
            
            // 更新活动状态
            categoryTitles.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // 筛选AIGC内容
            filterAIGCContent(category);
        });
    });
}

// 筛选AIGC内容
function filterAIGCContent(category) {
    // 使用更安全的方式获取aigcGrid元素
    const aigcGrid = document.getElementById('aigcGrid') || document.querySelector('.aigc-grid');
    if (!aigcGrid) {
        console.error('无法找到aigcGrid元素，无法筛选AIGC内容');
        return;
    }
    
    console.log('筛选AIGC内容:', category); // 添加调试日志
    
    // 先淡出现有内容
    const existingItems = aigcGrid.querySelectorAll('.portfolio-item');
    existingItems.forEach((item, index) => {
        setTimeout(() => {
            item.style.opacity = '0';
            item.style.transform = 'scale(0.9)';
        }, index * 50);
    });
    
    // 等待淡出动画完成后清空并添加新内容
    setTimeout(() => {
        // 清空现有内容
        aigcGrid.innerHTML = '';
        
        // 移除所有可能的分类类
        aigcGrid.classList.remove('category-photography', 'category-animation', 'category-video');
        
        // 筛选数据
        let filteredItems;
        if (category === 'all') {
            // 对于"全部分类"，只显示3张图片，每个分类一张
            const photographyItems = contentData.aigc.items.filter(item => item.type === 'photography');
            const videoItems = contentData.aigc.items.filter(item => item.type === 'video');
            const animationItems = contentData.aigc.items.filter(item => item.type === 'animation');
            
            filteredItems = [];
            
            // 从每个分类中取一个代表作品
            if (photographyItems.length > 0) {
                filteredItems.push({...photographyItems[0], categoryType: 'photography'});
            }
            if (videoItems.length > 0) {
                filteredItems.push({...videoItems[0], categoryType: 'video'});
            }
            if (animationItems.length > 0) {
                filteredItems.push({...animationItems[0], categoryType: 'animation'});
            }
        } else {
            filteredItems = contentData.aigc.items.filter(item => item.type === category);
            
            // 为特定分类添加CSS类，应用花瓣网风格的瀑布流布局
            if (category === 'photography') {
                aigcGrid.classList.add('category-photography');
            } else if (category === 'animation') {
                aigcGrid.classList.add('category-animation');
            } else if (category === 'video') {
                aigcGrid.classList.add('category-video');
            }
            
            // 对于摄影和动画分类，根据图片长宽比例进行排序以优化瀑布流布局
            if (category === 'photography' || category === 'animation') {
                preloadAndSortImages(filteredItems, aigcGrid);
                return; // 提前返回，排序后的渲染在preloadAndSortImages中处理
            }
        }
        
        // 如果没有筛选结果
        if (filteredItems.length === 0) {
            const noResultsElement = document.createElement('div');
            noResultsElement.className = 'no-results';
            noResultsElement.style.opacity = '0';
            noResultsElement.style.transform = 'translateY(20px)';
            noResultsElement.style.transition = 'all 0.5s ease';
            noResultsElement.textContent = '该分类下暂无作品';
            
            aigcGrid.appendChild(noResultsElement);
            
            // 触发淡入动画
            setTimeout(() => {
                noResultsElement.style.opacity = '1';
                noResultsElement.style.transform = 'translateY(0)';
            }, 100);
            
            return;
        }
        
        // 渲染筛选后的内容
        filteredItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'portfolio-item'; // 移除size相关的类
            itemElement.style.opacity = '0';
            itemElement.style.transform = 'scale(0.9)';
            itemElement.style.transition = `all 0.6s ease ${index * 0.1}s`;
            
            // 为"全部分类"中的图片添加点击跳转功能
            const clickHandler = category === 'all' 
                ? `onclick="navigateToCategory('${item.categoryType}')"`
                : ``;
            
            // 添加光标样式提示可点击
            const cursorStyle = category === 'all' ? 'style="cursor: pointer;"' : '';
            
            // 为图片添加光标样式（仅对photography和animation类型）
            const imageCursorStyle = (item.type === 'photography' || item.type === 'animation') && category !== 'all'
                ? 'style="cursor: zoom-in;"'
                : cursorStyle;
            
            itemElement.innerHTML = `
                <div class="item-image" ${imageCursorStyle}>
                    ${item.type === 'video' && item.videoUrl ? 
                        `<video poster="${item.image}" preload="metadata">
                            <source src="${item.videoUrl}" type="video/mp4">
                            您的浏览器不支持 HTML5 视频播放。
                        </video>
                        <div class="video-play-overlay" data-video-url="${item.videoUrl}" data-video-title="${item.title}">
                        </div>` :
                        `<img src="${item.image}" alt="${item.title}">`
                    }
                    <div class="item-overlay">
                        <div class="item-content">
                            <h3>${item.title}</h3>
                            <p>${item.description}</p>
                            ${item.type === 'video' && item.duration ? 
                                `<p class="video-duration"><i class="fas fa-clock"></i> ${item.duration}</p>` : ''
                            }
                            ${category === 'all'
                                ? `<p class="category-hint"><span class="view-text">点击查看</span>${item.type === 'photography' ? '一、AI摄影作品' : item.type === 'video' ? '二、AI影片' : '三、AI动画设计'}分类</p>`
                                : (item.type === 'video'
                                    ? `<button class="play-btn-custom" onclick="playAIGCVideo('${item.videoUrl}', '${item.title}')">播放视频</button>`
                                    : `<button class="view-btn" onclick="openImageModal('${item.image}', '${item.title}', '${item.description}')">查看大图</button>`
                                )
                            }
                        </div>
                    </div>
                </div>
            `;
            
            // 为图片添加点击事件（直接点击图片）
            if ((item.type === 'photography' || item.type === 'animation') && category !== 'all') {
                const imgElement = itemElement.querySelector('img');
                if (imgElement) {
                    // 添加图片加载事件，用于瀑布流布局的淡入效果
                    imgElement.addEventListener('load', function() {
                        this.classList.add('loaded');
                        // 调用adjustImageContainerSize函数以应用花瓣网风格的瀑布流布局
                        adjustImageContainerSize(this, itemElement);
                    });
                    
                    // 确保图片可以点击
                    imgElement.style.cursor = 'zoom-in';
                    imgElement.style.pointerEvents = 'auto';
                    imgElement.style.position = 'relative';
                    imgElement.style.zIndex = '15';
                    
                    // 如果图片已经加载完成，立即添加类
                    if (imgElement.complete) {
                        imgElement.classList.add('loaded');
                        // 调用adjustImageContainerSize函数以应用花瓣网风格的瀑布流布局
                        adjustImageContainerSize(imgElement, itemElement);
                    }
                }
                
                // 为整个图片容器添加点击事件
                const imageContainer = itemElement.querySelector('.item-image');
                if (imageContainer) {
                    imageContainer.style.cursor = 'zoom-in';
                    imageContainer.style.pointerEvents = 'auto';
                    imageContainer.style.position = 'relative';
                    imageContainer.style.zIndex = '15';
                    imageContainer.setAttribute('onclick', `openImageModal('${item.image}', '${item.title}', '${item.description}')`);
                }
            }
            
            // 为整个项目添加点击事件
            if (category === 'all') {
                itemElement.addEventListener('click', () => navigateToCategory(item.categoryType));
            }
            
            // 为视频播放覆盖层添加点击事件
            const videoOverlay = itemElement.querySelector('.video-play-overlay');
            if (videoOverlay && item.type === 'video' && item.videoUrl) {
                videoOverlay.addEventListener('click', (e) => {
                    e.stopPropagation();
                    console.log('AIGC视频播放覆盖层被点击');
                    playAIGCVideo(item.videoUrl, item.title);
                });
            }
            
            aigcGrid.appendChild(itemElement);
            
            // 触发动画
            setTimeout(() => {
                itemElement.style.opacity = '1';
                itemElement.style.transform = 'scale(1)';
            }, 100 + index * 100);
        });
        
        // 如果是摄影或动画分类，确保图片点击功能正常工作
        if (category === 'photography' || category === 'animation') {
            setTimeout(() => {
                console.log('检查图片点击功能...');
                // 验证图片点击功能
                const images = document.querySelectorAll('.category-photography .aigc-grid .portfolio-item img, .category-animation .aigc-grid .portfolio-item img');
                console.log(`找到 ${images.length} 个图片元素`);
                
                images.forEach((img, index) => {
                    console.log(`图片 ${index + 1}:`, img.alt, 'onclick:', img.getAttribute('onclick'));
                });
            }, 500);
        }
    }, existingItems.length * 50 + 200);
}

// 预加载图片并根据长宽比例排序以优化两列竖版布局
function preloadAndSortImages(items, container) {
    if (!items || items.length === 0) {
        return;
    }
    
    console.log(`开始预加载和排序 ${items.length} 张图片`);
    
    // 创建图片加载Promise数组
    const imageLoadPromises = items.map(item => {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                // 计算长宽比例
                const aspectRatio = img.naturalWidth / img.naturalHeight;
                resolve({
                    ...item,
                    aspectRatio: aspectRatio,
                    width: img.naturalWidth,
                    height: img.naturalHeight
                });
            };
            img.onerror = () => {
                // 加载失败时使用默认比例
                resolve({
                    ...item,
                    aspectRatio: 1.5, // 默认比例
                    width: 300,
                    height: 200
                });
            };
            img.src = item.image;
        });
    });
    
    // 等待所有图片加载完成
    Promise.all(imageLoadPromises).then(itemsWithRatios => {
        // 为了两列竖版布局，我们需要将图片分为左右两列
        // 策略：按照长宽比例交替分配到左右两列，确保两列高度平衡
        
        // 先按长宽比例排序
        itemsWithRatios.sort((a, b) => {
            // 高瘦图片优先（更适合竖版布局）
            const aIsTall = a.aspectRatio < 1.0; // 高瘦图片
            const bIsTall = b.aspectRatio < 1.0;
            
            // 如果一个是高瘦一个不是，高瘦的排在前面
            if (aIsTall && !bIsTall) return -1;
            if (!aIsTall && bIsTall) return 1;
            
            // 如果都是高瘦或都不是高瘦，按比例排序
            return a.aspectRatio - b.aspectRatio;
        });
        
        // 创建左右两列，确保两列高度平衡
        const leftColumn = [];
        const rightColumn = [];
        let leftHeight = 0;
        let rightHeight = 0;
        
        itemsWithRatios.forEach(item => {
            // 计算图片的预估高度（基于固定宽度和长宽比）
            const estimatedHeight = 300 / item.aspectRatio; // 假设每列宽度为300px
            
            // 将图片分配到高度较低的列
            if (leftHeight <= rightHeight) {
                leftColumn.push(item);
                leftHeight += estimatedHeight;
            } else {
                rightColumn.push(item);
                rightHeight += estimatedHeight;
            }
        });
        
        // 合并两列，左列图片在前，右列图片在后
        const optimizedItems = [];
        
        // 交替添加左右两列的图片，保持左右顺序
        const maxLength = Math.max(leftColumn.length, rightColumn.length);
        for (let i = 0; i < maxLength; i++) {
            if (i < leftColumn.length) {
                optimizedItems.push(leftColumn[i]);
            }
            if (i < rightColumn.length) {
                optimizedItems.push(rightColumn[i]);
            }
        }
        
        console.log('图片排序完成，开始渲染两列竖版布局');
        
        // 渲染排序后的图片
        renderSortedItems(optimizedItems, container);
    });
}

// 渲染排序后的图片 - 两列竖版布局
function renderSortedItems(sortedItems, container) {
    sortedItems.forEach((item, index) => {
        const itemElement = document.createElement('div');
        itemElement.className = 'portfolio-item';
        itemElement.style.opacity = '0';
        itemElement.style.transform = 'scale(0.9)';
        itemElement.style.transition = `all 0.6s ease ${index * 0.1}s`;
        
        // 根据图片比例设置不同的样式类
        if (item.aspectRatio < 0.8) {
            itemElement.classList.add('portrait-image');
        } else if (item.aspectRatio > 1.5) {
            itemElement.classList.add('landscape-image');
        }
        
        itemElement.innerHTML = `
            <div class="item-image" style="cursor: zoom-in;">
                <img src="${item.image}" alt="${item.title}" data-aspect-ratio="${item.aspectRatio}">
                <div class="item-overlay">
                    <div class="item-content">
                        <h3>${item.title}</h3>
                        <p>${item.description}</p>
                        <button class="view-btn" onclick="openImageModal('${item.image}', '${item.title}', '${item.description}')">查看大图</button>
                    </div>
                </div>
            </div>
        `;
        
        // 为图片添加加载事件
        const imgElement = itemElement.querySelector('img');
        if (imgElement) {
            imgElement.addEventListener('load', function() {
                this.classList.add('loaded');
                // 调用adjustImageContainerSize函数以应用两列竖版布局
                adjustImageContainerSize(this, itemElement);
            });
            
            // 确保图片可以点击
            imgElement.style.cursor = 'zoom-in';
            imgElement.style.pointerEvents = 'auto';
            imgElement.style.position = 'relative';
            imgElement.style.zIndex = '15';
            
            // 如果图片已经加载完成，立即添加类
            if (imgElement.complete) {
                imgElement.classList.add('loaded');
                // 调用adjustImageContainerSize函数以应用两列竖版布局
                adjustImageContainerSize(imgElement, itemElement);
            }
        }
        
        // 为整个图片容器添加点击事件
        const imageContainer = itemElement.querySelector('.item-image');
        if (imageContainer) {
            imageContainer.style.cursor = 'zoom-in';
            imageContainer.style.pointerEvents = 'auto';
            imageContainer.style.position = 'relative';
            imageContainer.style.zIndex = '15';
            imageContainer.setAttribute('onclick', `openImageModal('${item.image}', '${item.title}', '${item.description}')`);
        }
        
        container.appendChild(itemElement);
        
        // 触发动画
        setTimeout(() => {
            itemElement.style.opacity = '1';
            itemElement.style.transform = 'scale(1)';
        }, 100 + index * 100);
    });
}

// 跳转到指定分类
function navigateToCategory(categoryType) {
    // 找到对应的分类标题并触发点击
    const categoryTitle = document.querySelector(`.category-title[data-category="${categoryType}"]`);
    if (categoryTitle) {
        categoryTitle.click();
        
        // 滚动到AIGC区域
        const aigcSection = document.querySelector('.aigc-section');
        if (aigcSection) {
            aigcSection.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// 获取关于我内容
function getAboutContent() {
    const savedContent = localStorage.getItem('aboutContent');
    if (savedContent) {
        return savedContent;
    }
    
    // 默认内容
    return `<p>我是一名充满激情的视频创作者，专注于通过镜头讲述动人的故事。凭借多年的专业经验和创意视野，我致力于将每个项目打造成独特的视觉体验。</p>
    <p>无论是商业广告、艺术短片还是纪录片，我都用心对待每一个细节，确保作品能够触动观众的心灵。</p>
    <div class="skills">
        <h3>专业技能</h3>
        <div class="skill-tags">
            <span class="skill-tag">视频剪辑</span>
            <span class="skill-tag">调色</span>
            <span class="skill-tag">特效制作</span>
            <span class="skill-tag">摄影</span>
            <span class="skill-tag">剧本创作</span>
        </div>
    </div>`;
}

// 保存关于我内容
function saveAboutContent(content) {
    localStorage.setItem('aboutContent', content);
    updateAboutSection(content);
    
    // 自动同步到服务器
    syncContentToServer();
}

// 更新关于我部分
function updateAboutSection(content) {
    const aboutDiv = document.querySelector("#about > div");
    if (aboutDiv) {
        aboutDiv.innerHTML = content;
    }
}

// 更新联系信息
function updateContactInfo() {
    if (!contentData.contactData) return;
    
    const emailElement = document.getElementById('contact-email');
    const phoneElement = document.getElementById('contact-phone');
    const locationElement = document.getElementById('contact-location');
    
    if (emailElement) {
        emailElement.textContent = contentData.contactData.email || 'yourname@example.com';
    }
    if (phoneElement) {
        phoneElement.textContent = contentData.contactData.phone || '+86 123 4567 8900';
    }
    if (locationElement) {
        locationElement.textContent = contentData.contactData.location || '中国，北京';
    }
}

// 初始化关于我预览
function initAboutPreview() {
    const aboutTextarea = document.getElementById('about-content');
    const aboutPreview = document.getElementById('about-preview');
    
    if (aboutTextarea && aboutPreview) {
        // 实时预览
        aboutTextarea.addEventListener('input', function() {
            aboutPreview.innerHTML = this.value;
        });
    }
}

// 简历侧边栏功能
function toggleResumeSidebar() {
    console.log('toggleResumeSidebar 被调用');
    const sidebar = document.getElementById('resumeSidebar');
    const overlay = document.getElementById('resumeOverlay');
    const toggleBtn = document.getElementById('resumeToggleBtn') || document.querySelector('.resume-toggle');
    const body = document.body;
    
    console.log('找到的元素:', {
        sidebar: !!sidebar,
        overlay: !!overlay,
        toggleBtn: !!toggleBtn,
        sidebarClasses: sidebar ? sidebar.className : 'N/A',
        overlayClasses: overlay ? overlay.className : 'N/A',
        toggleBtnClasses: toggleBtn ? toggleBtn.className : 'N/A'
    });
    
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
            
            console.log('关闭后的状态:', {
                sidebarClasses: sidebar.className,
                overlayClasses: overlay.className,
                toggleBtnClasses: toggleBtn.className
            });
        } else {
            // 打开简历
            console.log('打开简历');
            sidebar.classList.add('open');
            overlay.classList.add('show');
            toggleBtn.classList.add('active');
            body.classList.add('resume-open');
            
            console.log('打开后的状态:', {
                sidebarClasses: sidebar.className,
                overlayClasses: overlay.className,
                toggleBtnClasses: toggleBtn.className
            });
        }
    } catch (error) {
        console.error('切换简历侧边栏时出错:', error);
    }
}

// 保存简历内容
async function saveResumeContent() {
    const resumeContent = document.getElementById('resumeSidebar').innerHTML;
    
    // 保存到本地存储
    localStorage.setItem('resumeContent', resumeContent);
    showNotification('简历内容已保存到本地', 'success');
    console.log('简历内容已保存到本地存储');
    
    // 触发本地数据同步
    if (window.LocalDataSync) {
        setTimeout(() => {
            window.LocalDataSync.manualSync();
        }, 500);
    }
}

// 加载简历内容
async function loadResumeContent() {
    // 从本地存储加载
    const savedContent = localStorage.getItem('resumeContent');
    if (savedContent) {
        const resumeSidebar = document.getElementById('resumeSidebar');
        if (resumeSidebar) {
            resumeSidebar.innerHTML = savedContent;
            console.log('简历内容已从本地存储加载');
        }
    }
}

// IndexedDB辅助函数
function saveToIndexedDB(key, value) {
    if (!window.indexedDB) {
        console.log('IndexedDB不支持');
        return;
    }
    
    const request = indexedDB.open('ResumeDB', 1);
    
    request.onerror = function(event) {
        console.error('IndexedDB打开失败:', event);
    };
    
    request.onupgradeneeded = function(event) {
        const db = event.target.result;
        if (!db.objectStoreNames.contains('resume')) {
            db.createObjectStore('resume');
        }
    };
    
    request.onsuccess = function(event) {
        const db = event.target.result;
        const transaction = db.transaction(['resume'], 'readwrite');
        const store = transaction.objectStore('resume');
        store.put(value, key);
    };
}

function loadFromIndexedDB(key) {
    return new Promise((resolve, reject) => {
        if (!window.indexedDB) {
            reject(new Error('IndexedDB不支持'));
            return;
        }
        
        const request = indexedDB.open('ResumeDB', 1);
        
        request.onerror = function(event) {
            reject(new Error('IndexedDB打开失败'));
        };
        
        request.onsuccess = function(event) {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('resume')) {
                reject(new Error('对象存储不存在'));
                return;
            }
            
            const transaction = db.transaction(['resume'], 'readonly');
            const store = transaction.objectStore('resume');
            const getRequest = store.get(key);
            
            getRequest.onerror = function(event) {
                reject(new Error('获取数据失败'));
            };
            
            getRequest.onsuccess = function(event) {
                resolve(event.target.result);
            };
        };
    });
}

// 生成分享链接
function generateShareLink() {
    const resumeContent = document.getElementById('resumeSidebar').innerHTML;
    const encodedContent = btoa(encodeURIComponent(resumeContent));
    const baseUrl = window.location.origin + window.location.pathname;
    const shareUrl = `${baseUrl}?resume=${encodedContent}&timestamp=${Date.now()}`;
    
    // 复制到剪贴板
    const textArea = document.createElement('textarea');
    textArea.value = shareUrl;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    
    showNotification('分享链接已复制到剪贴板', 'success');
    console.log('分享链接:', shareUrl);
    return shareUrl;
}

// 初始化简历功能
async function initResumeFunctionality() {
    console.log('初始化简历功能');
    
    // 加载简历内容
    try {
        await loadResumeContent();
    } catch (error) {
        console.error('初始化简历功能时出错:', error);
    }
    
    // 加载保存的简历内容
    loadResumeContent();
    
    // 添加分享按钮（如果函数存在）
    if (typeof addShareButton === 'function') {
        addShareButton();
    }
    
    // 简历切换按钮 - 使用ID选择器
    const resumeToggle = document.getElementById('resumeToggleBtn');
    console.log('简历切换按钮:', resumeToggle);
    if (resumeToggle) {
        // 移除可能存在的旧事件监听器
        resumeToggle.removeEventListener('click', toggleResumeSidebar);
        // 添加新的事件监听器
        resumeToggle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('简历按钮被点击');
            toggleResumeSidebar();
        });
        console.log('已添加简历切换按钮事件监听器');
    } else {
        // 备用方案：使用类选择器
        const resumeToggleClass = document.querySelector('.resume-toggle');
        if (resumeToggleClass) {
            resumeToggleClass.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                console.log('简历按钮被点击（备用方案）');
                toggleResumeSidebar();
            });
            console.log('已添加简历切换按钮事件监听器（备用方案）');
        }
    }
    
    // 简历遮罩点击关闭
    const resumeOverlay = document.getElementById('resumeOverlay');
    console.log('简历遮罩:', resumeOverlay);
    if (resumeOverlay) {
        resumeOverlay.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            toggleResumeSidebar();
        });
        console.log('已添加简历遮罩事件监听器');
    }
    
    // ESC键关闭简历
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            const sidebar = document.getElementById('resumeSidebar');
            if (sidebar && sidebar.classList.contains('open')) {
                toggleResumeSidebar();
            }
        }
    });
    
    // 加载保存的简历内容
    loadResumeContent();
}

// 页面加载完成后初始化所有功能
document.addEventListener('DOMContentLoaded', function() {
    // 初始化简历功能
    initResumeFunctionality();
    
    // 初始化关于我内容
    const aboutDiv = document.querySelector("#about > div");
    if (aboutDiv) {
        aboutDiv.innerHTML = getAboutContent();
    }
});

// 确保在页面完全加载后再次初始化简历功能
window.addEventListener('load', function() {
    console.log('页面完全加载，再次初始化简历功能');
    setTimeout(() => {
        initResumeFunctionality();
    }, 500);
});

// 打开图片模态框函数 - 纯图片显示
function openImageModal(imageSrc, title, description) {
    console.log('openImageModal函数被调用:', {imageSrc, title, description});
    
    // 创建模态框HTML - 纯图片显示
    const modalHtml = `
        <div id="imageModal" class="modal" style="display: block; align-items: flex-start; padding-top: 5vh;">
            <div class="modal-content image-modal-content">
                <span class="image-modal-close" onclick="closeImageModal()">&times;</span>
                <div class="image-modal-container">
                    <div class="image-modal-body">
                        <div class="image-modal-image-container" id="modalImageContainer">
                            <div class="image-modal-loading">
                                <i class="fas fa-spinner fa-spin"></i>
                            </div>
                            <img src="${imageSrc}" alt="${title}" id="modalImage" style="max-width: 100vw; max-height: 85vh;" onload="hideImageModalLoading()" onerror="showImageModalError()">
                        </div>
                        <div class="image-modal-actions">
                            <button class="huaban-btn huaban-btn-primary" onclick="downloadImage('${imageSrc}', '${title}')">
                                <i class="fas fa-download"></i> 采集
                            </button>
                            <button class="huaban-btn huaban-btn-secondary" onclick="likeImage()">
                                <i class="fas fa-heart"></i> 喜欢
                            </button>
                            <button class="huaban-btn huaban-btn-secondary" onclick="shareImage()">
                                <i class="fas fa-share"></i> 分享
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // 添加图片缩放功能
    const modalImage = document.getElementById('modalImage');
    const modalImageContainer = document.getElementById('modalImageContainer');
    let isZoomed = false;
    let scale = 1;
    
    // 添加拖动功能变量
    let isDragging = false;
    let startX, startY;
    let translateX = 0, translateY = 0;
    
    // 图片点击缩放
    modalImage.addEventListener('click', function(e) {
        e.stopPropagation();
        if (!isZoomed) {
            scale = 2;
            isZoomed = true;
            modalImage.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
            modalImage.style.cursor = 'move';
        } else {
            scale = 1;
            isZoomed = false;
            translateX = 0;
            translateY = 0;
            modalImage.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
            modalImage.style.cursor = 'zoom-in';
        }
    });
    
    // 鼠标滚轮缩放
    modalImageContainer.addEventListener('wheel', function(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.1 : 0.1;
        scale = Math.min(Math.max(0.5, scale + delta), 3);
        modalImage.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
        isZoomed = scale > 1;
        modalImage.style.cursor = isZoomed ? 'move' : 'zoom-in';
    });
    
    // 鼠标按下事件 - 开始拖动
    modalImage.addEventListener('mousedown', function(e) {
        if (isZoomed) {
            isDragging = true;
            startX = e.clientX - translateX;
            startY = e.clientY - translateY;
            modalImage.style.cursor = 'grabbing';
            e.preventDefault();
        }
    });
    
    // 鼠标移动事件 - 拖动中
    document.addEventListener('mousemove', function(e) {
        if (isDragging && isZoomed) {
            translateX = e.clientX - startX;
            translateY = e.clientY - startY;
            modalImage.style.transform = `scale(${scale}) translate(${translateX}px, ${translateY}px)`;
        }
    });
    
    // 鼠标松开事件 - 结束拖动
    document.addEventListener('mouseup', function() {
        if (isDragging) {
            isDragging = false;
            modalImage.style.cursor = isZoomed ? 'move' : 'zoom-in';
        }
    });
    
    // 添加点击事件监听器
    const modal = document.getElementById('imageModal');
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeImageModal();
        }
    });
    
    // 添加ESC键关闭功能
    const escHandler = (e) => {
        if (e.key === 'Escape') {
            closeImageModal();
            document.removeEventListener('keydown', escHandler);
        }
    };
    document.addEventListener('keydown', escHandler);
}

// 关闭图片模态框函数
function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.opacity = '0';
        modal.style.transform = 'scale(0.9)';
        setTimeout(() => {
            modal.remove();
        }, 300);
    }
}

// 隐藏图片加载状态
function hideImageModalLoading() {
    const loadingElement = document.querySelector('.image-modal-loading');
    if (loadingElement) {
        loadingElement.style.display = 'none';
    }
}

// 显示图片加载错误
function showImageModalError() {
    const loadingElement = document.querySelector('.image-modal-loading');
    if (loadingElement) {
        loadingElement.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <p>图片加载失败</p>
        `;
    }
}

// 下载图片功能
function downloadImage(imageSrc, title) {
    const link = document.createElement('a');
    link.href = imageSrc;
    link.download = `${title}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('图片采集成功');
}

// 喜欢图片功能
function likeImage() {
    const likeBtn = event.target.closest('.huaban-btn');
    const icon = likeBtn.querySelector('i');
    
    if (icon.classList.contains('fas')) {
        icon.classList.remove('fas');
        icon.classList.add('far');
        likeBtn.style.color = '#666';
        showNotification('取消喜欢');
    } else {
        icon.classList.remove('far');
        icon.classList.add('fas');
        likeBtn.style.color = '#e74c3c';
        showNotification('已添加到喜欢');
    }
}

// 分享图片功能
function shareImage() {
    if (navigator.share) {
        navigator.share({
            title: '分享图片',
            text: '查看这张精彩图片',
            url: window.location.href
        }).then(() => {
            showNotification('分享成功');
        }).catch(() => {
            copyToClipboard(window.location.href);
        });
    } else {
        copyToClipboard(window.location.href);
    }
}

// 调整图片容器尺寸以适应两列竖版布局
function adjustImageContainerSize(imgElement, containerElement) {
    // 使用更安全的方式获取aigcGrid元素
    const aigcGrid = document.getElementById('aigcGrid') || document.querySelector('.aigc-grid');
    if (!aigcGrid) {
        console.warn('无法找到aigcGrid元素，跳过图片尺寸调整');
        return;
    }
    
    // 检查是否在摄影或动画分类
    if (!aigcGrid.classList.contains('category-photography') && !aigcGrid.classList.contains('category-animation')) {
        return;
    }
    
    // 添加加载完成的类
    imgElement.classList.add('loaded');
    
    // 确保图片使用自然尺寸，不强制设置高度
    imgElement.style.height = 'auto';
    imgElement.style.maxWidth = '100%';
    
    // 确保容器高度自适应
    if (containerElement) {
        containerElement.style.height = 'auto';
    }
    
    // 简单的淡入效果
    imgElement.style.opacity = '0';
    setTimeout(() => {
        imgElement.style.transition = 'opacity 0.3s ease';
        imgElement.style.opacity = '1';
    }, 100);
}

// 重新绑定图片点击事件
function rebindImageClickEvents() {
    console.log('重新绑定图片点击事件...');
    
    // 查找所有AI摄影作品和AI动画设计的图片
    const images = document.querySelectorAll('.category-photography .aigc-grid .portfolio-item img, .category-animation .aigc-grid .portfolio-item img');
    
    console.log(`找到 ${images.length} 个图片元素`);
    
    images.forEach((img, index) => {
        // 检查是否已有事件监听器
        if (!img.hasAttribute('data-click-bound')) {
            console.log(`为图片 ${index + 1} 绑定点击事件:`, img.alt);
            
            // 添加点击事件监听器
            img.addEventListener('click', function(e) {
                e.stopPropagation();
                e.preventDefault();
                console.log('图片被点击:', img.alt);
                
                // 获取图片信息
                const title = img.alt || '图片';
                const description = img.getAttribute('data-description') || '图片描述';
                
                // 调用openImageModal
                if (typeof openImageModal === 'function') {
                    openImageModal(img.src, title, description);
                } else {
                    console.error('openImageModal函数不存在');
                }
            });
            
            // 标记已绑定事件
            img.setAttribute('data-click-bound', 'true');
        }
    });
}

