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
    const DATA_PREFIX = "miniArcade_data_";

    // 最多保留多少筆歷史紀錄
    const MAX_HISTORY = 20;

    const volatileStorage = new Map();
    let hasWarnedStorageUnavailable = false;

    function warnStorageUnavailable(error) {
        if (hasWarnedStorageUnavailable) {
            return;
        }

        hasWarnedStorageUnavailable = true;

        console.warn(
            "Mini Arcade：瀏覽器儲存空間無法使用，資料只會保留在目前工作階段。",
            error
        );
    }

    function getRawValue(key) {
        if (volatileStorage.has(key)) {
            return volatileStorage.get(key);
        }

        try {
            return localStorage.getItem(key);
        } catch (error) {
            warnStorageUnavailable(error);
            return null;
        }
    }

    function setRawValue(key, value) {
        try {
            localStorage.setItem(key, value);
            volatileStorage.delete(key);
            return true;
        } catch (error) {
            warnStorageUnavailable(error);
            volatileStorage.set(key, value);
            return false;
        }
    }

    function removeRawValue(key) {
        volatileStorage.set(key, null);

        try {
            localStorage.removeItem(key);
        } catch (error) {
            warnStorageUnavailable(error);
            return false;
        }

        volatileStorage.delete(key);
        return true;
    }

    function parseHistory(raw) {
        if (!raw) {
            return [];
        }

        try {
            const history = JSON.parse(raw);

            if (!Array.isArray(history)) {
                return [];
            }

            return history.filter(entry =>
                entry &&
                typeof entry === "object" &&
                Number.isFinite(entry.score) &&
                typeof entry.date === "string"
            );
        } catch (error) {
            console.warn(
                "Mini Arcade：無法解析遊戲歷史紀錄。",
                error
            );

            return [];
        }
    }

    function readLegacyGameData(gameId) {
        const rawBest = getRawValue(`${BEST_PREFIX}${gameId}`);
        const parsedBest = Number(rawBest);
        const bestScore =
            rawBest !== null && Number.isFinite(parsedBest)
                ? parsedBest
                : 0;

        return {
            bestScore,
            history: parseHistory(
                getRawValue(`${HISTORY_PREFIX}${gameId}`)
            )
        };
    }

    function readGameData(gameId) {
        const rawData = getRawValue(`${DATA_PREFIX}${gameId}`);

        if (rawData !== null) {
            try {
                const data = JSON.parse(rawData);

                if (
                    data &&
                    typeof data === "object" &&
                    Number.isFinite(data.bestScore) &&
                    Array.isArray(data.history)
                ) {
                    return {
                        bestScore: data.bestScore,
                        history: data.history.filter(entry =>
                            entry &&
                            typeof entry === "object" &&
                            Number.isFinite(entry.score) &&
                            typeof entry.date === "string"
                        )
                    };
                }

                console.warn(
                    `Mini Arcade：${gameId} 的遊戲資料格式無效，改讀取舊紀錄。`
                );
            } catch (error) {
                console.warn(
                    `Mini Arcade：無法解析 ${gameId} 的遊戲資料，改讀取舊紀錄。`,
                    error
                );
            }
        }

        return readLegacyGameData(gameId);
    }

    /**
     * 取得某個遊戲的最高分
     */
    function getBestScore(gameId) {
        return readGameData(gameId).bestScore;
    }

    /**
     * 儲存遊戲結果
     *
     * 回傳：
     * {
     *     isNewBest: 是否創下新高,
     *     bestScore: 目前最高分,
     *     history: 歷史紀錄,
     *     persisted: 是否已寫入瀏覽器儲存空間
     * }
     */
    function saveScore(gameId, score) {
        const currentData = readGameData(gameId);

        if (
            typeof score !== "number" ||
            !Number.isFinite(score) ||
            score < 0
        ) {
            console.warn(
                `Mini Arcade：忽略 ${gameId} 的無效分數。`,
                score
            );

            return {
                isNewBest: false,
                bestScore: currentData.bestScore,
                history: currentData.history,
                persisted: false
            };
        }

        const numericScore = score;
        const oldBest = currentData.bestScore;
        const isNewBest = numericScore > oldBest;

        // 新紀錄放在最前面
        const history = currentData.history;
        history.unshift({
            score: numericScore,
            date: new Date().toISOString()
        });

        // 只保留最近 MAX_HISTORY 筆
        const limitedHistory = history.slice(0, MAX_HISTORY);
        const bestScore = Math.max(oldBest, numericScore);
        const persisted = setRawValue(
            `${DATA_PREFIX}${gameId}`,
            JSON.stringify({
                bestScore,
                history: limitedHistory
            })
        );

        return {
            isNewBest,
            bestScore,
            history: limitedHistory,
            persisted
        };
    }

    /**
     * 取得某個遊戲的歷史紀錄
     */
    function getHistory(gameId) {
        return readGameData(gameId).history;
    }

    function getSetting(key) {
        return getRawValue(key);
    }

    function setSetting(key, value) {
        return setRawValue(key, String(value));
    }

    /**
     * 清除某個遊戲的資料
     *
     * 目前先保留 API，
     * 之後製作「重置紀錄」功能時可以直接使用。
     */
    function clearGameData(gameId) {
        removeRawValue(`${BEST_PREFIX}${gameId}`);
        removeRawValue(`${HISTORY_PREFIX}${gameId}`);
        removeRawValue(`${DATA_PREFIX}${gameId}`);
    }

    /**
     * 清除所有 Mini Arcade 資料
     */
    function clearAllData() {
        const keysToRemove = new Set();

        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);

                if (
                    key &&
                    (
                        key.startsWith(BEST_PREFIX) ||
                        key.startsWith(HISTORY_PREFIX) ||
                        key.startsWith(DATA_PREFIX)
                    )
                ) {
                    keysToRemove.add(key);
                }
            }
        } catch (error) {
            warnStorageUnavailable(error);
        }

        volatileStorage.forEach((value, key) => {
            if (
                key.startsWith(BEST_PREFIX) ||
                key.startsWith(HISTORY_PREFIX) ||
                key.startsWith(DATA_PREFIX)
            ) {
                keysToRemove.add(key);
            }
        });

        keysToRemove.forEach(removeRawValue);
    }

    return {
        getBestScore,
        saveScore,
        getHistory,
        getSetting,
        setSetting,
        clearGameData,
        clearAllData
    };
})();