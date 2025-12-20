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

  render(container) {
    this.container = container;

    // Sync Render (Skeleton)
    const section = document.createElement('section');
    section.className = 'level-view';

    // 1. Header (Placeholder)
    const header = document.createElement('div');
    header.className = 'view-header fade-in';
    header.innerHTML = `
        <div class="header-content">
             <div class="header-info-container">
                <div class="status-badge" id="streak-badge">🔥 Checking...</div>
                <div class="daily-target" id="daily-target">Daily: ...</div>
             </div>
             <h2 class="title-large">TRAINING MENU</h2>
        </div>
    `;
    section.appendChild(header);

    // 2. Component List Container
    const list = document.createElement('div');
    list.className = 'level-list fade-in';
    this.listContainer = list;
    section.appendChild(list);

    // 3. History Container
    const historySection = document.createElement('div');
    historySection.className = 'history-section fade-in';
    historySection.innerHTML = `<h3>Activity History</h3><div id="history-list" class="history-list">Loading...</div>`;
    this.historyListContainer = historySection.querySelector('#history-list');
    section.appendChild(historySection);

    // 4. Team (Cheering Squad)
    this.renderTeam(section);

    container.appendChild(section);

    // Start Data Fetch
    this.updateDashboard();
  }

  async updateDashboard() {
    try {
      const userRank = await this.tracker.getUserRank();
      const streak = await this.tracker.getStreak();
      const dailyProgress = await this.tracker.getDailyProgress();

      console.log(`[LevelManager] Dashboard Updated. Rank:${userRank}, Streak:${streak}, Daily:${dailyProgress}`);

      // Safety Check
      if (!document.body.contains(this.container)) {
        console.log('[LevelManager] Container removed, skipping update');
        return;
      }

      // Update Header
      const streakBadge = this.container.querySelector('#streak-badge');
      const dailyTarget = this.container.querySelector('#daily-target');

      if (streakBadge) streakBadge.textContent = `🔥 ${streak} Days Streak`;
      if (dailyTarget) dailyTarget.innerHTML = `Today's Target: <span class="accent">${Math.min(dailyProgress, 3)}</span> / 3 Sets 🏁`;

      // Render Lists
      this.renderLevelList(userRank, streak);

      const history = await this.tracker.getHistory();
      if (document.body.contains(this.container)) {
        this.renderHistoryList(history);
      }

    } catch (e) {
      console.error("Dashboard update failed", e);
    }
  }

  renderLevelList(userRank, streak) {
    this.listContainer.innerHTML = '';
    trainingSteps.forEach(step => {
      const isLocked = step.rankId > userRank;
      const isCurrent = step.rankId === userRank;

      const card = document.createElement('div');
      card.className = `step-card ${isLocked ? 'locked' : ''}`;

      // Status Badges
      let badgeHtml = '';
      if (step.rankId < userRank) {
        badgeHtml = `<div class="status-badge cleared">CLEARED</div>`;
      } else if (step.rankId === userRank) {
        badgeHtml = `<div class="status-badge current">CURRENT LEVEL</div>`;
      }

      // Content
      let contentHtml = '';
      let actionBtnHtml = '';

      if (isLocked) {
        contentHtml = `
                <div class="lock-overlay">
                    <span class="lock-icon">🔒</span>
                    <p>Unlock by clearing Level ${step.level - 1}</p>
                </div>
            `;
      } else {
        const forceExamMode = isCurrent && step.testCriteria && streak >= 5;

        // Training Button (Hidden if forced)
        if (!forceExamMode) {
          actionBtnHtml += `
                    <button class="btn btn-secondary start-modal-btn training-btn">
                        ⚔️ トレーニング (Streak: ${streak})
                    </button>
                `;
        } else {
          // Message for forced mode
          contentHtml += `
                <div class="force-exam-message" style="
                    color: #ffaa00; 
                    font-weight: bold; 
                    margin-bottom: 12px; 
                    text-align: center;
                    border: 1px solid #ffaa00;
                    padding: 8px;
                    border-radius: 8px;
                    background: rgba(255, 170, 0, 0.1);
                    animation: pulse 2s infinite;
                ">
                    🔥 5日連続達成！<br>
                    現在のレベルは卒業です。<br>
                    昇格試験を受けてください！
                </div>
            `;
        }

        // Test Button (Only if Current Rank and has criteria)
        if (isCurrent && step.testCriteria) {
          actionBtnHtml += `
                    <button class="btn btn-primary start-modal-btn test-btn" style="margin-top: 8px;">
                        🔥 昇格試験に挑戦
                    </button>
                 `;
        }
      }

      card.innerHTML = `
            ${badgeHtml}
            <div class="step-header">
                <span class="step-level">Level ${step.level}</span>
                ${step.rankId === userRank ? '<span class="you-are-here">📍 YOU ARE HERE</span>' : ''}
            </div>
            <h3 class="step-title">${step.title}</h3>
            <p class="step-desc">${step.description}</p>
            <div class="step-meta">
                <div class="meta-item">目標 <strong>${step.target.value}${step.target.unit}</strong></div>
                <div class="meta-item">セット <strong>${step.sets}set</strong></div>
            </div>
            ${contentHtml}
            <div class="step-actions">
                ${actionBtnHtml}
            </div>
        `;

      // Click Handlers
      if (!isLocked) {
        const trainingBtn = card.querySelector('.training-btn');
        const testBtn = card.querySelector('.test-btn');

        if (trainingBtn) {
          trainingBtn.onclick = () => {
            this.navigation.navigate('timer', { step: step, mode: 'training' });
          };
        }

        if (testBtn) {
          testBtn.onclick = () => {
            this.navigation.navigate('timer', { step: step, mode: 'test' });
          };
        }
      }

      this.listContainer.appendChild(card);
    });
  }

  renderHistoryList(history) {
    if (!this.historyListContainer) return;

    if (history.length === 0) {
      this.historyListContainer.innerHTML = '<p class="empty-msg">No history yet. Start training!</p>';
      return;
    }

    this.historyListContainer.innerHTML = '';
    history.slice(0, 5).forEach(record => {
      const div = document.createElement('div');
      div.className = 'history-item fade-in';
      const dateStr = new Date(record.createdAt || record.completedAt).toLocaleDateString();
      div.innerHTML = `
            <span class="h-date">${dateStr}</span>
            <span class="h-title">${record.title}</span>
            <span class="h-sets">${record.sets} sets</span>
         `;
      this.historyListContainer.appendChild(div);
    });
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
