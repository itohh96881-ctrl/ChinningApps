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

        // Complete Button
        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-large btn-primary';
        completeBtn.textContent = 'セット完了';
        completeBtn.onclick = () => this.handleSetComplete(actionArea);

        actionArea.appendChild(completeBtn);
        content.appendChild(actionArea);
        section.appendChild(content);
        container.appendChild(section);
    }

    handleSetComplete(container) {
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
                this.resetActionArea(container);

                // Notify
                if (navigator.vibrate) navigator.vibrate([500]);
                alert('休憩終了！次のセットを始めましょう。');
            });
            timer.render(container);
            timer.start();
        } else {
            // Workout Finished
            this.finishWorkout();
        }
    }

    resetActionArea(container) {
        container.innerHTML = '';
        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-large btn-primary';
        completeBtn.textContent = 'セット完了';
        completeBtn.onclick = () => this.handleSetComplete(container);
        container.appendChild(completeBtn);
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
