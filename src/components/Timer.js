export class Timer {
    constructor(duration, onComplete) {
        this.initialDuration = duration;
        this.remaining = duration;
        this.onComplete = onComplete;
        this.intervalId = null;
        this.isRunning = false;
        this.element = null;
    }

    render(container) {
        this.element = document.createElement('div');
        this.element.className = 'timer-container';
        this.updateDisplay();

        const controls = document.createElement('div');
        controls.className = 'timer-controls';

        this.startBtn = document.createElement('button');
        this.startBtn.className = 'btn btn-primary';
        this.startBtn.textContent = 'スタート';
        this.startBtn.onclick = () => this.toggle();

        this.resetBtn = document.createElement('button');
        this.resetBtn.className = 'btn btn-secondary';
        this.resetBtn.textContent = 'リセット';
        this.resetBtn.onclick = () => this.reset();

        controls.appendChild(this.startBtn);
        controls.appendChild(this.resetBtn);

        this.element.appendChild(controls);
        container.appendChild(this.element);
    }

    toggle() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
    }

    start() {
        if (this.remaining <= 0) return;

        this.isRunning = true;
        this.startBtn.textContent = '一時停止';

        this.intervalId = setInterval(() => {
            this.remaining--;
            this.updateDisplay();

            if (this.remaining <= 0) {
                this.complete();
            }
        }, 1000);
    }

    pause() {
        this.isRunning = false;
        this.startBtn.textContent = '再開';
        clearInterval(this.intervalId);
    }

    reset() {
        this.pause();
        this.remaining = this.initialDuration;
        this.startBtn.textContent = 'スタート';
        this.updateDisplay();
    }

    complete() {
        this.pause();
        this.startBtn.textContent = '完了';
        if (this.onComplete) this.onComplete();

        // Simple notification sound or vibration could be added here
        if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    }

    updateDisplay() {
        if (!this.element) return;

        const minutes = Math.floor(this.remaining / 60);
        const seconds = this.remaining % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        // Update existing display or create new
        let display = this.element.querySelector('.timer-display');
        if (!display) {
            display = document.createElement('div');
            display.className = 'timer-display';
            this.element.prepend(display);
        }
        display.textContent = timeString;
    }
}
