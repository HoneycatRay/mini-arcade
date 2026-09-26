/**
 * Mini Arcade
 * Minesweeper Game
 */

window.MiniArcadeGames = window.MiniArcadeGames || {};

window.MiniArcadeGames.minesweeper = {

    id: "minesweeper",

    name: "踩地雷",

    icon: "💣",

    description: "找出安全格、標記地雷，避免踩中地雷。",

    category: "Puzzle",

    instructions: `
        <p><strong>遊戲目標</strong></p>

        <p>
            找出棋盤上所有安全格，不必標記每一顆地雷也能獲勝。
            棋盤為 9 × 9，共有 10 顆地雷；第一次翻開的格子保證安全。
        </p>

        <p><strong>操作方式</strong></p>

        <ul>
            <li>點擊格子：翻開格子</li>
            <li>右鍵，或開啟「標記地雷」後點擊：插旗 / 取消旗標</li>
            <li>方向鍵：移動焦點；Enter / 空白鍵：操作焦點格</li>
            <li>使用上方暫停按鈕可暫停計時與操作</li>
        </ul>

        <p>
            每翻開一個安全格可得 10 分，勝利時另有依完成時間計算的獎勵。
            結束時會儲存本局分數。
        </p>
    `,

    launch(container, api) {
        const boardSize = 9;
        const mineCount = 10;
        const cellCount = boardSize * boardSize;
        const winBonusBase = 1000;
        const winBonusPerSecond = 5;
        const minimumWinBonus = 100;

        const wrapper = document.createElement("section");
        const toolbar = document.createElement("div");
        const flagButton = document.createElement("button");
        const mineCounter = document.createElement("span");
        const timerDisplay = document.createElement("span");
        const boardElement = document.createElement("div");
        const statusElement = document.createElement("p");
        const cells = [];

        wrapper.className = "minesweeper-game";
        toolbar.className = "minesweeper-toolbar";

        flagButton.className = "secondary-button minesweeper-flag-toggle";
        flagButton.type = "button";
        flagButton.textContent = "標記地雷：關";
        flagButton.setAttribute("aria-pressed", "false");

        mineCounter.className = "minesweeper-mine-counter";
        mineCounter.setAttribute("aria-live", "polite");

        timerDisplay.className = "minesweeper-timer";
        timerDisplay.setAttribute("aria-label", "經過時間");

        boardElement.className = "minesweeper-board";
        boardElement.setAttribute("role", "grid");
        boardElement.setAttribute("aria-label", "踩地雷 9 乘 9 棋盤");

        statusElement.className = "minesweeper-status";
        statusElement.setAttribute("aria-live", "polite");
        statusElement.textContent = "翻開安全格，並留意周圍的數字。";

        for (let index = 0; index < cellCount; index++) {
            const cell = document.createElement("button");

            cell.className = "minesweeper-cell";
            cell.type = "button";
            cell.dataset.index = String(index);
            cell.tabIndex = index === 0 ? 0 : -1;
            cell.setAttribute("role", "gridcell");
            cells.push(cell);
            boardElement.appendChild(cell);
        }

        toolbar.appendChild(flagButton);
        toolbar.appendChild(mineCounter);
        toolbar.appendChild(timerDisplay);
        wrapper.appendChild(toolbar);
        wrapper.appendChild(boardElement);
        wrapper.appendChild(statusElement);
        container.appendChild(wrapper);

        let board = createBoard();
        let isBoardGenerated = false;
        let flagMode = false;
        let paused = false;
        let gameOver = false;
        let destroyed = false;
        let flaggedCount = 0;
        let revealedSafeCount = 0;
        let activeCellIndex = 0;
        let timerId = null;
        let startedAt = null;
        let pausedAt = null;
        let pausedDuration = 0;

        function createBoard() {
            return Array.from(
                { length: cellCount },
                () => ({
                    isMine: false,
                    adjacentMines: 0,
                    isRevealed: false,
                    isFlagged: false
                })
            );
        }

        function getNeighbors(index) {
            const row = Math.floor(index / boardSize);
            const column = index % boardSize;
            const neighbors = [];

            for (let rowOffset = -1; rowOffset <= 1; rowOffset++) {
                for (
                    let columnOffset = -1;
                    columnOffset <= 1;
                    columnOffset++
                ) {
                    if (rowOffset === 0 && columnOffset === 0) {
                        continue;
                    }

                    const neighborRow = row + rowOffset;
                    const neighborColumn = column + columnOffset;

                    if (
                        neighborRow >= 0 &&
                        neighborRow < boardSize &&
                        neighborColumn >= 0 &&
                        neighborColumn < boardSize
                    ) {
                        neighbors.push(
                            neighborRow * boardSize + neighborColumn
                        );
                    }
                }
            }

            return neighbors;
        }

        function generateBoard(safeIndex) {
            const availableIndexes = [];

            for (let index = 0; index < cellCount; index++) {
                if (index !== safeIndex) {
                    availableIndexes.push(index);
                }
            }

            for (let index = availableIndexes.length - 1; index > 0; index--) {
                const swapIndex = Math.floor(
                    Math.random() * (index + 1)
                );

                [
                    availableIndexes[index],
                    availableIndexes[swapIndex]
                ] = [
                    availableIndexes[swapIndex],
                    availableIndexes[index]
                ];
            }

            availableIndexes
                .slice(0, mineCount)
                .forEach(index => {
                    board[index].isMine = true;
                });

            board.forEach((cell, index) => {
                if (!cell.isMine) {
                    cell.adjacentMines = getNeighbors(index)
                        .filter(neighbor => board[neighbor].isMine)
                        .length;
                }
            });

            isBoardGenerated = true;
        }

        function formatTime(totalSeconds) {
            const minutes = Math.floor(totalSeconds / 60);
            const seconds = totalSeconds % 60;

            return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
        }

        function getElapsedSeconds() {
            if (startedAt === null) {
                return 0;
            }

            const endTime = pausedAt === null ? Date.now() : pausedAt;

            return Math.floor(
                (endTime - startedAt - pausedDuration) / 1000
            );
        }

        function updateTimerDisplay() {
            timerDisplay.textContent =
                formatTime(getElapsedSeconds());
        }

        function startTimer() {
            if (startedAt !== null) {
                return;
            }

            startedAt = Date.now();
            timerId = window.setInterval(
                updateTimerDisplay,
                1000
            );
        }

        function stopTimer() {
            if (timerId !== null) {
                window.clearInterval(timerId);
                timerId = null;
            }

            updateTimerDisplay();
        }

        function renderCell(index) {
            const cell = board[index];
            const element = cells[index];
            const row = Math.floor(index / boardSize) + 1;
            const column = (index % boardSize) + 1;

            element.className = "minesweeper-cell";
            element.textContent = "";
            element.dataset.index = String(index);
            element.tabIndex = index === activeCellIndex ? 0 : -1;
            element.disabled = paused || gameOver;

            if (cell.isRevealed) {
                element.classList.add("is-revealed");

                if (cell.isMine) {
                    element.classList.add("is-mine");
                    element.textContent = "✹";
                } else if (cell.adjacentMines > 0) {
                    element.dataset.number =
                        String(cell.adjacentMines);
                    element.textContent =
                        String(cell.adjacentMines);
                }
            } else if (cell.isFlagged) {
                element.classList.add("is-flagged");
                element.textContent = "⚑";
            }

            if (gameOver && cell.isFlagged && !cell.isMine) {
                element.classList.add("is-wrong-flag");
                element.textContent = "×";
            }

            const description = cell.isRevealed
                ? cell.isMine
                    ? "地雷"
                    : cell.adjacentMines === 0
                        ? "空白安全格"
                        : `${cell.adjacentMines} 顆相鄰地雷`
                : cell.isFlagged
                    ? "已標記地雷"
                    : "未翻開";

            element.setAttribute(
                "aria-label",
                `第 ${row} 列，第 ${column} 欄，${description}`
            );
        }

        function render() {
            cells.forEach((_, index) => {
                renderCell(index);
            });

            mineCounter.textContent =
                `剩餘地雷 ${mineCount - flaggedCount}`;

            flagButton.textContent = flagMode
                ? "標記地雷：開"
                : "標記地雷：關";
            flagButton.setAttribute(
                "aria-pressed",
                String(flagMode)
            );
            flagButton.disabled = paused || gameOver;

            wrapper.classList.toggle("is-paused", paused);
            wrapper.classList.toggle("is-game-over", gameOver);
        }

        function updateScore() {
            api.updateScore(revealedSafeCount * 10);
        }

        function toggleFlag(index) {
            const cell = board[index];

            if (
                paused ||
                gameOver ||
                cell.isRevealed ||
                (!cell.isFlagged && flaggedCount >= mineCount)
            ) {
                return;
            }

            cell.isFlagged = !cell.isFlagged;
            flaggedCount += cell.isFlagged ? 1 : -1;
            render();
        }

        function revealCell(index) {
            const cell = board[index];

            if (
                paused ||
                gameOver ||
                cell.isRevealed ||
                cell.isFlagged
            ) {
                return;
            }

            if (!isBoardGenerated) {
                generateBoard(index);
                startTimer();
            }

            if (board[index].isMine) {
                board.forEach((boardCell, cellIndex) => {
                    if (boardCell.isMine) {
                        boardCell.isRevealed = true;
                    }

                    renderCell(cellIndex);
                });

                finishGame(false);
                return;
            }

            revealSafeArea(index);
            updateScore();

            if (revealedSafeCount === cellCount - mineCount) {
                finishGame(true);
                return;
            }

            render();
        }

        function revealSafeArea(startIndex) {
            const pendingIndexes = [startIndex];

            while (pendingIndexes.length > 0) {
                const index = pendingIndexes.pop();
                const cell = board[index];

                if (cell.isRevealed || cell.isFlagged || cell.isMine) {
                    continue;
                }

                cell.isRevealed = true;
                revealedSafeCount++;

                if (cell.adjacentMines === 0) {
                    getNeighbors(index).forEach(neighbor => {
                        if (
                            !board[neighbor].isRevealed &&
                            !board[neighbor].isFlagged &&
                            !board[neighbor].isMine
                        ) {
                            pendingIndexes.push(neighbor);
                        }
                    });
                }
            }
        }

        function finishGame(won) {
            if (gameOver) {
                return;
            }

            gameOver = true;
            stopTimer();

            let finalScore = revealedSafeCount * 10;

            if (won) {
                const timeBonus = Math.max(
                    minimumWinBonus,
                    winBonusBase -
                        getElapsedSeconds() * winBonusPerSecond
                );

                finalScore += timeBonus;
                statusElement.textContent =
                    `全部安全格都找到了！用時 ${formatTime(getElapsedSeconds())}，獎勵 ${timeBonus} 分。`;
            } else {
                statusElement.textContent =
                    `踩到地雷了。本局翻開 ${revealedSafeCount} 格安全格。`;
            }

            api.updateScore(finalScore);
            api.recordScore(finalScore);
            render();
        }

        function togglePause() {
            if (gameOver || destroyed) {
                return;
            }

            paused = !paused;

            if (paused && startedAt !== null) {
                pausedAt = Date.now();
                stopTimer();
            } else if (pausedAt !== null) {
                pausedDuration += Date.now() - pausedAt;
                pausedAt = null;
                timerId = window.setInterval(
                    updateTimerDisplay,
                    1000
                );
            }

            render();
        }

        function getCellIndex(target) {
            const cellElement = target.closest(".minesweeper-cell");

            if (!cellElement || !boardElement.contains(cellElement)) {
                return null;
            }

            return Number(cellElement.dataset.index);
        }

        function handleBoardClick(event) {
            const index = getCellIndex(event.target);

            if (index === null) {
                return;
            }

            activeCellIndex = index;

            if (flagMode) {
                toggleFlag(index);
            } else {
                revealCell(index);
            }
        }

        function handleContextMenu(event) {
            const index = getCellIndex(event.target);

            if (index === null) {
                return;
            }

            event.preventDefault();
            activeCellIndex = index;
            toggleFlag(index);
        }

        function handleFlagButtonClick() {
            if (paused || gameOver) {
                return;
            }

            flagMode = !flagMode;
            render();
        }

        function handleBoardKeyDown(event) {
            const index = getCellIndex(event.target);

            if (index === null) {
                return;
            }

            let nextIndex = index;

            if (event.key === "ArrowUp") {
                nextIndex -= boardSize;
            } else if (event.key === "ArrowDown") {
                nextIndex += boardSize;
            } else if (event.key === "ArrowLeft") {
                nextIndex--;
            } else if (event.key === "ArrowRight") {
                nextIndex++;
            } else {
                return;
            }

            event.preventDefault();

            if (
                nextIndex < 0 ||
                nextIndex >= cellCount ||
                Math.abs(
                    (nextIndex % boardSize) - (index % boardSize)
                ) > 1
            ) {
                return;
            }

            activeCellIndex = nextIndex;
            render();
            cells[activeCellIndex].focus();
        }

        function destroy() {
            if (destroyed) {
                return;
            }

            destroyed = true;
            stopTimer();
            flagButton.removeEventListener(
                "click",
                handleFlagButtonClick
            );
            boardElement.removeEventListener(
                "click",
                handleBoardClick
            );
            boardElement.removeEventListener(
                "contextmenu",
                handleContextMenu
            );
            boardElement.removeEventListener(
                "keydown",
                handleBoardKeyDown
            );
        }

        flagButton.addEventListener(
            "click",
            handleFlagButtonClick
        );
        boardElement.addEventListener(
            "click",
            handleBoardClick
        );
        boardElement.addEventListener(
            "contextmenu",
            handleContextMenu
        );
        boardElement.addEventListener(
            "keydown",
            handleBoardKeyDown
        );

        render();
        updateTimerDisplay();
        api.updateScore(0);

        return {
            togglePause,
            destroy
        };
    }
};
