/**
 * Mini Arcade
 * Application Core
 *
 * 平台核心：
 * - 遊戲清單
 * - 遊戲啟動 / 關閉
 * - Modal
 * - 分數
 * - 最高分
 * - 暫停
 * - 重新開始
 * - 主題
 * - 全螢幕
 *
 * 注意：
 * app.js 不放任何特定遊戲的實作。
 */

(() => {

    /* =========================================
       Game Registry
       ========================================= */

    const games = Object.values(
        window.MiniArcadeGames || {}
    );

    /* =========================================
       DOM
       ========================================= */

    const gameGrid =
        document.getElementById("gameGrid");

    const gameCount =
        document.getElementById("gameCount");

    const gameSortSelect =
        document.getElementById("gameSortSelect");

    const sortDirectionButton =
        document.getElementById("sortDirectionButton");

    const gameModal =
        document.getElementById("gameModal");

    const gameContainer =
        document.getElementById("gameContainer");

    const gameTitle =
        document.getElementById("gameTitle");

    const gameScore =
        document.getElementById("gameScore");

    const instructionsModal =
        document.getElementById("instructionsModal");

    const instructionsContent =
        document.getElementById("instructionsContent");

    const themeButton =
        document.getElementById("themeButton");

    const fullscreenButton =
        document.getElementById("fullscreenButton");

    const gameFullscreenButton =
        document.getElementById("gameFullscreenButton");

    const closeGameButton =
        document.getElementById("closeGameButton");

    const pauseButton =
        document.getElementById("pauseButton");

    const restartButton =
        document.getElementById("restartButton");

    const instructionsButton =
        document.getElementById("instructionsButton");

    const closeInstructionsButton =
        document.getElementById("closeInstructionsButton");

    /* =========================================
       State
       ========================================= */

    let currentGame = null;

    let currentGameInstance = null;

    const SORT_MODE_SETTING = "miniArcade_gameSortMode";
    const SORT_DIRECTION_SETTING_PREFIX =
        "miniArcade_gameSortDirection_";
    const SORT_MODES = ["recent", "name", "category"];

    let sortMode =
        MiniArcadeStorage.getSetting(SORT_MODE_SETTING);

    if (!SORT_MODES.includes(sortMode)) {
        sortMode = "recent";
    }

    let sortDirection = getSavedSortDirection(sortMode);

    /* =========================================
       Initialize
       ========================================= */

    function initializeApp() {

        initializeTheme();

        initializeGameSorting();

        renderGameLibrary();

        initializeButtons();
    }

    /* =========================================
       Game Library
       ========================================= */

    function renderGameLibrary() {

        gameGrid.innerHTML = "";

        gameCount.textContent =
            `${games.length} 款遊戲`;

        getSortedGames().forEach(game => {

            const card =
                createGameCard(game);

            gameGrid.appendChild(card);
        });
    }

    function getSortedGames() {
        return games
            .map((game, index) => ({
                game,
                index,
                lastPlayed: MiniArcadeStorage.getLastPlayed(game.id)
            }))
            .sort((first, second) => {
                let comparison = 0;

                if (sortMode === "recent") {
                    comparison = first.lastPlayed - second.lastPlayed;
                } else {
                    const firstValue =
                        sortMode === "name"
                            ? first.game.name
                            : first.game.category;

                    const secondValue =
                        sortMode === "name"
                            ? second.game.name
                            : second.game.category;

                    comparison = firstValue.localeCompare(
                        secondValue,
                        undefined,
                        { sensitivity: "base" }
                    );
                }

                return comparison === 0
                    ? first.index - second.index
                    : comparison *
                        (sortDirection === "asc" ? 1 : -1);
            })
            .map(entry => entry.game);
    }

    function initializeGameSorting() {
        gameSortSelect.value = sortMode;
        updateSortDirectionButton();

        gameSortSelect.addEventListener(
            "change",
            () => {
                sortMode = gameSortSelect.value;
                sortDirection = getSavedSortDirection(sortMode);
                MiniArcadeStorage.setSetting(
                    SORT_MODE_SETTING,
                    sortMode
                );
                updateSortDirectionButton();
                renderGameLibrary();
            }
        );

        sortDirectionButton.addEventListener(
            "click",
            () => {
                sortDirection =
                    sortDirection === "asc" ? "desc" : "asc";

                MiniArcadeStorage.setSetting(
                    `${SORT_DIRECTION_SETTING_PREFIX}${sortMode}`,
                    sortDirection
                );

                updateSortDirectionButton();
                renderGameLibrary();
            }
        );
    }

    function getSavedSortDirection(mode) {
        const savedDirection =
            MiniArcadeStorage.getSetting(
                `${SORT_DIRECTION_SETTING_PREFIX}${mode}`
            );

        if (savedDirection === "asc" || savedDirection === "desc") {
            return savedDirection;
        }

        return mode === "recent" ? "desc" : "asc";
    }

    function updateSortDirectionButton() {
        if (sortMode === "recent") {
            const newestFirst = sortDirection === "desc";

            sortDirectionButton.textContent =
                newestFirst ? "↓ 最新優先" : "↑ 最早優先";
            sortDirectionButton.setAttribute(
                "aria-label",
                newestFirst
                    ? "切換為最早遊玩優先"
                    : "切換為最近遊玩優先"
            );
            return;
        }

        const ascending = sortDirection === "asc";

        sortDirectionButton.textContent =
            ascending ? "↑ A 到 Z" : "↓ Z 到 A";
        sortDirectionButton.setAttribute(
            "aria-label",
            ascending
                ? "切換為 Z 到 A 排序"
                : "切換為 A 到 Z 排序"
        );
    }

    /**
     * 建立遊戲卡片
     */
    function createGameCard(game) {

        const card =
            document.createElement("article");

        card.className = "game-card";

        const bestScore =
            MiniArcadeStorage.getBestScore(
                game.id
            );

        card.innerHTML = `
            <div class="game-card-icon">
                ${game.icon}
            </div>

            <div class="game-card-content">

                <div class="game-card-category">
                    ${game.category}
                </div>

                <h3>
                    ${game.name}
                </h3>

                <p>
                    ${game.description}
                </p>

                <div class="game-card-footer">

                    <span>
                        最佳 ${bestScore}
                    </span>

                    <button
                        class="primary-button game-play-button"
                        type="button"
                    >
                        開始遊戲
                    </button>

                </div>

            </div>
        `;

        card.addEventListener(
            "click",
            () => openGame(game)
        );

        return card;
    }

    /* =========================================
       Open Game
       ========================================= */

    function openGame(game) {

        if (!game || typeof game.launch !== "function") {
            console.error(
                "Mini Arcade：無法啟動遊戲。",
                game
            );

            return;
        }

        /*
         * 重要：
         * 如果目前已經有遊戲，
         * 先完整清理。
         *
         * 這修正了舊版 restart
         * 可能留下多個 timer / keyboard listener
         * 的問題。
         */
        destroyCurrentGame();

        currentGame = game;

        gameTitle.textContent =
            game.name;

        updateScore(0);

        gameContainer.innerHTML = "";

        gameModal.classList.remove("hidden");
        gameModal.classList.add("is-open");

        document.body.classList.add(
            "modal-open"
        );

        currentGameInstance =
            game.launch(
                gameContainer,
                {
                    updateScore,
                    recordScore
                }
            );

        MiniArcadeStorage.recordGamePlayed(game.id);
        renderGameLibrary();
    }

    /* =========================================
       Destroy Current Game
       ========================================= */

    function destroyCurrentGame() {

        if (
            currentGameInstance &&
            typeof currentGameInstance.destroy === "function"
        ) {

            currentGameInstance.destroy();
        }

        currentGameInstance = null;

        gameContainer.innerHTML = "";
    }

    /* =========================================
       Close Game
       ========================================= */

    function closeGame() {

        destroyCurrentGame();

        currentGame = null;

        gameModal.classList.add("hidden");
        gameModal.classList.remove(
            "is-open"
        );

        document.body.classList.remove(
            "modal-open"
        );

        /*
         * 如果遊戲視窗正在全螢幕，
         * 關閉遊戲時一併退出。
         */
        exitFullscreenIfNeeded();
    }

    /* =========================================
       Score
       ========================================= */

    function updateScore(score) {

        gameScore.textContent =
            `分數 ${score}`;
    }

    /**
     * 儲存遊戲結果
     */
    function recordScore(score) {

        if (!currentGame) {
            return;
        }

        const result =
            MiniArcadeStorage.saveScore(
                currentGame.id,
                score
            );

        /*
         * 如果創下新高，
         * 可以在之後加入動畫 / Toast。
         *
         * 目前先重新整理遊戲卡片。
         */
        renderGameLibrary();

        return result;
    }

    /* =========================================
       Restart
       ========================================= */

    function restartGame() {

        if (!currentGame) {
            return;
        }

        /*
         * openGame() 會先 destroy
         * 舊的遊戲 instance。
         */
        openGame(currentGame);
    }

    /* =========================================
       Pause
       ========================================= */

    function togglePause() {

        if (
            currentGameInstance &&
            typeof currentGameInstance.togglePause === "function"
        ) {

            currentGameInstance.togglePause();
        }
    }

    /* =========================================
       Instructions
       ========================================= */

    function showInstructions() {

        if (!currentGame) {
            return;
        }

        instructionsContent.innerHTML =
            currentGame.instructions;

        instructionsModal.classList.remove("hidden");
        instructionsModal.classList.add(
            "is-open"
        );
    }

    function hideInstructions() {

        instructionsModal.classList.add("hidden");
        instructionsModal.classList.remove(
            "is-open"
        );
    }

    /* =========================================
       Theme
       ========================================= */

    function initializeTheme() {

        const savedTheme =
            MiniArcadeStorage.getSetting(
                "miniArcade_theme"
            );

        if (
            savedTheme === "dark" ||
            savedTheme === "light"
        ) {

            applyTheme(savedTheme);

            return;
        }

        const prefersDark =
            window.matchMedia(
                "(prefers-color-scheme: dark)"
            ).matches;

        applyTheme(
            prefersDark
                ? "dark"
                : "light"
        );
    }

    function applyTheme(theme) {

        document.documentElement.dataset.theme =
            theme;

        MiniArcadeStorage.setSetting(
            "miniArcade_theme",
            theme
        );

        themeButton.textContent =
            theme === "dark"
                ? "☀"
                : "◐";

        themeButton.setAttribute(
            "aria-label",
            theme === "dark"
                ? "切換為淺色模式"
                : "切換為深色模式"
        );

        /*
         * 如果目前正在玩遊戲，
         * 主題切換後立即重繪。
         */
        if (
            currentGameInstance &&
            typeof currentGameInstance.refresh === "function"
        ) {

            currentGameInstance.refresh();
        }
    }

    function toggleTheme() {

        const currentTheme =
            document.documentElement.dataset.theme;

        applyTheme(
            currentTheme === "dark"
                ? "light"
                : "dark"
        );
    }

    /* =========================================
       Fullscreen
       ========================================= */

    function getFullscreenElement() {
        return (
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            null
        );
    }

    async function toggleFullscreen(
        element = document.documentElement
    ) {

        try {

            if (getFullscreenElement() === element) {

                const exitFullscreen =
                    document.exitFullscreen ||
                    document.webkitExitFullscreen;

                if (typeof exitFullscreen !== "function") {
                    console.warn(
                        "Mini Arcade：此瀏覽器不支援退出全螢幕。"
                    );

                    return;
                }

                await exitFullscreen.call(document);

            } else {

                const requestFullscreen =
                    element.requestFullscreen ||
                    element.webkitRequestFullscreen;

                if (typeof requestFullscreen !== "function") {
                    console.warn(
                        "Mini Arcade：此瀏覽器不支援全螢幕。"
                    );

                    return;
                }

                await requestFullscreen.call(element);
            }

        } catch (error) {

            console.warn(
                "Mini Arcade：無法切換全螢幕。",
                error
            );
        }
    }

    async function exitFullscreenIfNeeded() {

        while (getFullscreenElement()) {

            const exitFullscreen =
                document.exitFullscreen ||
                document.webkitExitFullscreen;

            if (typeof exitFullscreen !== "function") {
                console.warn(
                    "Mini Arcade：此瀏覽器不支援退出全螢幕。"
                );

                return;
            }

            try {
                await exitFullscreen.call(document);
            } catch (error) {
                console.warn(
                    "Mini Arcade：無法退出全螢幕。",
                    error
                );
                return;
            }
        }
    }

    /* =========================================
       Button Events
       ========================================= */

    function initializeButtons() {

        /* 主題 */

        themeButton.addEventListener(
            "click",
            toggleTheme
        );

        /* 網頁全螢幕 */

        fullscreenButton.addEventListener(
            "click",
            () => toggleFullscreen()
        );

        /* 遊戲全螢幕 */

        gameFullscreenButton.addEventListener(
            "click",
            () => {

                const gameWindow =
                    document.querySelector(
                        ".game-window"
                    );

                if (gameWindow) {
                    toggleFullscreen(gameWindow);
                }
            }
        );

        /* 關閉遊戲 */

        closeGameButton.addEventListener(
            "click",
            closeGame
        );

        /* 點擊遊戲視窗外的背景 */

        gameModal.addEventListener(
            "click",
            event => {

                if (
                    event.target === gameModal ||
                    event.target ===
                        gameModal.querySelector(
                            ".modal-backdrop"
                        )
                ) {

                    closeGame();
                }
            }
        );

        /* 暫停 */

        pauseButton.addEventListener(
            "click",
            togglePause
        );

        /* 重新開始 */

        restartButton.addEventListener(
            "click",
            restartGame
        );

        /* 遊戲說明 */

        instructionsButton.addEventListener(
            "click",
            showInstructions
        );

        /* 關閉說明 */

        closeInstructionsButton.addEventListener(
            "click",
            hideInstructions
        );

        /* 點擊說明背景 */

        instructionsModal.addEventListener(
            "click",
            event => {

                if (
                    event.target ===
                    instructionsModal
                ) {

                    hideInstructions();
                }
            }
        );

        /* Escape */

        document.addEventListener(
            "keydown",
            event => {

                if (event.key !== "Escape") {
                    return;
                }

                if (
                    instructionsModal.classList.contains(
                        "is-open"
                    )
                ) {

                    hideInstructions();

                    return;
                }

                /*
                 * 如果正在遊戲全螢幕，
                 * Escape 交給瀏覽器處理。
                 */
            }
        );
    }

    /* =========================================
       Start Application
       ========================================= */

    initializeApp();

})();