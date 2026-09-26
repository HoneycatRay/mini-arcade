/**
 * Mini Arcade
 * 2048 Game
 */

window.MiniArcadeGames = window.MiniArcadeGames || {};

window.MiniArcadeGames.game2048 = {

    id: "2048",

    name: "2048",

    icon: "🔢",

    description: "滑動方塊，合併相同數字並挑戰 2048。",

    category: "Puzzle",

    instructions: `
        <p><strong>遊戲目標</strong></p>

        <p>
            合併相同數字的方塊，挑戰 2048。
            達成 2048 後仍可繼續遊玩；
            當棋盤沒有可移動的位置時，遊戲結束。
        </p>

        <p><strong>操作方式</strong></p>

        <ul>
            <li>↑ ↓ ← → 或 W A S D：移動方塊</li>
            <li>空白鍵：暫停 / 繼續</li>
            <li>手機或平板：在棋盤上滑動</li>
        </ul>

        <p>
            每次合併都會將合併後的數字加入分數。
            遊戲結束時會儲存本局結果。
        </p>
    `,

    launch(container, api) {
        const boardSize = 4;
        const targetValue = 2048;
        const prefersReducedMotion = window.matchMedia(
            "(prefers-reduced-motion: reduce)"
        ).matches;
        const boardElement = document.createElement("div");
        const statusElement = document.createElement("p");
        const wrapper = document.createElement("section");
        const cells = [];

        wrapper.className = "game-2048";
        boardElement.className = "board-2048";
        boardElement.setAttribute("role", "grid");
        boardElement.setAttribute("aria-label", "2048 遊戲棋盤");

        statusElement.className = "game-2048-status";
        statusElement.setAttribute("aria-live", "polite");
        statusElement.textContent = "使用方向鍵、WASD 或滑動棋盤移動";

        for (let index = 0; index < boardSize * boardSize; index++) {
            const cell = document.createElement("div");

            cell.className = "tile-2048";
            cell.setAttribute("role", "gridcell");
            cells.push(cell);
            boardElement.appendChild(cell);
        }

        wrapper.appendChild(statusElement);
        wrapper.appendChild(boardElement);
        container.appendChild(wrapper);

        let board = createEmptyBoard();
        let score = 0;
        let paused = false;
        let gameOver = false;
        let hasWon = false;
        let destroyed = false;
        let pointerStart = null;
        const tileAnimations = new Map();

        function createEmptyBoard() {
            return Array.from(
                { length: boardSize },
                () => Array(boardSize).fill(0)
            );
        }

        function cancelTileAnimations() {
            tileAnimations.forEach(animation => animation.cancel());
            tileAnimations.clear();
        }

        function animateTileMoves(moves) {
            if (
                moves.length === 0 ||
                prefersReducedMotion ||
                typeof Element.prototype.animate !== "function"
            ) {
                return;
            }

            cancelTileAnimations();

            const cellRects = cells.map(cell =>
                cell.getBoundingClientRect()
            );

            moves.forEach(({ fromIndex, toIndex }) => {
                const fromRect = cellRects[fromIndex];
                const toRect = cellRects[toIndex];
                const animation = cells[toIndex].animate(
                    [
                        {
                            transform: `translate(${fromRect.left - toRect.left}px, ${fromRect.top - toRect.top}px)`
                        },
                        { transform: "translate(0, 0)" }
                    ],
                    {
                        duration: 160,
                        easing: "ease-out"
                    }
                );

                tileAnimations.set(toIndex, animation);
                animation.onfinish = () => {
                    if (tileAnimations.get(toIndex) === animation) {
                        tileAnimations.delete(toIndex);
                    }
                };
            });
        }

        function render(tileMoves = []) {
            cells.forEach((cell, index) => {
                const row = Math.floor(index / boardSize);
                const column = index % boardSize;
                const value = board[row][column];

                cell.textContent = value === 0 ? "" : String(value);
                cell.dataset.value = value === 0 ? "0" : String(value);
                cell.setAttribute(
                    "aria-label",
                    value === 0 ? "空格" : String(value)
                );
            });

            wrapper.classList.toggle("is-paused", paused);
            wrapper.classList.toggle("is-game-over", gameOver);
            animateTileMoves(tileMoves);
        }

        function addRandomTile() {
            const emptyPositions = [];

            board.forEach((row, rowIndex) => {
                row.forEach((value, columnIndex) => {
                    if (value === 0) {
                        emptyPositions.push({
                            row: rowIndex,
                            column: columnIndex
                        });
                    }
                });
            });

            if (emptyPositions.length === 0) {
                return;
            }

            const position =
                emptyPositions[
                    Math.floor(Math.random() * emptyPositions.length)
                ];

            board[position.row][position.column] =
                Math.random() < 0.9 ? 2 : 4;
        }

        function getLineCoordinates(direction, lineIndex) {
            return Array.from({ length: boardSize }, (_, offset) => {
                if (direction === "left") {
                    return { row: lineIndex, column: offset };
                }

                if (direction === "right") {
                    return {
                        row: lineIndex,
                        column: boardSize - 1 - offset
                    };
                }

                if (direction === "up") {
                    return { row: offset, column: lineIndex };
                }

                return {
                    row: boardSize - 1 - offset,
                    column: lineIndex
                };
            });
        }

        function slide(direction) {
            if (paused || gameOver || destroyed) {
                return;
            }

            let hasMoved = false;
            let scoreIncrease = 0;
            const tileMoves = [];

            for (let lineIndex = 0; lineIndex < boardSize; lineIndex++) {
                const coordinates =
                    getLineCoordinates(direction, lineIndex);
                const originalValues = coordinates.map(
                    ({ row, column }) => board[row][column]
                );
                const values = originalValues
                    .map((value, index) => ({
                        value,
                        sourceIndex:
                            value === 0
                                ? null
                                : coordinates[index].row * boardSize +
                                  coordinates[index].column
                    }))
                    .filter(tile => tile.value !== 0);
                const mergedTiles = [];

                for (let index = 0; index < values.length; index++) {
                    if (values[index].value === values[index + 1]?.value) {
                        const mergedValue = values[index].value * 2;

                        mergedTiles.push({
                            value: mergedValue,
                            sourceIndexes: [
                                values[index].sourceIndex,
                                values[index + 1].sourceIndex
                            ]
                        });
                        scoreIncrease += mergedValue;
                        index++;
                    } else {
                        mergedTiles.push({
                            value: values[index].value,
                            sourceIndexes: [values[index].sourceIndex]
                        });
                    }
                }

                while (mergedTiles.length < boardSize) {
                    mergedTiles.push({
                        value: 0,
                        sourceIndexes: []
                    });
                }

                if (
                    mergedTiles.some(
                        (tile, index) =>
                            tile.value !== originalValues[index]
                    )
                ) {
                    hasMoved = true;
                }

                coordinates.forEach(({ row, column }, index) => {
                    const tile = mergedTiles[index];
                    const destinationIndex = row * boardSize + column;

                    board[row][column] = tile.value;

                    if (tile.value !== 0) {
                        const movingSource = tile.sourceIndexes.find(
                            sourceIndex =>
                                sourceIndex !== destinationIndex
                        );

                        if (movingSource !== undefined) {
                            tileMoves.push({
                                fromIndex: movingSource,
                                toIndex: destinationIndex
                            });
                        }
                    }
                });
            }

            if (!hasMoved) {
                return;
            }

            score += scoreIncrease;

            if (
                !hasWon &&
                board.some(row => row.includes(targetValue))
            ) {
                hasWon = true;
                statusElement.textContent =
                    "達成 2048！你可以繼續挑戰更高數字。";
            } else if (!hasWon) {
                statusElement.textContent =
                    "使用方向鍵、WASD 或滑動棋盤移動";
            }

            addRandomTile();
            api.updateScore(score);

            if (!canMove()) {
                finishGame();
            }

            render(tileMoves);
        }

        function canMove() {
            for (let row = 0; row < boardSize; row++) {
                for (let column = 0; column < boardSize; column++) {
                    if (board[row][column] === 0) {
                        return true;
                    }

                    if (
                        column < boardSize - 1 &&
                        board[row][column] === board[row][column + 1]
                    ) {
                        return true;
                    }

                    if (
                        row < boardSize - 1 &&
                        board[row][column] === board[row + 1][column]
                    ) {
                        return true;
                    }
                }
            }

            return false;
        }

        function finishGame() {
            gameOver = true;
            statusElement.textContent = `遊戲結束，最終分數 ${score}`;
            api.recordScore(score);
        }

        function togglePause() {
            if (gameOver || destroyed) {
                return;
            }

            paused = !paused;
            statusElement.textContent = paused
                ? "已暫停"
                : hasWon
                    ? "達成 2048！你可以繼續挑戰更高數字。"
                    : "使用方向鍵、WASD 或滑動棋盤移動";

            render();
        }

        function handleKeyDown(event) {
            const key = event.key.toLowerCase();
            const directions = {
                arrowup: "up",
                w: "up",
                arrowdown: "down",
                s: "down",
                arrowleft: "left",
                a: "left",
                arrowright: "right",
                d: "right"
            };

            if (key === " ") {
                event.preventDefault();
                togglePause();
                return;
            }

            const direction = directions[key];

            if (!direction || gameOver || destroyed) {
                return;
            }

            event.preventDefault();
            slide(direction);
        }

        function handlePointerDown(event) {
            pointerStart = {
                x: event.clientX,
                y: event.clientY
            };
        }

        function handlePointerUp(event) {
            if (!pointerStart) {
                return;
            }

            const deltaX = event.clientX - pointerStart.x;
            const deltaY = event.clientY - pointerStart.y;
            pointerStart = null;

            if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < 24) {
                return;
            }

            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                slide(deltaX > 0 ? "right" : "left");
            } else {
                slide(deltaY > 0 ? "down" : "up");
            }
        }

        function handlePointerCancel() {
            pointerStart = null;
        }

        function destroy() {
            if (destroyed) {
                return;
            }

            destroyed = true;
            cancelTileAnimations();
            document.removeEventListener("keydown", handleKeyDown);
            boardElement.removeEventListener(
                "pointerdown",
                handlePointerDown
            );
            boardElement.removeEventListener(
                "pointerup",
                handlePointerUp
            );
            boardElement.removeEventListener(
                "pointercancel",
                handlePointerCancel
            );
        }

        document.addEventListener("keydown", handleKeyDown);
        boardElement.addEventListener("pointerdown", handlePointerDown);
        boardElement.addEventListener("pointerup", handlePointerUp);
        boardElement.addEventListener("pointercancel", handlePointerCancel);

        addRandomTile();
        addRandomTile();
        render();
        api.updateScore(0);

        return {
            togglePause,
            destroy
        };
    }
};
