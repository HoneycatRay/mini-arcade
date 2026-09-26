/**
 * Mini Arcade
 * Snake Game
 *
 * 貪吃蛇遊戲模組
 *
 * 遊戲本身不負責：
 * - Modal
 * - 主選單
 * - localStorage
 * - 主題
 * - 全螢幕
 *
 * 這些事情交給平台層 app.js。
 *
 * 遊戲只負責：
 * - 遊戲邏輯
 * - Canvas 繪圖
 * - 鍵盤控制
 * - 分數
 * - 暫停
 * - 結束
 */

window.MiniArcadeGames = window.MiniArcadeGames || {};

window.MiniArcadeGames.snake = {

    id: "snake",

    name: "貪吃蛇",

    icon: "🐍",

    description: "吃掉食物、變得更長，並避免撞到自己。",

    category: "Arcade",

    instructions: `
        <p><strong>遊戲目標</strong></p>

        <p>
            控制蛇吃掉紅色食物。
            每吃一個食物可以獲得 10 分，
            同時蛇會變長。
        </p>

        <p><strong>操作方式</strong></p>

        <ul>
            <li>↑ ↓ ← →：控制方向</li>
            <li>W A S D：控制方向</li>
            <li>空白鍵：暫停 / 繼續</li>
        </ul>

        <p><strong>遊戲結束</strong></p>

        <p>
            撞到牆壁或自己的身體時，
            遊戲就會結束。
        </p>
    `,

    /**
     * 啟動遊戲
     *
     * @param {HTMLElement} container
     * @param {Object} api
     */
    launch(container, api) {

        /* =========================================
           基本設定
           ========================================= */

        const canvas = document.createElement("canvas");

        canvas.className = "snake-canvas";

        const tileCount = 15;
        const canvasSize = 500;
        const gridSize = canvasSize / tileCount;
        const stepInterval = 200;

        canvas.width = canvasSize;
        canvas.height = canvasSize;

        const context = canvas.getContext("2d");

        /* =========================================
           DOM
           ========================================= */

        const wrapper = document.createElement("div");

        wrapper.className = "snake-game";

        wrapper.appendChild(canvas);

        container.appendChild(wrapper);

        /* =========================================
           Game State
           ========================================= */

        let snake = [
            {
                x: 10,
                y: 10
            }
        ];

        let direction = {
            x: 1,
            y: 0
        };

        let nextDirection = {
            x: 1,
            y: 0
        };

        let food = {
            x: 15,
            y: 10
        };

        let score = 0;

        let paused = false;

        let gameOver = false;

        let timer = null;

        let destroyed = false;

        /* =========================================
           Food
           ========================================= */

        function placeFood() {

            let newFood;

            do {
                newFood = {
                    x: Math.floor(Math.random() * tileCount),
                    y: Math.floor(Math.random() * tileCount)
                };

            } while (
                snake.some(segment =>
                    segment.x === newFood.x &&
                    segment.y === newFood.y
                )
            );

            food = newFood;
        }

        /* =========================================
           Theme
           ========================================= */

        function isDarkMode() {
            return document.documentElement.dataset.theme === "dark";
        }

        /* =========================================
           Drawing
           ========================================= */

        function draw() {

            const dark = isDarkMode();

            /* Background */

            context.fillStyle = dark
                ? "#161618"
                : "#f5f5f7";

            context.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );

            /* Grid */

            context.strokeStyle = dark
                ? "rgba(255,255,255,0.14)"
                : "rgba(0,0,0,0.12)";

            context.lineWidth = 2;

            for (let i = 0; i <= tileCount; i++) {

                const position = i * gridSize;

                context.beginPath();

                context.moveTo(
                    position,
                    0
                );

                context.lineTo(
                    position,
                    canvas.height
                );

                context.stroke();

                context.beginPath();

                context.moveTo(
                    0,
                    position
                );

                context.lineTo(
                    canvas.width,
                    position
                );

                context.stroke();
            }

            /* Food */

            context.fillStyle = "#ff3b30";

            drawRoundedRect(
                food.x * gridSize + 3,
                food.y * gridSize + 3,
                gridSize - 6,
                gridSize - 6,
                6
            );

            /* Snake */

            snake.forEach((segment, index) => {

                if (index === 0) {
                    context.fillStyle = "#007aff";
                } else {
                    context.fillStyle = "#34c759";
                }

                drawRoundedRect(
                    segment.x * gridSize + 2,
                    segment.y * gridSize + 2,
                    gridSize - 4,
                    gridSize - 4,
                    5
                );
            });

            /* Game Over */

            if (gameOver) {

                drawOverlay();

                drawOverlayText(
                    "遊戲結束",
                    `得分 ${score}`
                );
            }

            /* Paused */

            else if (paused) {

                drawOverlay();

                drawOverlayText(
                    "已暫停",
                    "按空白鍵繼續"
                );
            }
        }

        /**
         * 繪製圓角矩形
         */
        function drawRoundedRect(
            x,
            y,
            width,
            height,
            radius
        ) {

            context.beginPath();

            if (typeof context.roundRect === "function") {
                context.roundRect(
                    x,
                    y,
                    width,
                    height,
                    radius
                );
            } else {
                const cornerRadius = Math.min(
                    radius,
                    width / 2,
                    height / 2
                );

                context.moveTo(x + cornerRadius, y);
                context.lineTo(x + width - cornerRadius, y);
                context.quadraticCurveTo(
                    x + width,
                    y,
                    x + width,
                    y + cornerRadius
                );
                context.lineTo(x + width, y + height - cornerRadius);
                context.quadraticCurveTo(
                    x + width,
                    y + height,
                    x + width - cornerRadius,
                    y + height
                );
                context.lineTo(x + cornerRadius, y + height);
                context.quadraticCurveTo(
                    x,
                    y + height,
                    x,
                    y + height - cornerRadius
                );
                context.lineTo(x, y + cornerRadius);
                context.quadraticCurveTo(
                    x,
                    y,
                    x + cornerRadius,
                    y
                );
            }

            context.fill();
        }

        /**
         * Overlay
         */
        function drawOverlay() {

            context.fillStyle = isDarkMode()
                ? "rgba(0,0,0,0.58)"
                : "rgba(255,255,255,0.62)";

            context.fillRect(
                0,
                0,
                canvas.width,
                canvas.height
            );
        }

        /**
         * Overlay 文字
         */
        function drawOverlayText(
            title,
            subtitle
        ) {

            context.textAlign = "center";

            context.textBaseline = "middle";

            context.fillStyle = isDarkMode()
                ? "#ffffff"
                : "#111111";

            context.font =
                "700 32px -apple-system, BlinkMacSystemFont, sans-serif";

            context.fillText(
                title,
                canvas.width / 2,
                canvas.height / 2 - 20
            );

            context.fillStyle = isDarkMode()
                ? "rgba(255,255,255,0.72)"
                : "rgba(0,0,0,0.58)";

            context.font =
                "500 16px -apple-system, BlinkMacSystemFont, sans-serif";

            context.fillText(
                subtitle,
                canvas.width / 2,
                canvas.height / 2 + 24
            );
        }

        /* =========================================
           Collision
           ========================================= */

        function isSamePosition(a, b) {

            return (
                a.x === b.x &&
                a.y === b.y
            );
        }

        function hasCollision(head, isEating) {

            /* 撞牆 */

            if (
                head.x < 0 ||
                head.x >= tileCount ||
                head.y < 0 ||
                head.y >= tileCount
            ) {
                return true;
            }

            /* 撞到自己 */

            const segmentsToCheck = isEating
                ? snake
                : snake.slice(0, -1);

            return segmentsToCheck.some(segment =>
                isSamePosition(head, segment)
            );
        }

        /* =========================================
           Game Update
           ========================================= */

        function update() {

            if (
                paused ||
                gameOver ||
                destroyed
            ) {
                return;
            }

            direction = {
                ...nextDirection
            };

            const head = {
                x: snake[0].x + direction.x,
                y: snake[0].y + direction.y
            };

            /* Collision */

            const isEating = isSamePosition(head, food);

            if (hasCollision(head, isEating)) {

                endGame();

                return;
            }

            snake.unshift(head);

            /* Eat Food */

            if (isEating) {

                score += 10;

                api.updateScore(score);

                placeFood();

            } else {

                snake.pop();
            }

            draw();
        }

        /* =========================================
           Game Over
           ========================================= */

        function endGame() {

            gameOver = true;

            stopTimer();

            api.recordScore(score);

            draw();
        }

        /* =========================================
           Pause
           ========================================= */

        function togglePause() {

            if (gameOver) {
                return;
            }

            paused = !paused;

            draw();
        }

        /* =========================================
           Keyboard
           ========================================= */

        function handleKeyDown(event) {

            const key = event.key.toLowerCase();

            /* 防止遊戲中使用方向鍵捲動頁面 */

            const controlKeys = [
                "arrowup",
                "arrowdown",
                "arrowleft",
                "arrowright",
                "w",
                "a",
                "s",
                "d",
                " "
            ];

            if (controlKeys.includes(key)) {
                event.preventDefault();
            }

            /* 暫停 */

            if (key === " ") {

                togglePause();

                return;
            }

            if (
                paused ||
                gameOver
            ) {
                return;
            }

            /* 上 */

            if (
                key === "arrowup" ||
                key === "w"
            ) {

                if (direction.y !== 1) {

                    nextDirection = {
                        x: 0,
                        y: -1
                    };
                }
            }

            /* 下 */

            else if (
                key === "arrowdown" ||
                key === "s"
            ) {

                if (direction.y !== -1) {

                    nextDirection = {
                        x: 0,
                        y: 1
                    };
                }
            }

            /* 左 */

            else if (
                key === "arrowleft" ||
                key === "a"
            ) {

                if (direction.x !== 1) {

                    nextDirection = {
                        x: -1,
                        y: 0
                    };
                }
            }

            /* 右 */

            else if (
                key === "arrowright" ||
                key === "d"
            ) {

                if (direction.x !== -1) {

                    nextDirection = {
                        x: 1,
                        y: 0
                    };
                }
            }
        }

        /* =========================================
           Timer
           ========================================= */

        function startTimer() {

            stopTimer();

            timer = setInterval(
                update,
                stepInterval
            );
        }

        function stopTimer() {

            if (timer !== null) {

                clearInterval(timer);

                timer = null;
            }
        }

        /* =========================================
           Destroy
           ========================================= */

        function destroy() {

            if (destroyed) {
                return;
            }

            destroyed = true;

            stopTimer();

            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        }

        /* =========================================
           Event
           ========================================= */

        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        /* =========================================
           Start
           ========================================= */

        api.updateScore(0);

        placeFood();

        draw();

        startTimer();

        /* =========================================
           Game API
           ========================================= */

        return {
            togglePause,
            refresh: draw,
            destroy
        };
    }
};