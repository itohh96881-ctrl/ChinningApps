import './styles/main.css';
import './styles/components.css';
import { Navigation } from './components/Navigation.js';
import { LevelManager } from './components/LevelManager.js';
import { WorkoutView } from './components/WorkoutView.js';
import { Tracker } from './components/Tracker.js';
import { Auth } from './components/Auth.js';

// Initialize App
const appContainer = document.querySelector('#app');
const header = `
  <header class="app-header">
    <h1>Chinning Master</h1>
  </header>
`;

// Create Layout
appContainer.innerHTML = header;
const mainContent = document.createElement('main');
mainContent.id = 'main-content';
mainContent.className = 'container';
appContainer.appendChild(mainContent);



// Setup Navigation
const nav = new Navigation(mainContent);
const tracker = new Tracker();
const auth = new Auth(tracker, nav);

// Header Auth
const authContainer = document.createElement('div');
authContainer.className = 'auth-container';
document.querySelector('.app-header').appendChild(authContainer);
auth.render(authContainer);

const levelManager = new LevelManager(nav, tracker);
const workoutView = new WorkoutView(nav, tracker);

import { APP_VERSION } from './version.js';

// ... (existing imports)

nav.register('home', levelManager);

// Add Version Display
const versionDisplay = document.createElement('div');
versionDisplay.className = 'app-version';
versionDisplay.textContent = APP_VERSION;
document.body.appendChild(versionDisplay);
nav.register('timer', workoutView);

// Start
// Auth Initialization & State Monitoring
auth.init((user) => {
  // Update Tracker with User ID
  const userId = user ? user.uid : null;
  tracker.setUserId(userId);
  console.log(`[Main] User signed in: ${user ? user.displayName : 'Guest'} (${userId}). Refreshing view...`);

  // FORCE Refresh current view to update data
  // We reload 'home' to ensure the dashboard reflects the logged-in user's data (Rank/Streak/Logs)
  // Even if we are already on 'home', calling this forces LevelManager.render() to run again.
  // FORCE Refresh current view to update data
  nav.navigate('home');
});

// Force Reload Mechanism for v1.11.6 fix
// This ensures clients stuck with old JS main chunks get refreshed
if (!sessionStorage.getItem('v1.11.6_fixed')) {
  console.log('Force reloading for update v1.11.6...');
  sessionStorage.setItem('v1.11.6_fixed', 'true');
  window.location.reload();
}

// Initial View Render (Render as Guest initially, Auth will update it momentarily)
if (!nav.currentView) {
  nav.navigate('home');
}

console.log('App initialized');
