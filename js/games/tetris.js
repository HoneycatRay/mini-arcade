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
            方塊堆到棋盤頂端時遊戲結束。切換難度會重新開始本局。
        </p>

        <p><strong>鍵盤操作</strong></p>

        <ul>
            <li>← / →：左右移動</li>
            <li>↓：加速下落</li>
            <li>Q：逆時針旋轉</li>
            <li>E：順時針旋轉</li>
            <li>空白鍵：直接落到底</li>
            <li>P：暫停 / 繼續</li>
            <li>方向移動可使用 WASD 或方向鍵，旋轉與其他快捷鍵可在設定面板自訂</li>
        </ul>

        <p>
            手機或平板可使用棋盤下方的操作按鈕。
            每次消除一至四列分別得 100、300、500、800 分，
            分數會隨等級提升。簡單、普通、困難會調整方塊下落速度；
            切換難度會重新開始本局。
        </p>
    `,

    launch(container, api) {
        const columns = 10;
        const rows = 20;
        const cellSize = 30;
        const boardWidth = columns * cellSize;
        const boardHeight = rows * cellSize;
        const difficultySetting =
            "miniArcade_tetris_difficulty";
        const difficulties = {
            easy: {
                label: "簡單",
                gravityBaseDelay: 1200,
                gravityLevelMultiplier: 0.84,
                minimumGravityDelay: 180
            },
            normal: {
                label: "普通",
                gravityBaseDelay: 900,
                gravityLevelMultiplier: 0.82,
                minimumGravityDelay: 100
            },
            hard: {
                label: "困難",
                gravityBaseDelay: 600,
                gravityLevelMultiplier: 0.78,
                minimumGravityDelay: 60
            }
        };
        const savedDifficulty =
            window.MiniArcadeStorage.getSetting(difficultySetting);
        let difficulty =
            Object.prototype.hasOwnProperty.call(
                difficulties,
                savedDifficulty
            )
                ? savedDifficulty
                : "normal";
        const keyBindingsSetting = "miniArcade_tetris_keyBindings";
        const defaultKeyBindings = {
            moveLeft: ["a", "arrowleft"],
            moveRight: ["d", "arrowright"],
            softDrop: ["s", "arrowdown"],
            rotateCounterclockwise: ["q"],
            rotateClockwise: ["e", "w", "arrowup"],
            hardDrop: [" "],
            pause: ["p"]
        };
        const keyBindingActions = [
            { id: "moveLeft", label: "向左移動" },
            { id: "moveRight", label: "向右移動" },
            { id: "softDrop", label: "加速下落" },
            { id: "rotateCounterclockwise", label: "逆時針旋轉" },
            { id: "rotateClockwise", label: "順時針旋轉" },
            { id: "hardDrop", label: "直接落到底" },
            { id: "pause", label: "暫停 / 繼續" }
        ];

        function normalizeBindingKey(key) {
            return key.toLowerCase();
        }

        function copyDefaultKeyBindings() {
            return Object.fromEntries(
                Object.entries(defaultKeyBindings).map(
                    ([id, keys]) => [id, [...keys]]
                )
            );
        }

        function loadKeyBindings() {
            const savedBindings = window.MiniArcadeStorage.getSetting(
                keyBindingsSetting
            );

            if (!savedBindings) {
                return copyDefaultKeyBindings();
            }

            try {
                const parsedBindings = JSON.parse(savedBindings);
                const bindings = copyDefaultKeyBindings();

                if (
                    !parsedBindings ||
                    typeof parsedBindings !== "object" ||
                    Array.isArray(parsedBindings)
                ) {
                    throw new TypeError("快捷鍵設定格式無效。");
                }

                keyBindingActions.forEach(({ id }) => {
                    const savedKeys = parsedBindings[id];

                    if (typeof savedKeys === "string") {
                        const normalizedKey =
                            normalizeBindingKey(savedKeys);
                        const previousDefault =
                            id === "moveLeft"
                                ? "arrowleft"
                                : id === "moveRight"
                                    ? "arrowright"
                                    : id === "softDrop"
                                        ? "arrowdown"
                                        : id === "rotateClockwise"
                                            ? "e"
                                            : null;

                        bindings[id] =
                            normalizedKey === previousDefault
                                ? [...defaultKeyBindings[id]]
                                : [normalizedKey];
                    } else if (Array.isArray(savedKeys)) {
                        bindings[id] = savedKeys.map(key =>
                            typeof key === "string"
                                ? normalizeBindingKey(key)
                                : key
                        );
                    }
                });

                const values = keyBindingActions.flatMap(
                    ({ id }) => bindings[id]
                );

                if (
                    keyBindingActions.every(({ id }) =>
                        Array.isArray(bindings[id]) &&
                        bindings[id].length > 0 &&
                        bindings[id].every(value => typeof value === "string")
                    ) &&
                    values.every(value =>
                        typeof value === "string" &&
                        (
                            value === " " ||
                            value === "arrowleft" ||
                            value === "arrowright" ||
                            value === "arrowup" ||
                            value === "arrowdown" ||
                            /^[a-z0-9]$/i.test(value)
                        )
                    ) &&
                    values.every(value => normalizeBindingKey(value) !== "r") &&
                    keyBindingActions.every(({ id }, index, actions) =>
                        actions.slice(index + 1).every(({ id: otherId }) =>
                            !bindings[id].some(key =>
                                bindings[otherId].includes(key)
                            )
                        )
                    ) &&
                    keyBindingActions.every(({ id }) =>
                        new Set(bindings[id]).size === bindings[id].length
                    )
                ) {
                    return bindings;
                }
            } catch (error) {
                console.warn(
                    "Mini Arcade：無法讀取俄羅斯方塊快捷鍵設定，改用預設按鍵。",
                    error
                );
                return copyDefaultKeyBindings();
            }

            console.warn(
                "Mini Arcade：俄羅斯方塊快捷鍵設定無效，改用預設按鍵。"
            );
            return copyDefaultKeyBindings();
        }

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
        const difficultyLabel = document.createElement("label");
        const difficultySelect = document.createElement("select");
        const linesDisplay = document.createElement("p");
        const levelDisplay = document.createElement("p");
        const keyBindingsToggle = document.createElement("button");
        const keyBindingsPanel = document.createElement("div");
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

        difficultyLabel.className = "tetris-difficulty-label";
        difficultyLabel.textContent = "難度";
        difficultyLabel.htmlFor = "tetrisDifficulty";

        difficultySelect.className = "tetris-difficulty-select";
        difficultySelect.id = "tetrisDifficulty";
        difficultySelect.setAttribute("aria-label", "俄羅斯方塊難度");
        Object.entries(difficulties).forEach(([value, option]) => {
            const element = document.createElement("option");

            element.value = value;
            element.textContent = option.label;
            difficultySelect.appendChild(element);
        });
        difficultySelect.value = difficulty;

        sidebar.className = "tetris-sidebar";
        linesDisplay.className = "tetris-stat";
        levelDisplay.className = "tetris-stat";

        keyBindingsToggle.className =
            "tetris-keybindings-toggle";
        keyBindingsToggle.type = "button";
        keyBindingsToggle.textContent = "快捷鍵設定";
        keyBindingsToggle.setAttribute("aria-expanded", "false");

        keyBindingsPanel.className = "tetris-keybindings";
        keyBindingsPanel.hidden = true;
        keyBindingsPanel.setAttribute(
            "aria-label",
            "俄羅斯方塊快捷鍵設定"
        );

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
        let activeBindingAction = null;
        const keyBindings = loadKeyBindings();
        const keyBindingRows = new Map();

        function getKeyLabel(key) {
            const labels = {
                arrowleft: "←",
                arrowright: "→",
                arrowup: "↑",
                arrowdown: "↓",
                " ": "Space"
            };

            return labels[normalizeBindingKey(key)] || key.toUpperCase();
        }

        function renderKeyBindings() {
            keyBindingActions.forEach(({ id }) => {
                const row = keyBindingRows.get(id);

                if (!row) {
                    return;
                }

                row.keysElement.replaceChildren();
                keyBindings[id].forEach(key => {
                    const keyButton = document.createElement("button");

                    keyButton.className = "tetris-key-binding";
                    keyButton.type = "button";
                    keyButton.textContent = getKeyLabel(key);
                    keyButton.setAttribute(
                        "aria-label",
                        `${row.label}快捷鍵 ${getKeyLabel(key)}，按此移除`
                    );
                    keyButton.addEventListener("click", () => {
                        if (keyBindings[id].length === 1) {
                            statusElement.textContent =
                                "每項操作至少需要保留一個快捷鍵。";
                            return;
                        }

                        keyBindings[id] = keyBindings[id].filter(
                            assignedKey => assignedKey !== key
                        );
                        saveKeyBindings("快捷鍵已更新。");
                    });
                    row.keysElement.appendChild(keyButton);
                });

                row.addButton.textContent =
                    activeBindingAction === id ? "按下按鍵…" : "＋";
                row.addButton.classList.toggle(
                    "is-listening",
                    activeBindingAction === id
                );
            });

            wrapper.classList.toggle(
                "is-capturing-key",
                activeBindingAction !== null
            );
        }

        function saveKeyBindings(successMessage) {
            const persisted = window.MiniArcadeStorage.setSetting(
                keyBindingsSetting,
                JSON.stringify(keyBindings)
            );

            activeBindingAction = null;
            statusElement.textContent = persisted
                ? successMessage
                : `${successMessage}但無法寫入瀏覽器儲存空間，設定只套用於本次工作階段。`;
            renderKeyBindings();
        }

        function beginKeyBinding(actionId) {
            activeBindingAction = actionId;
            statusElement.textContent =
                "請按下要新增的快捷鍵；Escape 取消，R 保留為重新開始。";
            renderKeyBindings();
        }

        function handleKeyBindingCapture(event) {
            if (activeBindingAction === null) {
                return false;
            }

            event.preventDefault();

            if (event.key === "Escape") {
                activeBindingAction = null;
                statusElement.textContent =
                    "排列方塊，填滿橫列以消除。";
                renderKeyBindings();
                return true;
            }

            if (
                event.repeat ||
                event.ctrlKey ||
                event.altKey ||
                event.metaKey
            ) {
                return true;
            }

            const key = normalizeBindingKey(event.key);
            const isSupportedKey =
                key === " " ||
                key === "arrowleft" ||
                key === "arrowright" ||
                key === "arrowup" ||
                key === "arrowdown" ||
                /^[a-z0-9]$/i.test(key);

            if (!isSupportedKey) {
                statusElement.textContent =
                    "請使用英文字母、數字、方向鍵或空白鍵。";
                return true;
            }

            if (key === "r") {
                statusElement.textContent =
                    "R 保留為所有遊戲的重新開始快捷鍵。";
                return true;
            }

            const conflictingAction = keyBindingActions.find(({ id }) =>
                id !== activeBindingAction &&
                keyBindings[id].includes(key)
            );

            if (conflictingAction) {
                statusElement.textContent =
                    `此按鍵已用於「${conflictingAction.label}」，請選擇其他按鍵。`;
                return true;
            }

            if (keyBindings[activeBindingAction].includes(key)) {
                statusElement.textContent =
                    "此操作已包含該快捷鍵。";
                return true;
            }

            keyBindings[activeBindingAction].push(key);
            saveKeyBindings("快捷鍵已新增並儲存。");
            return true;
        }

        keyBindingActions.forEach(({ id, label }) => {
            const row = document.createElement("div");
            const actionLabel = document.createElement("span");
            const keysElement = document.createElement("div");
            const addButton = document.createElement("button");

            row.className = "tetris-keybinding-row";
            actionLabel.textContent = label;
            keysElement.className = "tetris-keybinding-keys";
            addButton.className = "tetris-key-binding tetris-key-binding-add";
            addButton.type = "button";
            addButton.setAttribute("aria-label", `新增${label}快捷鍵`);

            const handleClick = () => {
                beginKeyBinding(id);
            };

            addButton.addEventListener("click", handleClick);
            keyBindingRows.set(id, {
                label,
                keysElement,
                addButton,
                handleClick
            });
            row.appendChild(actionLabel);
            row.appendChild(keysElement);
            row.appendChild(addButton);
            keyBindingsPanel.appendChild(row);
        });

        const restoreDefaultsButton = document.createElement("button");
        restoreDefaultsButton.className =
            "tetris-keybindings-restore";
        restoreDefaultsButton.type = "button";
        restoreDefaultsButton.textContent = "恢復預設值";

        function restoreDefaultKeyBindings() {
            Object.keys(defaultKeyBindings).forEach(id => {
                keyBindings[id] = [...defaultKeyBindings[id]];
            });
            activeBindingAction = null;
            saveKeyBindings("已恢復預設快捷鍵。");
        }

        restoreDefaultsButton.addEventListener(
            "click",
            restoreDefaultKeyBindings
        );
        keyBindingsPanel.appendChild(restoreDefaultsButton);

        renderKeyBindings();

        function toggleKeyBindings() {
            keyBindingsPanel.hidden = !keyBindingsPanel.hidden;
            keyBindingsToggle.setAttribute(
                "aria-expanded",
                String(!keyBindingsPanel.hidden)
            );
        }

        keyBindingsToggle.addEventListener(
            "click",
            toggleKeyBindings
        );

        function createButton(label, action, accessibleLabel) {
            const button = document.createElement("button");

            button.className = "tetris-control-button";
            button.type = "button";
            button.textContent = label;
            button.setAttribute("aria-label", accessibleLabel);

            const handleClick = () => {
                if (!paused && !gameOver && !destroyed) {
                    const actionSucceeded = action();

                    if (actionSucceeded !== false) {
                        api.reportValidAction?.();
                    } else {
                        api.reportInvalidAction?.();
                    }
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
        sidebar.appendChild(difficultyLabel);
        sidebar.appendChild(difficultySelect);
        sidebar.appendChild(linesDisplay);
        sidebar.appendChild(levelDisplay);
        sidebar.appendChild(keyBindingsToggle);
        sidebar.appendChild(keyBindingsPanel);
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
                return false;
            }

            if (currentPiece.type === "O") {
                return false;
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
                    return true;
                }
            }

            return false;
        }

        function softDrop() {
            if (movePiece(0, 1)) {
                score += 1;
                api.updateScore(score);
            } else {
                lockPiece();
            }

            return true;
        }

        function hardDrop() {
            if (!currentPiece || paused || gameOver || destroyed) {
                return false;
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
            return true;
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
                drawOverlay("遊戲結束", `得分 ${score} · 按 A、D 或 ← / → 重玩`);
            }
        }

        function finishGame() {
            if (gameOver) {
                return;
            }

            gameOver = true;
            stopGravityTimer();
            statusElement.textContent =
                `遊戲結束，共消除 ${clearedLines} 列。按 A、D 或 ← / → 重玩。`;
            api.recordScore(score);
            draw();
        }

        function resetForDifficulty() {
            stopGravityTimer();
            board.forEach(row => row.fill(null));
            pieceBag = [];
            currentPiece = null;
            score = 0;
            clearedLines = 0;
            level = 1;
            paused = false;
            gameOver = false;
            activeBindingAction = null;
            linesDisplay.textContent = "消除 0 列";
            levelDisplay.textContent = "等級 1";
            statusElement.textContent =
                `${difficulties[difficulty].label}難度：遊戲已重新開始。`;
            renderKeyBindings();
            api.markGameInProgress?.();
            nextPieceType = takePieceType();
            spawnPiece();
            api.updateScore(score);
            draw();
            startGravityTimer();
        }

        function handleDifficultyChange() {
            difficulty = difficultySelect.value;
            window.MiniArcadeStorage.setSetting(
                difficultySetting,
                difficulty
            );
            resetForDifficulty();
        }

        function getGravityDelay() {
            const settings = difficulties[difficulty];

            return Math.max(
                settings.minimumGravityDelay,
                settings.gravityBaseDelay *
                    Math.pow(
                        settings.gravityLevelMultiplier,
                        level - 1
                    )
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
            if (handleKeyBindingCapture(event)) {
                return;
            }

            const key = event.key.toLowerCase();

            if (keyBindings.pause.includes(key)) {
                event.preventDefault();
                togglePause();
                return;
            }

            if (paused || gameOver || destroyed) {
                return;
            }

            if (keyBindings.moveLeft.includes(key)) {
                event.preventDefault();
                if (!movePiece(-1, 0)) {
                    api.reportInvalidAction?.();
                } else {
                    api.reportValidAction?.();
                }
            } else if (keyBindings.moveRight.includes(key)) {
                event.preventDefault();
                if (!movePiece(1, 0)) {
                    api.reportInvalidAction?.();
                } else {
                    api.reportValidAction?.();
                }
            } else if (keyBindings.softDrop.includes(key)) {
                event.preventDefault();
                softDrop();
                api.reportValidAction?.();
            } else if (keyBindings.rotateClockwise.includes(key)) {
                event.preventDefault();
                if (rotatePiece(1)) {
                    api.reportValidAction?.();
                } else {
                    api.reportInvalidAction?.();
                }
            } else if (keyBindings.rotateCounterclockwise.includes(key)) {
                event.preventDefault();
                if (rotatePiece(-1)) {
                    api.reportValidAction?.();
                } else {
                    api.reportInvalidAction?.();
                }
            } else if (keyBindings.hardDrop.includes(key)) {
                event.preventDefault();
                hardDrop();
                api.reportValidAction?.();
            }
        }

        function destroy() {
            if (destroyed) {
                return;
            }

            destroyed = true;
            stopGravityTimer();
            keyBindingsToggle.removeEventListener(
                "click",
                toggleKeyBindings
            );
            difficultySelect.removeEventListener(
                "change",
                handleDifficultyChange
            );
            keyBindingRows.forEach(({ addButton, handleClick }) => {
                addButton.removeEventListener("click", handleClick);
            });
            restoreDefaultsButton.removeEventListener(
                "click",
                restoreDefaultKeyBindings
            );
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );

            controlButtons.forEach(({ button, handleClick }) => {
                button.removeEventListener("click", handleClick);
            });
        }

        document.addEventListener("keydown", handleKeyDown);
        difficultySelect.addEventListener(
            "change",
            handleDifficultyChange
        );

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
