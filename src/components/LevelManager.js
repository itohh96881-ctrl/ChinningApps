import { trainingSteps } from '../data/program.js';

export class LevelManager {
    constructor(navigation) {
        this.navigation = navigation;
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
        container.appendChild(section);
    }
}
