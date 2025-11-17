// 全局变量
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const scoreDisplay = document.getElementById('scoreDisplay');
const scoreDesc = document.getElementById('scoreDesc');
const scoreCard = document.getElementById('scoreCard');
const albumBtn = document.getElementById('albumBtn');
const passwordModal = document.getElementById('passwordModal');
const passwordInput = document.getElementById('passwordInput');
const verifyBtn = document.getElementById('verifyBtn');
const album = document.getElementById('album');
const closeAlbum = document.getElementById('closeAlbum');
const photoList = document.getElementById('photoList');
const photoNum = document.getElementById('photoNum');
const countdown = document.getElementById('countdown');
const correctPassword = '1433223';
let photoCount = 0; // 连拍计数
let videoWidth = 0;
let videoHeight = 0;
let photoTimer; // 连拍定时器

// 1. 初始化摄像头（确保尺寸同步）
async function initCamera() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;

        // 等视频元数据加载完成，获取真实尺寸
        video.onloadedmetadata = () => {
            videoWidth = video.videoWidth;
            videoHeight = video.videoHeight;
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            console.log('摄像头初始化成功，尺寸：', videoWidth, 'x', videoHeight);
        };

        // 初始化显示已保存照片数
        updatePhotoCount();
    } catch (err) {
        alert('请允许摄像头权限！否则无法使用检测功能');
        console.error('摄像头权限错误：', err);
    }
}

// 2. 拍照并保存（确保连拍5张）
function takePhoto() {
    // 显示倒计时
    countdown.classList.remove('hidden');
    countdown.textContent = 5 - photoCount;

    // 确保canvas尺寸正确
    if (videoWidth > 0 && videoHeight > 0) {
        canvas.width = videoWidth;
        canvas.height = videoHeight;
        ctx.drawImage(video, 0, 0, videoWidth, videoHeight);
    } else {
        ctx.drawImage(video, 0, 0, video.clientWidth, video.clientHeight);
    }

    // 无压缩保存照片
    const photoData = canvas.toDataURL('image/png', 1.0);
    let photos = JSON.parse(localStorage.getItem('faceDetectPhotos')) || [];
    photos.push(photoData);
    localStorage.setItem('faceDetectPhotos', JSON.stringify(photos));
    console.log('照片保存成功，当前共', photos.length, '张');

    // 更新已拍照片数
    updatePhotoCount();

    // 隐藏倒计时（单张拍摄完成）
    setTimeout(() => {
        countdown.classList.add('hidden');
    }, 500);

    photoCount++;
    if (photoCount >= 5) {
        clearInterval(photoTimer); // 停止连拍
        photoCount = 0;
        startBtn.disabled = false;
        startBtn.textContent = '<i class="fas fa-redo"></i> 重新检测（自动连拍5张）';
        // 生成评分并显示
        generateScore();
    }
}

// 3. 开始检测（修复连拍逻辑）
startBtn.addEventListener('click', () => {
    if (!video.srcObject) {
        alert('摄像头未初始化完成，请稍后再试！');
        return;
    }

    // 重置状态
    scoreCard.classList.add('hidden');
    startBtn.disabled = true;
    startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 检测中...';
    photoCount = 0;

    // 首次拍照延迟300ms，后续每秒1张，共5张
    setTimeout(() => {
        takePhoto();
        // 后续4张照片（总5张）
        photoTimer = setInterval(takePhoto, 1000);
    }, 300);
});

// 4. 生成随机评分+对应文案
function generateScore() {
    const score = Math.floor(Math.random() * 100) + 1;
    scoreDisplay.textContent = `${score}分`;

    // 根据分数显示不同文案
    if (score >= 90) {
        scoreDesc.textContent = '神仙颜值！颜值天花板级别～';
        scoreDisplay.style.color = '#e53e3e';
    } else if (score >= 80) {
        scoreDesc.textContent = '超高颜值！回头率爆表～';
        scoreDisplay.style.color = '#ed8936';
    } else if (score >= 70) {
        scoreDesc.textContent = '高颜值！很有魅力哦～';
        scoreDisplay.style.color = '#48bb78';
    } else if (score >= 60) {
        scoreDesc.textContent = '清秀佳人！耐看型选手～';
        scoreDisplay.style.color = '#4299e1';
    } else {
        scoreDesc.textContent = '普通路人！自信的你最帅/最美～';
        scoreDisplay.style.color = '#9f7aea';
    }

    // 显示评分卡片
    scoreCard.classList.remove('hidden');
}

// 5. 相册密码验证
albumBtn.addEventListener('click', () => {
    passwordModal.classList.remove('hidden');
});

verifyBtn.addEventListener('click', () => {
    if (passwordInput.value === correctPassword) {
        passwordModal.classList.add('hidden');
        album.classList.remove('hidden');
        renderPhotos();
        passwordInput.value = '';
    } else {
        alert('密码错误！请重新输入');
        passwordInput.value = '';
    }
});

// 6. 关闭相册
closeAlbum.addEventListener('click', () => {
    album.classList.add('hidden');
});

// 7. 渲染相册照片（带删除功能）
function renderPhotos() {
    photoList.innerHTML = '';
    const photos = JSON.parse(localStorage.getItem('faceDetectPhotos')) || [];
    
    if (photos.length === 0) {
        photoList.innerHTML = '<p style="color:#718096;font-size:18px;margin:30px 0;"><i class="fas fa-image"></i> 暂无照片～ 快去检测吧！</p>';
        document.getElementById('clearAllBtn')?.remove();
        return;
    }

    // 遍历渲染照片
    photos.forEach((photoData, index) => {
        const photoItem = document.createElement('div');
        photoItem.className = 'photo-item';

        const img = document.createElement('img');
        img.src = photoData;
        img.alt = `颜值检测照片 ${index + 1}`;
        img.title = `点击查看大图（${index + 1}/${photos.length}）`;
        
        img.onload = () => console.log('照片渲染成功：', index + 1);
        img.onerror = () => {
            console.error('照片加载失败，索引：', index);
            img.alt = '照片加载失败';
            img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        };

        // 预览大图
        img.addEventListener('click', () => previewPhoto(photoData));
        
        // 删除按钮
        const deleteBtn = document.createElement('span');
        deleteBtn.className = 'delete-photo';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.title = '删除这张照片';
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteSinglePhoto(index);
        });

        photoItem.appendChild(img);
        photoItem.appendChild(deleteBtn);
        photoList.appendChild(photoItem);
    });

    // 添加清空按钮
    if (!document.getElementById('clearAllBtn')) {
        const clearAllBtn = document.createElement('button');
        clearAllBtn.id = 'clearAllBtn';
        clearAllBtn.innerHTML = '<i class="fas fa-trash-alt"></i> 清空全部照片';
        clearAllBtn.addEventListener('click', clearAllPhotos);
        photoList.appendChild(clearAllBtn);
    }
}

// 8. 照片预览功能
function previewPhoto(photoData) {
    const previewModal = document.createElement('div');
    previewModal.className = 'preview-modal';
    
    const previewImg = document.createElement('img');
    previewImg.className = 'preview-img';
    previewImg.src = photoData;
    
    const closePreview = document.createElement('span');
    closePreview.className = 'close-preview';
    closePreview.innerHTML = '<i class="fas fa-times"></i>';
    closePreview.addEventListener('click', () => {
        document.body.removeChild(previewModal);
    });
    
    previewModal.appendChild(previewImg);
    previewModal.appendChild(closePreview);
    document.body.appendChild(previewModal);
}

// 9. 单张照片删除
function deleteSinglePhoto(index) {
    if (confirm('确定要删除这张照片吗？删除后无法恢复！')) {
        let photos = JSON.parse(localStorage.getItem('faceDetectPhotos')) || [];
        photos.splice(index, 1);
        localStorage.setItem('faceDetectPhotos', JSON.stringify(photos));
        renderPhotos();
        updatePhotoCount();
        console.log('已删除第', index + 1, '张照片');
    }
}

// 10. 清空全部照片
function clearAllPhotos() {
    const photos = JSON.parse(localStorage.getItem('faceDetectPhotos')) || [];
    if (photos.length === 0) {
        alert('暂无照片可清空！');
        return;
    }
    if (confirm(`确定要清空全部${photos.length}张照片吗？删除后无法恢复！`)) {
        localStorage.removeItem('faceDetectPhotos');
        renderPhotos();
        updatePhotoCount();
        alert('已清空全部照片！');
    }
}

// 11. 更新已拍照片数
function updatePhotoCount() {
    const photos = JSON.parse(localStorage.getItem('faceDetectPhotos')) || [];
    photoNum.textContent = photos.length;
}

// 页面加载初始化
window.addEventListener('load', initCamera);

// 调试用：清空照片（控制台执行）
function clearPhotos() {
    localStorage.removeItem('faceDetectPhotos');
    updatePhotoCount();
    alert('已清空所有照片！');
}