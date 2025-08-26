class AudioManager {
  constructor() {
    this.audioContext = null;
    this.backgroundMusic = null;
    this.narrationAudio = null;
    this.isPlaying = false;
    this.currentLanguage = 'en';
    this.volume = 0.7;
    this.isMuted = false;
    
    this.init();
  }

  init() {
    // Initialize Web Audio API
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported, falling back to HTML5 audio');
    }
    
    this.createAudioControls();
    this.loadSettings();
  }

  createAudioControls() {
    const controlsHTML = `
      <div id="audio-controls" style="
        position: fixed;
        top: 20px;
        left: 20px;
        background: rgba(44, 95, 45, 0.9);
        padding: 15px;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 10px;
        backdrop-filter: blur(10px);
      ">
        <button id="play-pause-btn" style="
          background: #FFB067;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s;
        ">
          <span id="play-icon">▶</span>
        </button>
        
        <button id="mute-btn" style="
          background: transparent;
          border: 2px solid #FFB067;
          color: #FFB067;
          border-radius: 50%;
          width: 35px;
          height: 35px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span id="volume-icon">🔊</span>
        </button>
        
        <input type="range" id="volume-slider" min="0" max="1" step="0.1" value="0.7" style="
          width: 80px;
          accent-color: #FFB067;
        ">
        
        <select id="audio-selector" style="
          background: #97B270;
          border: none;
          border-radius: 5px;
          padding: 5px;
          color: white;
        ">
          <option value="narration">Narration</option>
          <option value="background">Background Music</option>
        </select>
      </div>
    `;
    
    document.body.insertAdjacentHTML('afterbegin', controlsHTML);
    this.attachEventListeners();
  }

  attachEventListeners() {
    const playPauseBtn = document.getElementById('play-pause-btn');
    const muteBtn = document.getElementById('mute-btn');
    const volumeSlider = document.getElementById('volume-slider');
    const audioSelector = document.getElementById('audio-selector');

    playPauseBtn.addEventListener('click', () => this.togglePlayPause());
    muteBtn.addEventListener('click', () => this.toggleMute());
    volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
    audioSelector.addEventListener('change', (e) => this.switchAudioType(e.target.value));
  }

  loadNarration(storyName, language) {
    const audioPath = `assets/audio/${storyName}-${language}.mp3`;
    this.narrationAudio = new Audio(audioPath);
    this.narrationAudio.volume = this.volume;
    
    this.narrationAudio.addEventListener('ended', () => {
      this.isPlaying = false;
      this.updatePlayButton();
    });
    
    this.narrationAudio.addEventListener('error', () => {
      console.warn(`Audio file not found: ${audioPath}`);
      // Fallback to text-to-speech or silent mode
    });
  }

  loadBackgroundMusic() {
    const musicPath = 'assets/audio/background-islamic.mp3';
    this.backgroundMusic = new Audio(musicPath);
    this.backgroundMusic.loop = true;
    this.backgroundMusic.volume = this.volume * 0.3; // Lower volume for background
  }

  togglePlayPause() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  play() {
    if (document.getElementById('audio-selector').value === 'narration' && this.narrationAudio) {
      this.narrationAudio.play().catch(e => console.warn('Audio play failed:', e));
    } else if (this.backgroundMusic) {
      this.backgroundMusic.play().catch(e => console.warn('Background music play failed:', e));
    }
    this.isPlaying = true;
    this.updatePlayButton();
  }

  pause() {
    if (this.narrationAudio) this.narrationAudio.pause();
    if (this.backgroundMusic) this.backgroundMusic.pause();
    this.isPlaying = false;
    this.updatePlayButton();
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    const newVolume = this.isMuted ? 0 : this.volume;
    
    if (this.narrationAudio) this.narrationAudio.volume = newVolume;
    if (this.backgroundMusic) this.backgroundMusic.volume = this.isMuted ? 0 : newVolume * 0.3;
    
    this.updateMuteButton();
  }

  setVolume(value) {
    this.volume = parseFloat(value);
    this.isMuted = false;
    
    if (this.narrationAudio) this.narrationAudio.volume = this.volume;
    if (this.backgroundMusic) this.backgroundMusic.volume = this.volume * 0.3;
    
    this.saveSettings();
    this.updateMuteButton();
  }

  switchAudioType(type) {
    this.pause();
    if (type === 'narration') {
      this.loadBackgroundMusic();
    }
  }

  updatePlayButton() {
    const playIcon = document.getElementById('play-icon');
    playIcon.textContent = this.isPlaying ? '⏸' : '▶';
  }

  updateMuteButton() {
    const volumeIcon = document.getElementById('volume-icon');
    volumeIcon.textContent = this.isMuted ? '🔇' : '🔊';
  }

  saveSettings() {
    localStorage.setItem('audioSettings', JSON.stringify({
      volume: this.volume,
      isMuted: this.isMuted,
      language: this.currentLanguage
    }));
  }

  loadSettings() {
    const saved = localStorage.getItem('audioSettings');
    if (saved) {
      const settings = JSON.parse(saved);
      this.volume = settings.volume || 0.7;
      this.isMuted = settings.isMuted || false;
      this.currentLanguage = settings.language || 'en';
      
      document.getElementById('volume-slider').value = this.volume;
    }
  }

  setLanguage(language) {
    this.currentLanguage = language;
    this.saveSettings();
  }

  destroy() {
    this.pause();
    const controls = document.getElementById('audio-controls');
    if (controls) controls.remove();
  }
}

// Initialize audio manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.audioManager = new AudioManager();
});
