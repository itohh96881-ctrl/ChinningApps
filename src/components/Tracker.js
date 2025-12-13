import { db } from '../lib/firebase.js';
import { ref, push, get, query, orderByChild, set, child } from "firebase/database";

export class Tracker {
    constructor() {
        this.userId = null;
    }

    setUserId(uid) {
        this.userId = uid;
    }

    // Get current rank (default: 1)
    async getUserRank() {
        if (!this.userId) return 1; // Default for guest or initial load
        const rankRef = ref(db, `users/${this.userId}/currentRank`);
        try {
            const snapshot = await get(rankRef);
            if (snapshot.exists()) {
                return snapshot.val();
            } else {
                return 1; // Default
            }
        } catch (e) {
            console.error("Error fetching rank:", e);
            return 1;
        }
    }

    // Update rank (only if new rank is higher)
    async updateUserRank(newRank) {
        if (!this.userId) return;
        const rankRef = ref(db, `users/${this.userId}/currentRank`);
        try {
            const current = await this.getUserRank();
            if (newRank > current) {
                await set(rankRef, newRank);
                console.log(`Rank updated to ${newRank}`);
                return true; // Promoted
            }
        } catch (e) {
            console.error("Error updating rank:", e);
        }
        return false;
    }

    async saveRecord(recordData) {
        if (!this.userId) {
            console.warn("User not logged in, cannot save record to DB.");
            alert("記録を保存するにはログインが必要です。");
            return;
        }

        try {
            // Create a reference to the user's records
            const recordsRef = ref(db, `users/${this.userId}/records`);
            // Push a new record
            const newRef = await push(recordsRef, {
                ...recordData,
                createdAt: new Date().toISOString() // Realtime DB stores strings easier
            });
            console.log("Record saved with ID: ", newRef.key);
            return newRef.key;
        } catch (e) {
            console.error("Error adding record: ", e);
            alert("記録の保存に失敗しました。");
        }
    }

    async getHistory() {
        if (!this.userId) return [];

        const recordsRef = ref(db, `users/${this.userId}/records`);
        // Note: Realtime DB sorting is limited compared to Firestore.
        // For now, we just get all data and sort client-side if needed.

        try {
            const snapshot = await get(recordsRef);
            if (snapshot.exists()) {
                const data = snapshot.val();
                // Convert object of objects to array
                return Object.keys(data).map(key => ({
                    id: key,
                    ...data[key]
                })).reverse(); // Newest first
            } else {
                return [];
            }
        } catch (e) {
            console.error("Error getting history:", e);
            return [];
        }
    }
}
