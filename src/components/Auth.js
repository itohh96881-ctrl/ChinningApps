import { auth } from '../lib/firebase.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

export class Auth {
    constructor(tracker, navigation) {
        this.tracker = tracker;
        this.navigation = navigation;
        this.user = null;
        this.init();
    }

    init() {
        onAuthStateChanged(auth, (user) => {
            this.user = user;
            this.updateUI();
            if (user) {
                console.log('User signed in:', user.displayName);
                this.tracker.setUserId(user.uid);
            } else {
                console.log('User signed out');
                this.tracker.setUserId(null);
            }
        });
    }

    login() {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth, provider)
            .then((result) => {
                // This gives you a Google Access Token.
                // const token = GoogleAuthProvider.credentialFromResult(result).accessToken;
                // The signed-in user info.
                // const user = result.user;
            }).catch((error) => {
                console.error("Login failed", error);
                alert('ログインに失敗しました: ' + error.message);
            });
    }

    logout() {
        signOut(auth).then(() => {
            // Sign-out successful.
        }).catch((error) => {
            console.error("Logout failed", error);
        });
    }

    render(container) {
        this.container = container;
        // Create UI elements
        this.container.innerHTML = ''; // Clear previous

        this.authBtn = document.createElement('button');
        this.authBtn.className = 'btn-auth';
        this.authBtn.onclick = () => {
            if (this.user) {
                this.logout();
            } else {
                this.login();
            }
        };

        this.container.appendChild(this.authBtn);
        this.updateUI();
    }

    updateUI() {
        if (!this.authBtn) return;

        if (this.user) {
            this.authBtn.textContent = 'ログアウト';
            this.authBtn.classList.add('logged-in');

            // Optionally show user icon or name
            // const userInfo = document.createElement('span');
            // userInfo.textContent = this.user.displayName;
            // this.container.prepend(userInfo);
        } else {
            this.authBtn.textContent = 'Googleでログイン';
            this.authBtn.classList.remove('logged-in');
        }
    }

    getUser() {
        return this.user;
    }
}
