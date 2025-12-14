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
  tracker.setUserId(user ? user.uid : null);

  // Refresh current view if needed
  // If we are on home view, reload it to show correct user data
  // We can check nav.currentView if exposed, or just navigate 'home' if it's the startup phase.
  // Since this callback fires on startup too, let's just validte if we need to refresh.
  if (!nav.currentView || nav.currentView === 'home') {
    nav.navigate('home');
  }
});

// Initial View Render (Render as Guest initially, Auth will update it momentarily)
if (!nav.currentView) {
  nav.navigate('home');
}

console.log('App initialized');
