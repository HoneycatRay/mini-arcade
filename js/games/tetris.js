/**
 * Mini Arcade
 * Tetris Game
 */

window.MiniArcadeGames = window.MiniArcadeGames || {};

window.MiniArcadeGames.tetris = {

    id: "tetris",

    name: "俄羅斯方塊",

    icon: "🧩",

    description: "旋轉並排列方塊，消除完整橫列取得高分。",

    category: "Puzzle",

    instructions: `
        <p><strong>遊戲目標</strong></p>

        <p>
            移動、旋轉落下的方塊，填滿整個橫列即可消除並得分。
            方塊堆到棋盤頂端時遊戲結束。
        </p>

        <p><strong>鍵盤操作</strong></p>

        <ul>
            <li>← / →：左右移動</li>
            <li>↓：加速下落</li>
            <li>Q：逆時針旋轉</li>
            <li>E：順時針旋轉</li>
            <li>空白鍵：直接落到底</li>
            <li>P：暫停 / 繼續</li>
        </ul>

        <p>
            手機或平板可使用棋盤下方的操作按鈕。
            每次消除一至四列分別得 100、300、500、800 分，
            分數會隨等級提升。
        </p>
    `,

    launch(container, api) {
        const columns = 10;
        const rows = 20;
        const cellSize = 30;
        const boardWidth = columns * cellSize;
        const boardHeight = rows * cellSize;
        const gravityBaseDelay = 900;
        const minimumGravityDelay = 100;

        const pieceShapes = {
            I: [
                [1, 1, 1, 1]
            ],
            O: [
                [1, 1],
                [1, 1]
            ],
            T: [
                [0, 1, 0],
                [1, 1, 1]
            ],
            S: [
                [0, 1, 1],
                [1, 1, 0]
            ],
            Z: [
                [1, 1, 0],
                [0, 1, 1]
            ],
            J: [
                [1, 0, 0],
                [1, 1, 1]
            ],
            L: [
                [0, 0, 1],
                [1, 1, 1]
            ]
        };

        const pieceColors = {
            I: "#42c7d5",
            O: "#f2c94c",
            T: "#a978e8",
            S: "#65c979",
            Z: "#ee6b72",
            J: "#6489e8",
            L: "#f29b52"
        };

        const wrapper = document.createElement("section");
        const gameLayout = document.createElement("div");
        const canvas = document.createElement("canvas");
        const sidebar = document.createElement("aside");
        const nextTitle = document.createElement("h3");
        const nextCanvas = document.createElement("canvas");
        const linesDisplay = document.createElement("p");
        const levelDisplay = document.createElement("p");
        const statusElement = document.createElement("p");
        const controls = document.createElement("div");
        const controlButtons = [];

        wrapper.className = "tetris-game";
        gameLayout.className = "tetris-layout";

        canvas.className = "tetris-board";
        canvas.width = boardWidth;
        canvas.height = boardHeight;
        canvas.setAttribute("role", "img");
        canvas.setAttribute(
            "aria-label",
            "俄羅斯方塊棋盤"
        );

        nextCanvas.className = "tetris-next-piece";
        nextCanvas.width = 120;
        nextCanvas.height = 100;
        nextCanvas.setAttribute("aria-hidden", "true");

        nextTitle.className = "tetris-next-title";
        nextTitle.textContent = "下一個";

        sidebar.className = "tetris-sidebar";
        linesDisplay.className = "tetris-stat";
        levelDisplay.className = "tetris-stat";

        statusElement.className = "tetris-status";
        statusElement.setAttribute("aria-live", "polite");
        statusElement.textContent =
            "排列方塊，填滿橫列以消除。";

        controls.className = "tetris-touch-controls";
        controls.setAttribute("aria-label", "方塊操作");

        const boardContext = canvas.getContext("2d");
        const nextContext = nextCanvas.getContext("2d");

        if (!boardContext || !nextContext) {
            throw new Error(
                "Mini Arcade：瀏覽器無法建立 Tetris 畫布。"
            );
        }

        const board = Array.from(
            { length: rows },
            () => Array(columns).fill(null)
        );

        let pieceBag = [];
        let currentPiece = null;
        let nextPieceType = null;
        let score = 0;
        let clearedLines = 0;
        let level = 1;
        let gravityTimer = null;
        let paused = false;
        let gameOver = false;
        let destroyed = false;

        function createButton(label, action, accessibleLabel) {
            const button = document.createElement("button");

            button.className = "tetris-control-button";
            button.type = "button";
            button.textContent = label;
            button.setAttribute("aria-label", accessibleLabel);

            const handleClick = () => {
                if (!paused && !gameOver && !destroyed) {
                    action();
                }
            };

            button.addEventListener("click", handleClick);
            controlButtons.push({
                button,
                handleClick
            });
            controls.appendChild(button);
        }

        createButton("↶", () => rotatePiece(-1), "逆時針旋轉");
        createButton("←", () => movePiece(-1, 0), "向左移動");
        createButton("↓", () => softDrop(), "加速下落");
        createButton("→", () => movePiece(1, 0), "向右移動");
        createButton("↻", () => rotatePiece(1), "順時針旋轉");
        createButton("⤓", () => hardDrop(), "直接落到底");

        sidebar.appendChild(nextTitle);
        sidebar.appendChild(nextCanvas);
        sidebar.appendChild(linesDisplay);
        sidebar.appendChild(levelDisplay);
        gameLayout.appendChild(canvas);
        gameLayout.appendChild(sidebar);
        wrapper.appendChild(gameLayout);
        wrapper.appendChild(statusElement);
        wrapper.appendChild(controls);
        container.appendChild(wrapper);

        function cloneShape(shape) {
            return shape.map(row => row.slice());
        }

        function refillBag() {
            pieceBag = Object.keys(pieceShapes);

            for (let index = pieceBag.length - 1; index > 0; index--) {
                const swapIndex = Math.floor(
                    Math.random() * (index + 1)
                );

                [
                    pieceBag[index],
                    pieceBag[swapIndex]
                ] = [
                    pieceBag[swapIndex],
                    pieceBag[index]
                ];
            }
        }

        function takePieceType() {
            if (pieceBag.length === 0) {
                refillBag();
            }

            return pieceBag.pop();
        }

        function createPiece(type) {
            const shape = cloneShape(pieceShapes[type]);

            return {
                type,
                shape,
                x: Math.floor((columns - shape[0].length) / 2),
                y: 0
            };
        }

        function spawnPiece() {
            currentPiece = createPiece(nextPieceType);
            nextPieceType = takePieceType();
            drawNextPiece();

            if (hasCollision(currentPiece, currentPiece.x, currentPiece.y)) {
                finishGame();
            }
        }

        function hasCollision(piece, offsetX, offsetY) {
            for (let row = 0; row < piece.shape.length; row++) {
                for (
                    let column = 0;
                    column < piece.shape[row].length;
                    column++
                ) {
                    if (!piece.shape[row][column]) {
                        continue;
                    }

                    const boardX = offsetX + column;
                    const boardY = offsetY + row;

                    if (
                        boardX < 0 ||
                        boardX >= columns ||
                        boardY >= rows ||
                        (
                            boardY >= 0 &&
                            board[boardY][boardX] !== null
                        )
                    ) {
                        return true;
                    }
                }
            }

            return false;
        }

        function movePiece(offsetX, offsetY) {
            if (!currentPiece || paused || gameOver || destroyed) {
                return false;
            }

            const nextX = currentPiece.x + offsetX;
            const nextY = currentPiece.y + offsetY;

            if (hasCollision(currentPiece, nextX, nextY)) {
                return false;
            }

            currentPiece.x = nextX;
            currentPiece.y = nextY;
            draw();
            return true;
        }

        function rotateMatrix(matrix, direction) {
            const transposed = matrix[0].map((_, column) =>
                matrix.map(row => row[column])
            );

            if (direction > 0) {
                return transposed.map(row => row.reverse());
            }

            return transposed.reverse();
        }

        function rotatePiece(direction) {
            if (!currentPiece || paused || gameOver || destroyed) {
                return;
            }

            if (currentPiece.type === "O") {
                return;
            }

            const rotatedShape = rotateMatrix(
                currentPiece.shape,
                direction
            );

            for (const kick of [0, -1, 1, -2, 2]) {
                if (
                    !hasCollision(
                        { ...currentPiece, shape: rotatedShape },
                        currentPiece.x + kick,
                        currentPiece.y
                    )
                ) {
                    currentPiece.shape = rotatedShape;
                    currentPiece.x += kick;
                    draw();
                    return;
                }
            }
        }

        function softDrop() {
            if (movePiece(0, 1)) {
                score += 1;
                api.updateScore(score);
            } else {
                lockPiece();
            }
        }

        function hardDrop() {
            if (!currentPiece || paused || gameOver || destroyed) {
                return;
            }

            let dropDistance = 0;

            while (
                !hasCollision(
                    currentPiece,
                    currentPiece.x,
                    currentPiece.y + 1
                )
            ) {
                currentPiece.y++;
                dropDistance++;
            }

            score += dropDistance * 2;
            api.updateScore(score);
            lockPiece();
        }

        function lockPiece() {
            if (!currentPiece || gameOver || destroyed) {
                return;
            }

            let isAboveBoard = false;

            currentPiece.shape.forEach((row, rowIndex) => {
                row.forEach((value, columnIndex) => {
                    if (!value) {
                        return;
                    }

                    const boardX = currentPiece.x + columnIndex;
                    const boardY = currentPiece.y + rowIndex;

                    if (boardY < 0) {
                        isAboveBoard = true;
                        return;
                    }

                    board[boardY][boardX] = currentPiece.type;
                });
            });

            if (isAboveBoard) {
                finishGame();
                return;
            }

            clearCompletedLines();
            spawnPiece();
            draw();
        }

        function clearCompletedLines() {
            let removedLines = 0;

            for (let row = rows - 1; row >= 0; row--) {
                if (board[row].every(cell => cell !== null)) {
                    board.splice(row, 1);
                    board.unshift(Array(columns).fill(null));
                    removedLines++;
                    row++;
                }
            }

            if (removedLines === 0) {
                return;
            }

            const lineScores = [0, 100, 300, 500, 800];
            score += lineScores[removedLines] * level;
            clearedLines += removedLines;
            level = Math.floor(clearedLines / 10) + 1;

            linesDisplay.textContent = `消除 ${clearedLines} 列`;
            levelDisplay.textContent = `等級 ${level}`;
            statusElement.textContent =
                `消除 ${removedLines} 列！`;

            api.updateScore(score);
            startGravityTimer();
        }

        function drawCell(context, x, y, color, size = cellSize) {
            context.fillStyle = color;
            context.fillRect(
                x * size + 1,
                y * size + 1,
                size - 2,
                size - 2
            );

            context.strokeStyle =
                "rgba(255, 255, 255, 0.22)";
            context.lineWidth = 1;
            context.strokeRect(
                x * size + 1.5,
                y * size + 1.5,
                size - 3,
                size - 3
            );
        }

        function getGhostY() {
            if (!currentPiece) {
                return 0;
            }

            let ghostY = currentPiece.y;

            while (
                !hasCollision(
                    currentPiece,
                    currentPiece.x,
                    ghostY + 1
                )
            ) {
                ghostY++;
            }

            return ghostY;
        }

        function drawPiece(piece, y, color) {
            piece.shape.forEach((row, rowIndex) => {
                row.forEach((value, columnIndex) => {
                    if (value) {
                        drawCell(
                            boardContext,
                            piece.x + columnIndex,
                            y + rowIndex,
                            color
                        );
                    }
                });
            });
        }

        function drawNextPiece() {
            nextContext.clearRect(
                0,
                0,
                nextCanvas.width,
                nextCanvas.height
            );

            if (!nextPieceType) {
                return;
            }

            const shape = pieceShapes[nextPieceType];
            const previewCellSize = 22;
            const offsetX = Math.floor(
                (nextCanvas.width -
                    shape[0].length * previewCellSize) /
                    2
            );
            const offsetY = Math.floor(
                (nextCanvas.height -
                    shape.length * previewCellSize) /
                    2
            );

            shape.forEach((row, rowIndex) => {
                row.forEach((value, columnIndex) => {
                    if (!value) {
                        return;
                    }

                    nextContext.fillStyle = pieceColors[nextPieceType];
                    nextContext.fillRect(
                        offsetX + columnIndex * previewCellSize + 1,
                        offsetY + rowIndex * previewCellSize + 1,
                        previewCellSize - 2,
                        previewCellSize - 2
                    );
                });
            });
        }

        function drawOverlay(title, subtitle) {
            boardContext.fillStyle =
                "rgba(12, 14, 20, 0.76)";
            boardContext.fillRect(
                0,
                0,
                boardWidth,
                boardHeight
            );

            boardContext.textAlign = "center";
            boardContext.textBaseline = "middle";
            boardContext.fillStyle = "#ffffff";
            boardContext.font =
                "700 30px -apple-system, BlinkMacSystemFont, sans-serif";
            boardContext.fillText(
                title,
                boardWidth / 2,
                boardHeight / 2 - 18
            );

            boardContext.fillStyle =
                "rgba(255, 255, 255, 0.78)";
            boardContext.font =
                "500 15px -apple-system, BlinkMacSystemFont, sans-serif";
            boardContext.fillText(
                subtitle,
                boardWidth / 2,
                boardHeight / 2 + 22
            );
        }

        function draw() {
            const isDark = (
                document.documentElement.dataset.theme === "dark"
            );

            boardContext.fillStyle = isDark
                ? "#17171b"
                : "#f0f1f5";
            boardContext.fillRect(
                0,
                0,
                boardWidth,
                boardHeight
            );

            boardContext.strokeStyle = isDark
                ? "rgba(255, 255, 255, 0.055)"
                : "rgba(0, 0, 0, 0.055)";
            boardContext.lineWidth = 1;

            for (let column = 0; column <= columns; column++) {
                boardContext.beginPath();
                boardContext.moveTo(column * cellSize, 0);
                boardContext.lineTo(
                    column * cellSize,
                    boardHeight
                );
                boardContext.stroke();
            }

            for (let row = 0; row <= rows; row++) {
                boardContext.beginPath();
                boardContext.moveTo(0, row * cellSize);
                boardContext.lineTo(
                    boardWidth,
                    row * cellSize
                );
                boardContext.stroke();
            }

            board.forEach((row, rowIndex) => {
                row.forEach((type, columnIndex) => {
                    if (type) {
                        drawCell(
                            boardContext,
                            columnIndex,
                            rowIndex,
                            pieceColors[type]
                        );
                    }
                });
            });

            if (currentPiece && !gameOver) {
                const ghostY = getGhostY();

                if (ghostY !== currentPiece.y) {
                    drawPiece(
                        currentPiece,
                        ghostY,
                        isDark
                            ? "rgba(255, 255, 255, 0.16)"
                            : "rgba(42, 48, 62, 0.18)"
                    );
                }

                drawPiece(
                    currentPiece,
                    currentPiece.y,
                    pieceColors[currentPiece.type]
                );
            }

            if (paused) {
                drawOverlay("已暫停", "按 P 或平台暫停按鈕繼續");
            } else if (gameOver) {
                drawOverlay("遊戲結束", `得分 ${score}`);
            }
        }

        function finishGame() {
            if (gameOver) {
                return;
            }

            gameOver = true;
            stopGravityTimer();
            statusElement.textContent =
                `遊戲結束，共消除 ${clearedLines} 列。`;
            api.recordScore(score);
            draw();
        }

        function getGravityDelay() {
            return Math.max(
                minimumGravityDelay,
                gravityBaseDelay * Math.pow(0.82, level - 1)
            );
        }

        function startGravityTimer() {
            stopGravityTimer();
            gravityTimer = window.setInterval(
                () => {
                    if (!movePiece(0, 1)) {
                        lockPiece();
                    }
                },
                getGravityDelay()
            );
        }

        function stopGravityTimer() {
            if (gravityTimer !== null) {
                window.clearInterval(gravityTimer);
                gravityTimer = null;
            }
        }

        function togglePause() {
            if (gameOver || destroyed) {
                return;
            }

            paused = !paused;

            if (paused) {
                stopGravityTimer();
                statusElement.textContent = "已暫停";
            } else {
                statusElement.textContent =
                    "排列方塊，填滿橫列以消除。";
                startGravityTimer();
            }

            draw();
        }

        function handleKeyDown(event) {
            const key = event.key.toLowerCase();

            if (key === "p") {
                event.preventDefault();
                togglePause();
                return;
            }

            if (paused || gameOver || destroyed) {
                return;
            }

            if (
                key === "arrowleft" ||
                key === "arrowright" ||
                key === "arrowdown" ||
                key === "arrowup" ||
                key === "q" ||
                key === "e" ||
                key === " "
            ) {
                event.preventDefault();
            }

            if (key === "arrowleft" || key === "a") {
                movePiece(-1, 0);
            } else if (key === "arrowright" || key === "d") {
                movePiece(1, 0);
            } else if (key === "arrowdown" || key === "s") {
                softDrop();
            } else if (key === "e") {
                rotatePiece(1);
            } else if (key === "q") {
                rotatePiece(-1);
            } else if (key === " ") {
                hardDrop();
            }
        }

        function destroy() {
            if (destroyed) {
                return;
            }

            destroyed = true;
            stopGravityTimer();
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

            controlButtons.forEach(({ button, handleClick }) => {
                button.removeEventListener("click", handleClick);
            });
        }

        document.addEventListener("keydown", handleKeyDown);

        linesDisplay.textContent = "消除 0 列";
        levelDisplay.textContent = "等級 1";
        score = 0;
        nextPieceType = takePieceType();
        spawnPiece();
        api.updateScore(score);
        draw();
        startGravityTimer();

        return {
            togglePause,
            refresh: draw,
            destroy
        };
    }
};
