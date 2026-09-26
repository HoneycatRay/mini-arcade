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

    const games = [
        window.MiniArcadeGames.snake
    ];

    /* =========================================
       DOM
       ========================================= */

    const gameGrid =
        document.getElementById("gameGrid");

    const gameCount =
        document.getElementById("gameCount");

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

    /* =========================================
       Initialize
       ========================================= */

    function initializeApp() {

        initializeTheme();

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

        games.forEach(game => {

            const card =
                createGameCard(game);

            gameGrid.appendChild(card);
        });
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

        const playButton =
            card.querySelector(
                ".game-play-button"
            );

        playButton.addEventListener(
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
            localStorage.getItem(
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

        localStorage.setItem(
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

    async function toggleFullscreen(
        element = document.documentElement
    ) {

        try {

            if (!document.fullscreenElement) {

                await element.requestFullscreen();

            } else {

                await document.exitFullscreen();
            }

        } catch (error) {

            console.warn(
                "Mini Arcade：無法切換全螢幕。",
                error
            );
        }
    }

    function exitFullscreenIfNeeded() {

        if (document.fullscreenElement) {

            document
                .exitFullscreen()
                .catch(() => {});
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