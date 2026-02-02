const configPanel = document.getElementById('configPanel');
const appHeader = document.getElementById('appHeader');
const toggleConfigBtn = document.getElementById('toggleConfig');
const closeConfigBtn = document.getElementById('closeConfigBtn');
const sourceText = document.getElementById('sourceText');
const typingArea = document.getElementById('output');
const startBtn = document.getElementById('startBtn');
const pauseBtn = document.getElementById('pauseBtn');
const resetBtn = document.getElementById('resetBtn');
const typingSpeedInput = document.getElementById('typingSpeed');
const speedValue = document.getElementById('speedValue');
const mistakeRateInput = document.getElementById('mistakeRate');
const mistakeValue = document.getElementById('mistakeValue');
const copyBtn = document.getElementById('copyBtn');

const fontSelect = document.getElementById('fontSelect');
const themeSelect = document.getElementById('themeSelect');
const windowStyleSelect = document.getElementById('windowStyleSelect');
const fontSizeInput = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const marginLeftInput = document.getElementById('marginLeft');
const marginLeftValue = document.getElementById('marginLeftValue');
const marginRightInput = document.getElementById('marginRight');
const marginRightValue = document.getElementById('marginRightValue');
const soundEnabledInput = document.getElementById('soundEnabled');
const soundVolumeInput = document.getElementById('soundVolume');
const volumeValue = document.getElementById('volumeValue');
const appContainer = document.querySelector('.app-container');
const outputContainer = document.querySelector('.output-container');

// Audio Context
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

let isTyping = false;
let currentPos = 0;
let fullText = "";
let timeoutId = null;

// Font & Theme
fontSelect.addEventListener('change', () => {
    document.documentElement.style.setProperty('--font-mono', fontSelect.value);
});

themeSelect.addEventListener('change', () => {
    appContainer.setAttribute('data-theme', themeSelect.value);
});

// Toggle Settings
toggleConfigBtn.addEventListener('click', () => {
    configPanel.classList.toggle('hidden');
});

closeConfigBtn.addEventListener('click', () => {
    configPanel.classList.add('hidden');
});

// Hotkeys
window.addEventListener('keydown', (e) => {
    // Alt + S to Start
    if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        startBtn.click();
    }
    // Alt + P to Pause
    if (e.altKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        pauseBtn.click();
    }
    // Escape to toggle settings
    if (e.key === 'Escape') {
        e.preventDefault();
        toggleConfigBtn.click();
    }

    // Spacebar to Toggle Start/Pause
    if (e.code === 'Space' || e.key === ' ') {
        // Prevent if typing in inputs
        if (document.activeElement.tagName === 'TEXTAREA' || 
            document.activeElement.tagName === 'INPUT') {
            return;
        }

        e.preventDefault(); // Prevent scrolling
        if (isTyping) {
            pauseBtn.click();
        } else {
            startBtn.click();
        }
    }
});

// Update UI labels
typingSpeedInput.addEventListener('input', () => {
    speedValue.innerText = `${typingSpeedInput.value}ms`;
});

mistakeRateInput.addEventListener('input', () => {
    mistakeValue.innerText = `${mistakeRateInput.value}%`;
});

fontSizeInput.addEventListener('input', () => {
    fontSizeValue.innerText = `${fontSizeInput.value}px`;
    document.documentElement.style.setProperty('--font-size', `${fontSizeInput.value}px`);
});

marginLeftInput.addEventListener('input', () => {
    marginLeftValue.innerText = `${marginLeftInput.value}%`;
    document.documentElement.style.setProperty('--margin-left', `${marginLeftInput.value}%`);
});

marginRightInput.addEventListener('input', () => {
    marginRightValue.innerText = `${marginRightInput.value}%`;
    document.documentElement.style.setProperty('--margin-right', `${marginRightInput.value}%`);
});

windowStyleSelect.addEventListener('change', () => {
    const displayPanel = document.querySelector('.display-panel');
    displayPanel.setAttribute('data-style', windowStyleSelect.value);
});

soundVolumeInput.addEventListener('input', () => {
    volumeValue.innerText = `${soundVolumeInput.value}%`;
});

function playKeySound() {
    if (!soundEnabledInput.checked) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    const volume = parseInt(soundVolumeInput.value) / 100;

    // "Thock" sound synthesis
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(150, t); // Lower pitch for "mechanical" feel
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.08); // Pitch drop

    // Envelope
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(volume * 0.5, t + 0.01); // Attack
    gainNode.gain.exponentialRampToValueAtTime(0.001, t + 0.1); // Decay

    osc.start(t);
    osc.stop(t + 0.1);

    // Connect nodes
    osc.connect(gainNode).connect(audioCtx.destination);
    
    // Add a subtle high-freq click for texture
    const clickOsc = audioCtx.createOscillator();
    const clickGain = audioCtx.createGain();
    
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(2000, t);
    clickOsc.frequency.exponentialRampToValueAtTime(100, t + 0.02);
    
    clickGain.gain.setValueAtTime(0, t);
    clickGain.gain.linearRampToValueAtTime(volume * 0.1, t + 0.001);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
    
    clickOsc.start(t);
    clickOsc.stop(t + 0.03);
    
    clickOsc.connect(clickGain).connect(audioCtx.destination);
}

const sleep = (ms) => new Promise(resolve => timeoutId = setTimeout(resolve, ms));

async function typeChar() {
    if (!isTyping || currentPos >= fullText.length) {
        if (currentPos >= fullText.length) {
            isTyping = false;
            startBtn.disabled = false;
            pauseBtn.disabled = true;
        }
        return;
    }

    const char = fullText[currentPos];
    const baseSpeed = parseInt(typingSpeedInput.value);
    const mistakeRate = parseInt(mistakeRateInput.value) / 100;

    // Randomize speed slightly (humanized)
    const delay = baseSpeed + (Math.random() * baseSpeed * 0.5) - (baseSpeed * 0.25);

    // Roll for a mistake
    if (Math.random() < mistakeRate && char !== '\n' && char !== ' ') {
        // Make a mistake
        const alphabet = "abcdefghijklmnopqrstuvwxyz";
        const randomChar = alphabet[Math.floor(Math.random() * alphabet.length)];
        
        typingArea.textContent += randomChar;
        await sleep(delay * 2);
        
        // Backspace
        typingArea.textContent = typingArea.textContent.slice(0, -1);
        playKeySound(); // Play sound on backspace too
        await sleep(delay * 1.5);
    }

    // Type the correct character
    typingArea.textContent += char;
    playKeySound(); // Play sound on type
    currentPos++;
    
    // Auto scroll to bottom
    outputContainer.scrollTop = outputContainer.scrollHeight;

    // Extra delay for punctuation or new lines
    let extraDelay = 0;
    if (char === '.' || char === '?' || char === '!') extraDelay = delay * 4;
    else if (char === ',') extraDelay = delay * 2;
    else if (char === '\n') extraDelay = delay * 6;

    await sleep(delay + extraDelay);
    typeChar();
}

startBtn.addEventListener('click', () => {
    if (!isTyping) {
        if (currentPos === 0) {
            // Clean text more aggressively: remove all leading whitespace/tabs and normalize lines
            fullText = sourceText.value.replace(/^\s+/, '').split(/\r?\n/).map(line => line.trim()).join('\n');
            typingArea.textContent = "";
            // Auto hide settings when typing starts
            configPanel.classList.add('hidden');
        }
        isTyping = true;
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        typeChar();
    }
});

pauseBtn.addEventListener('click', () => {
    isTyping = false;
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    clearTimeout(timeoutId);
});

resetBtn.addEventListener('click', () => {
    isTyping = false;
    currentPos = 0;
    typingArea.textContent = "";
    startBtn.disabled = false;
    pauseBtn.disabled = true;
    clearTimeout(timeoutId);
});

copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(typingArea.textContent);
    const originalText = copyBtn.innerText;
    copyBtn.innerText = "Copied!";
    setTimeout(() => copyBtn.innerText = originalText, 2000);
});
