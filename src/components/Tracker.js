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
        // Guest Mode
        if (!this.userId) {
            try {
                const stats = JSON.parse(localStorage.getItem('guest_stats'));
                if (!stats) return 0;

                const lastDate = stats.lastAchievedDate;
                const streak = stats.streak || 0;
                if (!lastDate) return 0;

                const now = new Date();
                const todayStr = now.getFullYear() + '-' +
                    String(now.getMonth() + 1).padStart(2, '0') + '-' +
                    String(now.getDate()).padStart(2, '0');

                // If last achieved is today, streak is valid
                if (lastDate === todayStr) return streak;

                // Check continuity (Yesterday)
                const today = new Date(todayStr); // Local midnight approximation
                const last = new Date(lastDate);
                const diffTime = Math.abs(today - last);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 1) return 0; // Broken
                return streak;
            } catch (e) {
                console.error("Error fetching guest streak:", e);
                return 0;
            }
        }

        const statsRef = ref(db, `users/${this.userId}/stats`);
        try {
            const snapshot = await get(statsRef);
            if (snapshot.exists()) {
                const stats = snapshot.val();
                const lastDate = stats.lastAchievedDate;
                const streak = stats.streak || 0;

                if (!lastDate) return 0;

                // Check if streak is broken
                // Use strict date string comparison to avoid UTC issues if possible, 
                // but for continuity we need date math.
                // Re-creating Date from YYYY-MM-DD strings works well for diffing days.

                const now = new Date();
                const todayStr = now.getFullYear() + '-' +
                    String(now.getMonth() + 1).padStart(2, '0') + '-' +
                    String(now.getDate()).padStart(2, '0');

                if (lastDate === todayStr) return streak;

                const today = new Date(todayStr);
                const last = new Date(lastDate);

                const diffTime = Math.abs(today - last);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays > 1) {
                    return 0; // Broken, but we return 0 only for display? 
                    // Actually, if broken, current streak IS 0 until we re-establish?
                    // Usually apps show "0 day streak" if you missed yesterday.
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
        const dailySets = await this.getDailyProgress();
        const targetSets = 3;

        // Logic for continuity check
        const checkAndCalcStreak = (lastDate, currentStreak) => {
            const now = new Date();
            const todayStr = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0');

            if (lastDate === todayStr) return { streak: currentStreak, isNew: false }; // Already done today

            // Check if yesterday
            if (lastDate) {
                const today = new Date(todayStr);
                const last = new Date(lastDate);
                const diffTime = Math.abs(today - last);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                if (diffDays === 1) {
                    return { streak: currentStreak + 1, isNew: true };
                }
            }
            return { streak: 1, isNew: true }; // Start over
        };

        if (dailySets >= targetSets) {
            const now = new Date();
            const todayStr = now.getFullYear() + '-' +
                String(now.getMonth() + 1).padStart(2, '0') + '-' +
                String(now.getDate()).padStart(2, '0');

            // Guest Mode
            if (!this.userId) {
                try {
                    const stats = JSON.parse(localStorage.getItem('guest_stats')) || {};
                    const result = checkAndCalcStreak(stats.lastAchievedDate, stats.streak || 0);

                    if (result.isNew) {
                        localStorage.setItem('guest_stats', JSON.stringify({
                            streak: result.streak,
                            lastAchievedDate: todayStr
                        }));
                        return { achieved: true, streak: result.streak, dailySets };
                    }
                    // Already achieved today return current info
                    return { achieved: true, streak: result.streak, dailySets };

                } catch (e) { console.error(e); }
                return { achieved: false, dailySets };
            }

            // Logged-in Mode
            const statsRef = ref(db, `users/${this.userId}/stats`);
            try {
                const snapshot = await get(statsRef);
                let currentStreak = 0;
                let lastDate = "";

                if (snapshot.exists()) {
                    const val = snapshot.val();
                    currentStreak = val.streak || 0;
                    lastDate = val.lastAchievedDate || "";
                }

                const result = checkAndCalcStreak(lastDate, currentStreak);

                if (result.isNew) {
                    await set(statsRef, {
                        streak: result.streak,
                        lastAchievedDate: todayStr
                    });
                    return { achieved: true, streak: result.streak, dailySets };
                }
                return { achieved: true, streak: result.streak, dailySets };

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
