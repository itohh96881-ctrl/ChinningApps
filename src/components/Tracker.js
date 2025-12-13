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
            const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

            // Filter history for today
            const todayRecords = history.filter(record => {
                const recordDate = new Date(record.createdAt || record.completedAt).toLocaleDateString('en-CA');
                return recordDate === today;
            });

            // Sum up sets (assuming 'sets' property in record is what implies a "session", but user said 3 sets per day.
            // Actually, previous implementation saved records PER SESSION (which naturally had sets). 
            // User now says "1 day 3 sets". 
            // If a record represents "1 set" or "1 session of X sets"?
            // Let's assume each Record stored is 1 Set for simplicity in this new flow, 
            // OR we sum individual sets if multiple are stored.
            // Looking at WorkoutView, finishWorkout saves { sets: this.currentStep.sets }.
            // But with rest removal, maybe we save record PER SET?
            // User: "Timer expiration increments Set completed count." -> implying granular tracking.
            // Let's count TOTAL SETS recorded today.

            let totalSets = 0;
            todayRecords.forEach(r => {
                totalSets += (r.sets || 0); // r.sets usually 1 or 3 depending on how we save
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

                return { achieved: true, streak: streak };

            } catch (e) {
                console.error("Error updating streak:", e);
            }
        }
        return { achieved: false };
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
