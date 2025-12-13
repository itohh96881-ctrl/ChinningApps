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

nav.register('home', levelManager);
nav.register('timer', workoutView);

// Start
nav.navigate('home');

console.log('App initialized');
