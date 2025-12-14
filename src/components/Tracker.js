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

    // Get today's progress (number of sets completed)
    async getDailyProgress() {
        if (!this.userId) return 0;
        try {
            const history = await this.getHistory();
            // Filter history for today
            const now = new Date();
            const todayStr = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0');

            const todayRecords = history.filter(record => {
                const d = new Date(record.createdAt || record.completedAt);
                const recordDateStr = d.getFullYear() + '-' +
                    String(d.getMonth() + 1).padStart(2, '0') + '-' +
                    String(d.getDate()).padStart(2, '0');
                return recordDateStr === todayStr;
            });

            // Sum up sets
            let totalSets = 0;
            todayRecords.forEach(r => {
                totalSets += (r.sets ? parseInt(r.sets) : 1); // Default to 1 if missing
            });
            todayRecords.forEach(r => {
                totalSets += (r.sets || 0);
            });

            return totalSets;
        } catch (e) {
            console.error("Error getting daily progress:", e);
            return 0;
        }
    }

    // Get Streak Info
    async getStreak() {
        if (!this.userId) return 0;
        const statsRef = ref(db, `users/${this.userId}/stats`);
        try {
            const snapshot = await get(statsRef);
            if (snapshot.exists()) {
                const stats = snapshot.val();
                const lastDate = stats.lastAchievedDate;
                const streak = stats.streak || 0;

                if (!lastDate) return 0;

                // Check if streak is broken
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const last = new Date(lastDate);
                last.setHours(0, 0, 0, 0);

                const diffTime = Math.abs(today - last);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                // If last achieved was yesterday (diff 1) or today (diff 0), streak is alive.
                // If diff > 1, streak is broken.
                if (diffDays > 1) {
                    return 0;
                }
                return streak;
            }
        } catch (e) {
            console.error("Error fetching streak:", e);
        }
        return 0;
    }

    // Check and update streak after a workout
    async checkDailyAchievement() {
        if (!this.userId) return;

        const dailySets = await this.getDailyProgress();
        const targetSets = 3;

        if (dailySets >= targetSets) {
            const statsRef = ref(db, `users/${this.userId}/stats`);
            const todayStr = new Date().toLocaleDateString('en-CA');

            try {
                const snapshot = await get(statsRef);
                let streak = 0;
                let lastDate = "";

                if (snapshot.exists()) {
                    const val = snapshot.val();
                    streak = val.streak || 0;
                    lastDate = val.lastAchievedDate || "";
                }

                // If already achieved today, do nothing
                if (lastDate === todayStr) {
                    return;
                }

                // Check continuity
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // If lastDate exists
                if (lastDate) {
                    const last = new Date(lastDate);
                    last.setHours(0, 0, 0, 0);
                    const diffTime = Math.abs(today - last);
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (diffDays === 1) {
                        streak++; // Continuous
                    } else {
                        streak = 1; // Reset or Start new (if diff > 1)
                    }
                } else {
                    streak = 1; // First time
                }

                // Update DB
                await set(statsRef, {
                    streak: streak,
                    lastAchievedDate: todayStr
                });

                return { achieved: true, streak: streak, dailySets: dailySets };

            } catch (e) {
                console.error("Error updating streak:", e);
            }
        }
        return { achieved: false, dailySets: dailySets };
    }

    async saveRecord(recordData) {
        // Guest Mode (localStorage)
        if (!this.userId) {
            console.log("Guest mode: Saving to localStorage");
            try {
                const guestRecords = JSON.parse(localStorage.getItem('guest_records')) || [];
                const newRecord = {
                    id: 'guest_' + Date.now(),
                    ...recordData,
                    createdAt: new Date().toISOString()
                };
                guestRecords.push(newRecord);
                localStorage.setItem('guest_records', JSON.stringify(guestRecords));
                console.log("Guest record saved:", newRecord);
                return newRecord.id;
            } catch (e) {
                console.error("Error saving guest record:", e);
                return null;
            }
        }

        // Logged-in Mode (Firebase)
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
        // Guest Mode (localStorage)
        if (!this.userId) {
            try {
                const guestRecords = JSON.parse(localStorage.getItem('guest_records')) || [];
                return guestRecords.reverse(); // Newest first
            } catch (e) {
                console.error("Error fetching guest history:", e);
                return [];
            }
        }

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
