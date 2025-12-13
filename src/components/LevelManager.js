import { trainingSteps } from '../data/program.js';
import charMaleYoung from '../assets/char_male_young.png';
import charFemaleYoung from '../assets/char_female_young.png';
import charMaleOld from '../assets/char_male_old.png';
import charFemaleOld from '../assets/char_female_old.png';

export class LevelManager {
  constructor(navigation, tracker) {
    this.navigation = navigation;
    this.tracker = tracker;
  }

  async render(container) {
    const section = document.createElement('section');
    section.className = 'level-list fade-in';

    // List
    const list = document.createElement('div');
    list.className = 'step-list';

    // Get stats
    const userRank = await this.tracker.getUserRank();
    const streak = await this.tracker.getStreak();
    const dailyProgress = await this.tracker.getDailyProgress();
    const dailyTarget = 3;

    // Header (Updated with Stats)
    const header = document.createElement('div');
    header.className = 'view-header';
    header.innerHTML = `
      <h2>トレーニングメニュー</h2>
      
      <div class="stats-container" style="margin-bottom: 20px; text-align: center;">
          <div class="streak-display" style="font-size: 1.5rem; font-weight: bold; color: #ff8800; text-shadow: 0 0 10px rgba(255, 136, 0, 0.5); margin-bottom: 8px;">
            🔥 ${streak} Days Streak
          </div>
          <div class="daily-progress" style="font-size: 1rem; color: #aaa;">
            Today's Target: 
            <span style="color: ${dailyProgress >= dailyTarget ? '#00ff88' : '#e0e0e0'}; font-weight: bold;">
                ${dailyProgress} / ${dailyTarget} Sets
            </span>
             ${dailyProgress >= dailyTarget ? '🎉' : ''}
          </div>
      </div>

      <p class="subtitle">レベルに合わせてトレーニングを選んでください</p>
    `;
    section.appendChild(header);

    trainingSteps.forEach(step => {
      const isLocked = step.rankId > userRank;
      const isCleared = step.rankId < userRank;
      const isCurrent = step.rankId === userRank;

      const card = document.createElement('div'); // Changed to div to contain buttons
      card.className = `step-card ${isLocked ? 'locked' : ''} ${isCleared ? 'cleared' : ''} ${isCurrent ? 'current' : ''}`;

      let actionButtons = '';

      if (isLocked) {
        actionButtons = `<div class="lock-overlay"><span class="lock-icon">🔒</span><span class="lock-text">LOCKED</span></div>`;
      } else {
        // Training Button
        actionButtons = `
            <button class="btn btn-secondary btn-sm" onclick="app.navigation.navigate('timer', { step })">
               ⚔️ トレーニング (Training)
            </button>
          `;

        // Test Button (Only for current level)
        if (isCurrent) {
          actionButtons += `
                <button class="btn btn-primary btn-sm btn-test" onclick="app.navigation.navigate('timer', { step, mode: 'test' })">
                   🔥 昇格試験を受ける (Promotion Test)
                </button>
              `;
        }
      }

      card.innerHTML = `
        <div class="step-header-row">
            <span class="step-badge">Level ${step.level}</span>
            ${isCleared ? '<span class="status-badge cleared">👑 CLEARED</span>' : ''}
            ${isCurrent ? '<span class="status-badge current">📍 YOU ARE HERE</span>' : ''}
        </div>
        <div class="step-info">
          <h3 class="step-title">${step.title}</h3>
          <p class="step-desc">${step.description}</p>
        </div>
        <div class="step-targets">
          <div class="target-item">
            <span class="target-label">目標</span>
            <span class="target-value">${step.target.value}<small>${step.target.unit}</small></span>
          </div>
          <div class="target-item">
            <span class="target-label">セット</span>
            <span class="target-value">${step.sets}<small>set</small></span>
          </div>
        </div>
        <div class="step-actions">
            ${actionButtons}
        </div>
      `;

      // Make the whole card clickable for training if not locked, but avoid conflict with buttons
      // Actually, let's rely on the buttons for clarity in this new UI

      list.appendChild(card);
    });

    section.appendChild(list);

    // History Section
    const historySection = document.createElement('div');
    historySection.className = 'history-section';
    historySection.innerHTML = `<h3>トレーニング履歴</h3><div id="history-loading">読み込み中...</div>`;
    section.appendChild(historySection);

    this.loadHistory(historySection);

    this.renderTeam(section); // Add Team Section

    container.appendChild(section);

    // Quick hack to make onclick work with 'app.navigation' global access or bind properly
    // Since we don't have global 'app', we need to attach event listeners manually after appending
    const buttons = list.querySelectorAll('button');
    buttons.forEach(btn => {
      const onclickAttr = btn.getAttribute('onclick');
      if (onclickAttr) {
        btn.onclick = null; // Clear string attribute
        // Re-implement logic safely
        if (onclickAttr.includes("'test'")) {
          // Extract step index or data. For now, let's use a simpler closure approach in the loop above?
          // No, string injection is messy. Let's fix this in the loop.
        }
      }
    });

    // Re-assign click handlers properly using closures (cleaner than string injection)
    Array.from(list.children).forEach((card, index) => {
      const step = trainingSteps[index];
      const trainBtn = card.querySelector('.btn-secondary');
      const testBtn = card.querySelector('.btn-test');

      if (trainBtn) {
        trainBtn.onclick = () => this.navigation.navigate('timer', { step, mode: 'training' });
      }
      if (testBtn) {
        testBtn.onclick = () => this.navigation.navigate('timer', { step, mode: 'test' });
      }
    });

  }

  async loadHistory(container) {
    if (!this.tracker.userId) {
      container.innerHTML = `
                <h3>トレーニング履歴</h3>
                <p class="history-empty">ログインするとここに履歴が表示されます。</p>
            `;
      return;
    }

    const history = await this.tracker.getHistory();
    container.innerHTML = '<h3>トレーニング履歴</h3>';

    if (history.length === 0) {
      const emptyMsg = document.createElement('p');
      emptyMsg.className = 'history-empty';
      emptyMsg.textContent = 'まだ履歴がありません。トレーニングを開始しましょう！';
      container.appendChild(emptyMsg);
      return;
    }

    const historyList = document.createElement('div');
    historyList.className = 'history-list';

    history.forEach(record => {
      const date = new Date(record.createdAt || record.completedAt).toLocaleDateString();
      const time = new Date(record.createdAt || record.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      const item = document.createElement('div');
      item.className = 'history-item';
      item.innerHTML = `
                <div class="history-date">
                    <span class="date">${date}</span>
                    <span class="time">${time}</span>
                </div>
                <div class="history-info">
                    <span class="history-level">Level ${record.level}</span>
                    <span class="history-title">${record.title}</span>
                </div>
                <div class="history-status">
                    <span class="done-badge">COMPLETED</span>
                </div>
            `;
      historyList.appendChild(item);
    });

    container.appendChild(historyList);
  }

  renderTeam(container) {
    const section = document.createElement('div');
    section.className = 'team-section fade-in-up';
    section.innerHTML = `
            <h3>Team Chinning</h3>
            <div class="team-grid">
                <div class="team-wrapper float-1">
                    <img src="${charMaleYoung}" alt="Young Male" class="team-member">
                </div>
                <div class="team-wrapper float-2">
                    <img src="${charFemaleYoung}" alt="Young Female" class="team-member">
                </div>
                <div class="team-wrapper float-3">
                    <img src="${charMaleOld}" alt="Old Male" class="team-member">
                </div>
                <div class="team-wrapper float-4">
                    <img src="${charFemaleOld}" alt="Old Female" class="team-member">
                </div>
            </div>
            <p class="team-message">今日も一緒に頑張ろう！</p>
        `;
    container.appendChild(section);
  }
}
