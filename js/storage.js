/**
 * Mini Arcade
 * Storage Manager
 *
 * 負責：
 * 1. 儲存各遊戲最高分
 * 2. 儲存遊戲歷史紀錄
 * 3. 取得最高分
 * 4. 取得歷史紀錄
 *
 * 使用 localStorage，因此完全離線可用。
 */

window.MiniArcadeStorage = (() => {
    const BEST_PREFIX = "miniArcade_best_";
    const HISTORY_PREFIX = "miniArcade_history_";

    // 最多保留多少筆歷史紀錄
    const MAX_HISTORY = 20;

    /**
     * 取得某個遊戲的最高分
     */
    function getBestScore(gameId) {
        const value = localStorage.getItem(`${BEST_PREFIX}${gameId}`);

        if (value === null) {
            return 0;
        }

        const score = Number(value);

        return Number.isFinite(score) ? score : 0;
    }

    /**
     * 儲存遊戲結果
     *
     * 回傳：
     * {
     *     isNewBest: 是否創下新高,
     *     bestScore: 目前最高分,
     *     history: 歷史紀錄
     * }
     */
    function saveScore(gameId, score) {
        const numericScore = Number(score);

        if (!Number.isFinite(numericScore)) {
            return {
                isNewBest: false,
                bestScore: getBestScore(gameId),
                history: getHistory(gameId)
            };
        }

        const oldBest = getBestScore(gameId);
        const isNewBest = numericScore > oldBest;

        // 如果創新高，就更新最高分
        if (isNewBest) {
            localStorage.setItem(
                `${BEST_PREFIX}${gameId}`,
                String(numericScore)
            );
        }

        // 取得舊紀錄
        const history = getHistory(gameId);

        // 新紀錄放在最前面
        history.unshift({
            score: numericScore,
            date: new Date().toISOString()
        });

        // 只保留最近 MAX_HISTORY 筆
        const limitedHistory = history.slice(0, MAX_HISTORY);

        localStorage.setItem(
            `${HISTORY_PREFIX}${gameId}`,
            JSON.stringify(limitedHistory)
        );

        return {
            isNewBest,
            bestScore: Math.max(oldBest, numericScore),
            history: limitedHistory
        };
    }

    /**
     * 取得某個遊戲的歷史紀錄
     */
    function getHistory(gameId) {
        const raw = localStorage.getItem(`${HISTORY_PREFIX}${gameId}`);

        if (!raw) {
            return [];
        }

        try {
            const history = JSON.parse(raw);

            return Array.isArray(history) ? history : [];
        } catch (error) {
            console.warn(
                `Mini Arcade: 無法讀取 ${gameId} 的歷史紀錄。`,
                error
            );

            return [];
        }
    }

    /**
     * 清除某個遊戲的資料
     *
     * 目前先保留 API，
     * 之後製作「重置紀錄」功能時可以直接使用。
     */
    function clearGameData(gameId) {
        localStorage.removeItem(`${BEST_PREFIX}${gameId}`);
        localStorage.removeItem(`${HISTORY_PREFIX}${gameId}`);
    }

    /**
     * 清除所有 Mini Arcade 資料
     */
    function clearAllData() {
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);

            if (
                key &&
                (
                    key.startsWith(BEST_PREFIX) ||
                    key.startsWith(HISTORY_PREFIX)
                )
            ) {
                keysToRemove.push(key);
            }
        }

        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
        });
    }

    return {
        getBestScore,
        saveScore,
        getHistory,
        clearGameData,
        clearAllData
    };
})();