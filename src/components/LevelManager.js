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
    const section = document.createElement('section');
    section.className = 'level-list fade-in';

    // Header
    const header = document.createElement('div');
    header.className = 'view-header';
    header.innerHTML = `
      <h2>トレーニングメニュー</h2>
      <p class="subtitle">レベルに合わせてトレーニングを選んでください</p>
    `;
    section.appendChild(header);

    // List
    const list = document.createElement('div');
    list.className = 'step-list';

    trainingSteps.forEach(step => {
      const card = document.createElement('button');
      card.className = 'step-card';
      card.onclick = () => {
        this.navigation.navigate('timer', { step });
      };

      card.innerHTML = `
        <div class="step-info">
          <span class="step-badge">Level ${step.level}</span>
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
      `;
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
                <img src="${charMaleYoung}" alt="Young Male" class="team-member float-1">
                <img src="${charFemaleYoung}" alt="Young Female" class="team-member float-2">
                <img src="${charMaleOld}" alt="Old Male" class="team-member float-3">
                <img src="${charFemaleOld}" alt="Old Female" class="team-member float-4">
            </div>
            <p class="team-message">今日も一緒に頑張ろう！</p>
        `;
    container.appendChild(section);
  }
}
