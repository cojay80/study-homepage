class SoundManager {
    constructor() {
        this.bgm = null;
        this.sfx = {};
        this.muted = false;
    }

    playBGM(url) {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm = null;
        }
        this.bgm = new Audio(url);
        this.bgm.loop = true;
        this.bgm.volume = 0.3; // Lower volume for background
        if (!this.muted) {
            this.bgm.play().catch(e => console.log("Audio play failed (user interaction required):", e));
        }
    }

    stopBGM() {
        if (this.bgm) {
            this.bgm.pause();
            this.bgm.currentTime = 0;
        }
    }

    playSFX(url) {
        if (this.muted) return;
        const audio = new Audio(url);
        audio.volume = 0.6;
        audio.play().catch(e => console.log("SFX play failed:", e));
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.bgm) {
            this.bgm.muted = this.muted;
        }
        return this.muted;
    }
}

export const soundManager = new SoundManager();

// Google Sounds (Public Domain)
export const SOUNDS = {
    BGM_LOBBY: 'https://actions.google.com/sounds/v1/ambiences/fairyland.ogg',
    SFX_CORRECT: 'https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg',
    SFX_WRONG: 'https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg',
    SFX_CLICK: 'https://actions.google.com/sounds/v1/cartoon/pop.ogg'
};
