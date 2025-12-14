import { Timer } from './Timer.js';
import { soundManager } from '../utils/sound.js';
import confetti from 'canvas-confetti';

export class WorkoutView {
    constructor(navigation, tracker) {
        this.navigation = navigation;
        this.tracker = tracker;
        this.currentStep = null;
        this.currentSet = 1;
    }

    render(container, params) {
        this.container = container; // Save container ref
        this.currentStep = params.step;
        this.currentSet = 1;
        this.mode = params.mode || 'training'; // 'training' or 'test'

        let displayData = {
            title: this.currentStep.title,
            description: this.currentStep.description,
            target: this.currentStep.target
        };

        if (this.mode === 'test' && this.currentStep.testCriteria) {
            displayData = {
                title: this.currentStep.testCriteria.title,
                description: this.currentStep.testCriteria.description,
                target: this.currentStep.testCriteria.target
            };
        }

        this.displayData = displayData; // Store for logic

        const section = document.createElement('section');
        section.className = `workout-view fade-in ${this.mode === 'test' ? 'mode-test' : ''}`;

        // Header
        const header = document.createElement('div');
        header.className = 'workout-header'; // Use new class
        header.innerHTML = `
            <button class="back-btn-styled" id="backBtn">
                <span>◀</span> HOME
            </button>
            <h2 class="step-title-large" style="margin:0; border:none; padding:0;">
                ${this.mode === 'test' ? '⭐️ PROMOTION EXAM' : `Level ${this.currentStep.level}`}
            </h2>
        `;

        // Use ID to find button
        header.querySelector('#backBtn').onclick = () => {
            if (this.activeTimer) {
                this.activeTimer.pause(); // Cleanup timer if running
            }
            this.navigation.navigate('home');
        };

        section.appendChild(header);

        // Content
        const content = document.createElement('div');
        content.className = 'workout-content';

        // Target Display Construction
        let targetHtml = '';
        if (displayData.target) {
            targetHtml = `
            <div class="target-display ${this.mode === 'test' ? 'test-target' : ''}">
                <div class="target-main">
                <span class="val">${displayData.target.value}</span>
                <span class="unit">${displayData.target.unit}</span>
                </div>
            </div>`;
        }

        content.innerHTML = `
      ${targetHtml}
      <p class="workout-instruction">${displayData.description}</p>
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
        startBtn.textContent = this.mode === 'test' ? '試験開始 (Start Exam)' : 'トレーニング開始 (Start)';
        startBtn.onclick = () => this.handleStartSet(container);
        container.appendChild(startBtn);
    }

    handleStartSet(container) {
        // Prepare UI for "In Progress"
        container.innerHTML = '';
        const target = this.displayData.target;

        if (target.type === 'time') {
            const duration = target.value;
            // Create a temporary timer display inside the target area or just action area?
            // Let's replace the large target value with the timer for better visibility
            const targetValEl = document.querySelector('.target-main .val');
            // const originalVal = targetValEl ? targetValEl.textContent : '';

            this.activeTimer = new Timer(duration, () => {
                // Time up
                soundManager.playWhistle(); // Sound alert
                if (navigator.vibrate) navigator.vibrate([200, 100, 200, 500]);

                if (this.mode === 'test') {
                    this.finishExam(true); // Auto pass for time based if completed
                } else {
                    this.renderFinishButton(container); // Allow user to manually click finish to proceed to rest
                }

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

        } else {
            // Count based (Reps)
            this.renderFinishButton(container);
        }
    }

    renderFinishButton(container) {
        container.innerHTML = '';
        const completeBtn = document.createElement('button');
        completeBtn.className = 'btn btn-large btn-primary';

        if (this.mode === 'test') {
            completeBtn.textContent = '合格しました！ (I Passed!)';
            completeBtn.onclick = () => this.finishExam(true);
            // Maybe add a fail button too?
            const failBtn = document.createElement('button');
            failBtn.className = 'btn btn-secondary';
            failBtn.innerHTML = '不合格... (Failed)';
            failBtn.style.marginTop = '10px';
            failBtn.style.display = 'block';
            failBtn.style.width = '100%';
            failBtn.onclick = () => {
                alert('残念...次は頑張りましょう！');
                this.navigation.navigate('home');
            };
            container.appendChild(completeBtn);
            container.appendChild(failBtn);
        } else {
            completeBtn.textContent = '完了 (Finish)';
            completeBtn.onclick = () => this.finishSingleSet();
            container.appendChild(completeBtn);
        }
    }

    async finishExam(success) {
        if (success) {
            soundManager.playDing(); // Needs a bigger sound ideally

            // Promote
            if (this.tracker) {
                await this.tracker.updateUserRank(this.currentStep.rankId + 1);
            }

            this.showCelebration('🎉 合格おめでとう！', '新しいレベルがアンロックされました！\n次のステージへ進みましょう。');
        } else {
            this.navigation.navigate('home');
        }
    }

    async finishSingleSet() {
        // Stop any active timer just in case
        if (this.activeTimer) {
            this.activeTimer.pause();
            this.activeTimer = null;
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
                this.showCelebration('🎉 今日のノルマ達成！', `継続日数: ${result.streak}日目\n素晴らしい継続力です！`);
            } else {
                // Just finished a set
                soundManager.playDing();
                this.showSetComplete(result.dailySets || 1);
            }
        } else {
            this.navigation.navigate('home');
        }
    }

    showSetComplete(currentSets) {
        // Simple but Rich Overlay for Set Complete
        const overlay = document.createElement('div');
        overlay.className = 'celebration-overlay fade-in';
        overlay.innerHTML = `
            <div class="celebration-content" style="border-color: #00bcd4; box-shadow: 0 0 30px rgba(0, 188, 212, 0.3);">
                <h2 style="color: #00bcd4; text-shadow: 0 0 10px rgba(0,255,255,0.5); font-size: 2rem;">SET COMPLETE</h2>
                <div style="font-size: 1.5rem; color: #fff; margin: 20px 0;">
                    Today: <span style="font-weight:bold; color: #ffcc00;">${currentSets}</span> / 3
                </div>
                <p style="color: #aaa; font-size: 0.9rem;">Excellent work!</p>
            </div>
        `;
        document.body.appendChild(overlay);

        // Mini Confetti
        confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.8 },
            colors: ['#00bcd4', '#ffffff']
        });

        // Auto Dismiss
        setTimeout(() => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
                this.navigation.navigate('home');
            }
        }, 2500);

        // Allow click to dismiss early
        overlay.onclick = () => {
            if (document.body.contains(overlay)) {
                document.body.removeChild(overlay);
                this.navigation.navigate('home');
            }
        };
    }

    showCelebration(title, message) {
        // Create Modal Overlay
        const overlay = document.createElement('div');
        overlay.className = 'celebration-overlay fade-in';
        overlay.innerHTML = `
            <div class="celebration-content">
                <h1 class="celebration-title">${title}</h1>
                <p class="celebration-msg">${message.replace(/\n/g, '<br>')}</p>
                <button class="btn btn-primary btn-large" id="celebration-ok">OK</button>
            </div>
        `;
        document.body.appendChild(overlay);

        // Fire Confetti
        const duration = 3000;
        const end = Date.now() + duration;

        (function frame() {
            confetti({
                particleCount: 7,
                angle: 60,
                spread: 55,
                origin: { x: 0 },
                colors: ['#ff0', '#f0f', '#0ff']
            });
            confetti({
                particleCount: 7,
                angle: 120,
                spread: 55,
                origin: { x: 1 },
                colors: ['#ff0', '#f0f', '#0ff']
            });

            if (Date.now() < end) {
                requestAnimationFrame(frame);
            }
        }());

        // Handle Close
        document.getElementById('celebration-ok').onclick = () => {
            document.body.removeChild(overlay);
            this.navigation.navigate('home');
        };
    }

    resetActionArea(container) {
        this.renderStartButton(container);
    }
}
