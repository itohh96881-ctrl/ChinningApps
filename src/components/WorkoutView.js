import { Timer } from './Timer.js';

export class WorkoutView {
    constructor(navigation, tracker) {
        this.navigation = navigation;
        this.tracker = tracker;
        this.currentStep = null;
        this.currentSet = 1;
    }

    render(container, params) {
        this.currentStep = params.step;
        this.currentSet = 1;

        const section = document.createElement('section');
        section.className = 'workout-view fade-in';

        // Header
        const header = document.createElement('div');
        header.className = 'view-header';
        header.innerHTML = `
      <button class="back-btn">← 戻る</button>
      <h2>Level ${this.currentStep.level}</h2>
    `;
        header.querySelector('.back-btn').onclick = () => this.navigation.navigate('home');
        section.appendChild(header);

        // Content
        const content = document.createElement('div');
        content.className = 'workout-content';
        content.innerHTML = `
      <h3 class="step-title-large">${this.currentStep.title}</h3>
      <div class="target-display">
        <div class="target-main">
          <span class="val">${this.currentStep.target.value}</span>
          <span class="unit">${this.currentStep.target.unit}</span>
        </div>
        <div class="sets-display">
          Set <span id="current-set">${this.currentSet}</span> / ${this.currentStep.sets}
        </div>
      </div>
      <p class="workout-instruction">${this.currentStep.description}</p>
    `;

        // Action Area
        const actionArea = document.createElement('div');
        actionArea.className = 'action-area';
        this.renderStartButton(actionArea);

        content.appendChild(actionArea);
        section.appendChild(content);
        container.appendChild(section);
    }

    renderStartButton(container) {
        container.innerHTML = '';
        const startBtn = document.createElement('button');
        startBtn.className = 'btn btn-large btn-primary';
        startBtn.textContent = 'トレーニング開始 (Start)';
        startBtn.onclick = () => this.handleStartSet(container);
        container.appendChild(startBtn);
    }

    handleStartSet(container) {
        // Prepare UI for "In Progress"
        container.innerHTML = '';

        // If time-based (e.g. Hanging), show a timer
        // If count-based, just show "Finish" button

        if (this.currentStep.target.type === 'time') {
            const duration = this.currentStep.target.value;
            // Create a temporary timer display inside the target area or just action area?
            // Let's replace the large target value with the timer for better visibility
            const targetValEl = document.querySelector('.target-main .val');
            const originalVal = targetValEl ? targetValEl.textContent : '';

            this.activeTimer = new Timer(duration, () => {
                // Time up
                if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
                this.renderFinishButton(container); // Allow user to manually click finish to proceed to rest
                if (targetValEl) targetValEl.textContent = "00:00"; // Or restore
            });

            // Render timer string into the target value element manually (Timer class renders full UI)
            // Actually Timer class creates a generic UI. Let's make a mini-timer logic here or use Timer class nicely.
            // Simplified: Use Timer class but inject into action area for now to avoid breaking layout too much.

            const timerDisplay = document.createElement('div');
            timerDisplay.className = 'active-timer-display';
            container.appendChild(timerDisplay);

            this.activeTimer.render(timerDisplay);
            this.activeTimer.start();

            // Allow manual finish (e.g. failed early)
            const stopBtn = document.createElement('button');
            stopBtn.className = 'btn btn-secondary';
            stopBtn.textContent = '中断 / 完了 (Stop)';
            stopBtn.style.marginTop = '10px';
            stopBtn.onclick = () => {
                this.activeTimer.stop();
                this.handleSetComplete(container);
            };
            container.appendChild(stopBtn);

        } else {
            // Count based (Reps)
            this.renderFinishButton(container);
        }
    }

    renderFinishButton(container) {
        container.innerHTML = '';
        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-large btn-primary';
        completeBtn.textContent = '休憩開始 (Start Rest)';
        completeBtn.onclick = () => this.handleSetComplete(container);
        container.appendChild(completeBtn);
    }

    handleSetComplete(container) {
        // Stop any active timer just in case
        if (this.activeTimer) {
            this.activeTimer.stop();
            this.activeTimer = null;
        }

        // Restore target display if modified
        if (this.currentStep.target.type === 'time') {
            const targetValEl = document.querySelector('.target-main .val');
            if (targetValEl) targetValEl.textContent = this.currentStep.target.value;
        }

        if (this.currentSet < this.currentStep.sets) {
            // Show Rest Timer
            container.innerHTML = '';
            const message = document.createElement('p');
            message.className = 'rest-message';
            message.textContent = '休憩してください';
            container.appendChild(message);

            const timer = new Timer(this.currentStep.rest || 60, () => {
                // Rest finished
                this.currentSet++;
                this.updateSetDisplay();

                // Notify
                if (navigator.vibrate) navigator.vibrate([500]);
                alert('休憩終了！次のセットを始めましょう。');

                // Back to Start Button
                this.renderStartButton(container);
            });
            timer.render(container);
            timer.start();
        } else {
            // Workout Finished
            this.finishWorkout();
        }
    }

    resetActionArea(container) {
        this.renderStartButton(container);
    }

    updateSetDisplay() {
        const el = document.getElementById('current-set');
        if (el) el.textContent = this.currentSet;
    }

    async finishWorkout() {
        alert('トレーニング完了！お疲れ様でした！');

        if (this.tracker) {
            await this.tracker.saveRecord({
                level: this.currentStep.level,
                title: this.currentStep.title,
                completedAt: new Date(),
                sets: this.currentStep.sets
            });
        }

        this.navigation.navigate('home');
    }
}
