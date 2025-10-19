// 获取DOM元素引用
const videoElement = document.getElementById('webcam');
const canvasElement = document.getElementById('outputCanvas');
const canvasCtx = canvasElement.getContext('2d');
const startButton = document.getElementById('startButton');

// 音频和手部追踪相关变量
let synth;
let hands;
let soundEnabled = false;
let lastPlayedNote = null;

// 音阶定义 (从高到低，因为Y=0是屏幕顶部)
const noteScale = ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'];

// 初始化MediaPipe手部追踪
function initializeHandTracking() {
    hands = new Hands({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
    });

    hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
    });

    hands.onResults(onResults);
}

// 处理手部追踪结果
function onResults(results) {
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // 水平翻转画布以实现镜像效果
    canvasCtx.scale(-1, 1);
    canvasCtx.translate(-canvasElement.width, 0);

    // 绘制视频帧
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // 如果检测到手部关键点，绘制它们
    if (results.multiHandLandmarks) {
        for (const landmarks of results.multiHandLandmarks) {
            drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS, {
                color: '#00FF00', 
                lineWidth: 5
            });
            drawLandmarks(canvasCtx, landmarks, {
                color: '#FF0000', 
                lineWidth: 2
            });
        }
    }

    canvasCtx.restore();

    // 音频控制逻辑
    if (soundEnabled) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            // 关键点8是食指指尖
            const indexFingerTip = results.multiHandLandmarks[0][8];
            const yPos = indexFingerTip.y; // 标准化值，0.0(顶部)到1.0(底部)
            
            // 将Y位置映射到音阶中的音符
            const noteIndex = Math.min(Math.floor(yPos * noteScale.length), noteScale.length - 1);
            const currentNote = noteScale[noteIndex];

            // 只有当音符与上一个不同时才播放
            if (currentNote && currentNote !== lastPlayedNote) {
                synth.triggerAttack(currentNote);
                lastPlayedNote = currentNote;
            }
        } else {
            // 如果没有检测到手部，释放音符
            if (lastPlayedNote !== null) {
                synth.triggerRelease();
                lastPlayedNote = null;
            }
        }
    }

    // 绘制音阶UI
    drawScaleUI();
}

// 绘制音阶用户界面
function drawScaleUI() {
    canvasCtx.save();
    
    // 设置字体样式
    canvasCtx.font = "24px Arial";
    canvasCtx.textAlign = "left";
    canvasCtx.textBaseline = "middle";

    noteScale.forEach((note, index) => {
        const y = (index + 0.5) * (canvasElement.height / noteScale.length);
        
        // 高亮当前播放的音符
        if (note === lastPlayedNote) {
            canvasCtx.fillStyle = '#FFD700'; // 金色高亮
            canvasCtx.font = "bold 28px Arial";
            // 绘制背景圆圈
            canvasCtx.beginPath();
            canvasCtx.arc(40, y, 20, 0, 2 * Math.PI);
            canvasCtx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            canvasCtx.fill();
            canvasCtx.fillStyle = '#FFD700';
        } else {
            canvasCtx.fillStyle = 'white';
            canvasCtx.font = "24px Arial";
        }
        
        canvasCtx.fillText(note, 20, y);
    });

    // 绘制音阶指示线
    canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    canvasCtx.lineWidth = 1;
    for (let i = 0; i <= noteScale.length; i++) {
        const y = i * (canvasElement.height / noteScale.length);
        canvasCtx.beginPath();
        canvasCtx.moveTo(80, y);
        canvasCtx.lineTo(canvasElement.width - 20, y);
        canvasCtx.stroke();
    }

    canvasCtx.restore();
}

// 检查必要的库是否已加载
function checkLibrariesLoaded() {
    const missingLibraries = [];
    
    if (typeof Tone === 'undefined') {
        missingLibraries.push('Tone.js');
    }
    
    if (typeof Hands === 'undefined') {
        missingLibraries.push('MediaPipe Hands');
    }
    
    if (typeof Camera === 'undefined') {
        missingLibraries.push('MediaPipe Camera Utils');
    }
    
    if (typeof drawConnectors === 'undefined') {
        missingLibraries.push('MediaPipe Drawing Utils');
    }
    
    return missingLibraries;
}

// 初始化音频合成器
async function initializeAudio() {
    // 检查Tone.js是否可用
    if (typeof Tone === 'undefined') {
        throw new Error('Tone.js 库未加载。请刷新页面重试。');
    }
    
    try {
        await Tone.start();
        synth = new Tone.Synth({
            oscillator: { type: 'sine' },
            envelope: { 
                attack: 0.1, 
                decay: 0.2, 
                sustain: 0.5, 
                release: 0.5 
            }
        }).toDestination();
        soundEnabled = true;
        console.log('音频上下文已启动，合成器已创建');
    } catch (error) {
        console.error('音频初始化失败:', error);
        throw new Error('音频系统初始化失败: ' + error.message);
    }
}

// 检查摄像头权限
async function checkCameraPermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                width: 640, 
                height: 480,
                facingMode: 'user' // 前置摄像头
            } 
        });
        // 立即停止测试流
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.error('摄像头权限检查失败:', error);
        return false;
    }
}

// 显示错误信息
function showError(message, details = '') {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.innerHTML = `
        <h3>⚠️ 启动失败</h3>
        <p>${message}</p>
        ${details ? `<p class="error-details">${details}</p>` : ''}
        <button onclick="this.parentElement.remove()">关闭</button>
    `;
    
    // 插入到容器中
    const container = document.querySelector('.container');
    container.appendChild(errorDiv);
    
    // 显示开始按钮
    startButton.style.display = 'block';
}

// 启动按钮事件监听器
startButton.addEventListener('click', async () => {
    try {
        // 更新按钮状态
        startButton.textContent = '正在启动...';
        startButton.disabled = true;
        
        // 检查必要的库是否已加载
        console.log('检查库依赖...');
        const missingLibraries = checkLibrariesLoaded();
        
        if (missingLibraries.length > 0) {
            throw new Error(`以下库未加载: ${missingLibraries.join(', ')}。请刷新页面重试。`);
        }
        
        console.log('所有必要的库都已加载');
        
        // 检查摄像头权限
        console.log('检查摄像头权限...');
        const hasPermission = await checkCameraPermission();
        
        if (!hasPermission) {
            throw new Error('摄像头访问被拒绝或不可用');
        }
        
        console.log('摄像头权限检查通过');
        
        // 初始化音频
        console.log('初始化音频系统...');
        await initializeAudio();
        
        // 初始化手部追踪
        console.log('初始化手部追踪...');
        initializeHandTracking();
        
        // 启动摄像头
        console.log('启动摄像头...');
        const camera = new Camera(videoElement, {
            onFrame: async () => {
                await hands.send({image: videoElement});
            },
            width: 640,
            height: 480
        });
        
        await camera.start();
        
        // 成功启动
        startButton.style.display = 'none';
        console.log('应用程序已成功启动');
        
        // 显示成功提示
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <h3>✅ 启动成功！</h3>
            <p>现在您可以将手伸到摄像头前开始演奏了！</p>
            <button onclick="this.parentElement.remove()">开始演奏</button>
        `;
        document.querySelector('.container').appendChild(successDiv);
        
    } catch (error) {
        console.error('启动应用程序时出错:', error);
        
        // 重置按钮状态
        startButton.textContent = '重新开始';
        startButton.disabled = false;
        
        // 根据错误类型显示不同的错误信息
        if (error.name === 'NotAllowedError') {
            showError(
                '摄像头访问被拒绝',
                '请在浏览器地址栏中点击摄像头图标，选择"允许"访问摄像头，然后重新点击开始按钮。'
            );
        } else if (error.name === 'NotFoundError') {
            showError(
                '未找到摄像头设备',
                '请确保您的设备已连接摄像头，并且没有被其他应用程序使用。'
            );
        } else if (error.name === 'NotReadableError') {
            showError(
                '摄像头被占用',
                '请关闭其他正在使用摄像头的应用程序（如视频通话软件），然后重试。'
            );
        } else if (error.message.includes('Tone.js') || error.message.includes('库未加载')) {
            showError(
                '库加载失败',
                error.message + ' 请检查网络连接或刷新页面重试。'
            );
        } else if (error.message.includes('音频')) {
            showError(
                '音频系统错误',
                error.message + ' 请检查浏览器音频权限设置。'
            );
        } else if (error.message.includes('摄像头')) {
            showError(
                '摄像头问题',
                error.message + ' 请检查您的摄像头设置并重试。'
            );
        } else {
            showError(
                '启动失败',
                error.message || '发生了未知错误。请刷新页面后重试，或检查浏览器控制台获取更多信息。'
            );
        }
    }
});

// 页面加载完成后的初始化
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎭 音空手舞已加载');
});
