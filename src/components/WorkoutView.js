import { Timer } from './Timer.js';
import { soundManager } from '../utils/sound.js';

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
            // const originalVal = targetValEl ? targetValEl.textContent : '';

            this.activeTimer = new Timer(duration, () => {
                // Time up
                soundManager.playWhistle(); // Sound alert
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

    async handleSetComplete(container) {
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

        // Save 1 Set
        if (this.tracker) {
            await this.tracker.saveRecord({
                level: this.currentStep.level,
                title: this.currentStep.title,
                completedAt: new Date(),
                sets: 1 // Always 1 set per action
            });

            // Check Daily Goal
            const result = await this.tracker.checkDailyAchievement();

            if (result && result.achieved) {
                // Fanfare / Alert for Daily Goal
                soundManager.playDing();
                alert(`🎉 今日のノルマ達成！\n継続日数: ${result.streak}日目`);
            } else {
                // Just finished a set
                soundManager.playDing();
                // Simple toast or rapid return
                // alert('1セット完了！お疲れ様でした。'); 
            }
        }

        // Return to Home immediately (No Rest)
        this.navigation.navigate('home');
    }

    resetActionArea(container) {
        this.renderStartButton(container);
    }
}
