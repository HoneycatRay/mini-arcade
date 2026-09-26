/**
 * Mini Arcade
 * Flappy Sky Game
 */

window.MiniArcadeGames = window.MiniArcadeGames || {};

window.MiniArcadeGames.flappySky = {

    id: "flappy-sky",

    name: "Flappy Sky",

    icon: "🐦",

    description: "拍動翅膀穿越水管，在天空中飛得更遠。",

    category: "Arcade",

    instructions: `
        <p><strong>遊戲目標</strong></p>

        <p>
            控制小鳥穿過水管之間的空隙。每成功通過一組水管可得 1 分；
            碰到水管或地面時遊戲結束。
        </p>

        <p><strong>操作方式</strong></p>

        <ul>
            <li>空白鍵、↑ 或 W：拍動翅膀</li>
            <li>滑鼠點擊或觸控畫面：拍動翅膀</li>
            <li>平台暫停按鈕：暫停 / 繼續</li>
        </ul>
    `,

    launch(container, api) {
        const worldWidth = 480;
        const worldHeight = 640;
        const groundHeight = 58;
        const groundY = worldHeight - groundHeight;
        const birdX = 132;
        const birdRadius = 17;
        const gravity = 1450;
        const flapVelocity = -450;
        const pipeWidth = 76;
        const pipeGap = 174;
        const pipeSpacing = 285;
        const pipeSpeed = 185;
        const minimumPipeGapCenter = 150;
        const maximumPipeGapCenter = groundY - 145;

        const wrapper = document.createElement("section");
        const canvas = document.createElement("canvas");
        const statusElement = document.createElement("p");
        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error(
                "Mini Arcade：瀏覽器無法建立 Flappy Sky 畫布。"
            );
        }

        wrapper.className = "flappy-sky-game";
        canvas.className = "flappy-sky-canvas";
        canvas.width = worldWidth;
        canvas.height = worldHeight;
        canvas.tabIndex = 0;
        canvas.setAttribute("role", "img");
        canvas.setAttribute(
            "aria-label",
            "Flappy Sky 遊戲畫面，點擊或按空白鍵飛行"
        );

        statusElement.className = "flappy-sky-status";
        statusElement.setAttribute("aria-live", "polite");
        statusElement.textContent =
            "點擊畫面或按空白鍵開始飛行";

        wrapper.appendChild(canvas);
        wrapper.appendChild(statusElement);
        container.appendChild(wrapper);

        let birdY = worldHeight * 0.43;
        let birdVelocity = 0;
        let pipes = [];
        let score = 0;
        let state = "ready";
        let paused = false;
        let destroyed = false;
        let animationFrameId = null;
        let previousFrameTime = null;
        let pipeSpawnTimer = 0;
        let groundOffset = 0;
        let animationTime = 0;

        function createPipe(x) {
            const gapCenter =
                minimumPipeGapCenter +
                Math.random() *
                    (maximumPipeGapCenter - minimumPipeGapCenter);

            return {
                x,
                gapTop: gapCenter - pipeGap / 2,
                gapBottom: gapCenter + pipeGap / 2,
                passed: false
            };
        }

        function resetGame() {
            birdY = worldHeight * 0.43;
            birdVelocity = 0;
            pipes = [];
            score = 0;
            state = "playing";
            pipeSpawnTimer = 0;
            previousFrameTime = null;
            pipes.push(createPipe(worldWidth + 70));
            api.updateScore(score);
            statusElement.textContent =
                "穿越水管之間的空隙，避開水管與地面。";
        }

        function flap() {
            if (destroyed || paused) {
                return;
            }

            if (state === "ready" || state === "game-over") {
                resetGame();
            }

            birdVelocity = flapVelocity;
        }

        function circleIntersectsRectangle(
            circleX,
            circleY,
            radius,
            rectangleX,
            rectangleY,
            rectangleWidth,
            rectangleHeight
        ) {
            const closestX = Math.max(
                rectangleX,
                Math.min(circleX, rectangleX + rectangleWidth)
            );
            const closestY = Math.max(
                rectangleY,
                Math.min(circleY, rectangleY + rectangleHeight)
            );
            const distanceX = circleX - closestX;
            const distanceY = circleY - closestY;

            return (
                distanceX * distanceX + distanceY * distanceY <=
                radius * radius
            );
        }

        function hasCollision(pipe) {
            const hitTopPipe = circleIntersectsRectangle(
                birdX,
                birdY,
                birdRadius,
                pipe.x,
                0,
                pipeWidth,
                pipe.gapTop
            );
            const hitBottomPipe = circleIntersectsRectangle(
                birdX,
                birdY,
                birdRadius,
                pipe.x,
                pipe.gapBottom,
                pipeWidth,
                groundY - pipe.gapBottom
            );

            return hitTopPipe || hitBottomPipe;
        }

        function finishGame() {
            if (state !== "playing") {
                return;
            }

            state = "game-over";
            statusElement.textContent =
                `遊戲結束，通過 ${score} 組水管。點擊畫面或按空白鍵再試一次。`;
            api.recordScore(score);
        }

        function update(deltaSeconds) {
            animationTime += deltaSeconds;

            if (state !== "playing") {
                return;
            }

            birdVelocity += gravity * deltaSeconds;
            birdY += birdVelocity * deltaSeconds;
            groundOffset =
                (groundOffset + pipeSpeed * deltaSeconds) % 48;
            pipeSpawnTimer += deltaSeconds;

            if (pipeSpawnTimer >= pipeSpacing / pipeSpeed) {
                pipes.push(createPipe(worldWidth + 8));
                pipeSpawnTimer = 0;
            }

            for (const pipe of pipes) {
                pipe.x -= pipeSpeed * deltaSeconds;

                if (
                    !pipe.passed &&
                    pipe.x + pipeWidth < birdX
                ) {
                    pipe.passed = true;
                    score++;
                    api.updateScore(score);
                    statusElement.textContent =
                        `目前分數 ${score}，繼續穿越水管！`;
                }

                if (hasCollision(pipe)) {
                    finishGame();
                    return;
                }
            }

            pipes = pipes.filter(
                pipe => pipe.x + pipeWidth > -10
            );

            if (
                birdY - birdRadius < 0 ||
                birdY + birdRadius >= groundY
            ) {
                finishGame();
            }
        }

        function drawCloud(x, y, scale) {
            context.beginPath();
            context.ellipse(
                x,
                y,
                24 * scale,
                12 * scale,
                0,
                0,
                Math.PI * 2
            );
            context.ellipse(
                x - 16 * scale,
                y + 3 * scale,
                15 * scale,
                10 * scale,
                0,
                0,
                Math.PI * 2
            );
            context.ellipse(
                x + 14 * scale,
                y + 3 * scale,
                18 * scale,
                11 * scale,
                0,
                0,
                Math.PI * 2
            );
            context.fill();
        }

        function drawBackground() {
            const skyGradient = context.createLinearGradient(
                0,
                0,
                0,
                groundY
            );

            skyGradient.addColorStop(0, "#b9e8f2");
            skyGradient.addColorStop(1, "#eef8f4");
            context.fillStyle = skyGradient;
            context.fillRect(0, 0, worldWidth, groundY);

            context.fillStyle = "rgba(255, 255, 255, 0.68)";
            drawCloud(90, 115, 1);
            drawCloud(350, 205, 0.76);
            drawCloud(245, 70, 0.58);

            context.fillStyle = "#d5ebd1";
            context.beginPath();
            context.moveTo(0, groundY - 55);
            context.quadraticCurveTo(
                115,
                groundY - 118,
                235,
                groundY - 50
            );
            context.quadraticCurveTo(
                360,
                groundY - 116,
                worldWidth,
                groundY - 45
            );
            context.lineTo(worldWidth, groundY);
            context.lineTo(0, groundY);
            context.closePath();
            context.fill();
        }

        function drawPipe(pipe) {
            const pipeGradient = context.createLinearGradient(
                pipe.x,
                0,
                pipe.x + pipeWidth,
                0
            );

            pipeGradient.addColorStop(0, "#53aa78");
            pipeGradient.addColorStop(0.5, "#78c993");
            pipeGradient.addColorStop(1, "#439466");
            context.fillStyle = pipeGradient;
            context.strokeStyle = "rgba(34, 96, 61, 0.45)";
            context.lineWidth = 2;

            context.fillRect(
                pipe.x + 6,
                0,
                pipeWidth - 12,
                pipe.gapTop
            );
            context.strokeRect(
                pipe.x + 6,
                -1,
                pipeWidth - 12,
                pipe.gapTop + 1
            );

            context.fillRect(
                pipe.x,
                pipe.gapTop - 22,
                pipeWidth,
                22
            );
            context.strokeRect(
                pipe.x,
                pipe.gapTop - 22,
                pipeWidth,
                22
            );

            context.fillRect(
                pipe.x,
                pipe.gapBottom,
                pipeWidth,
                22
            );
            context.strokeRect(
                pipe.x,
                pipe.gapBottom,
                pipeWidth,
                22
            );

            context.fillRect(
                pipe.x + 6,
                pipe.gapBottom + 22,
                pipeWidth - 12,
                groundY - pipe.gapBottom
            );
            context.strokeRect(
                pipe.x + 6,
                pipe.gapBottom + 22,
                pipeWidth - 12,
                groundY - pipe.gapBottom
            );
        }

        function drawBird() {
            const bobOffset =
                state === "ready"
                    ? Math.sin(animationTime * 3) * 7
                    : 0;
            const drawY = birdY + bobOffset;
            const rotation = Math.max(
                -0.38,
                Math.min(0.85, birdVelocity / 700)
            );

            context.save();
            context.translate(birdX, drawY);
            context.rotate(rotation);

            context.fillStyle = "rgba(54, 77, 74, 0.16)";
            context.beginPath();
            context.ellipse(
                0,
                birdRadius + 5,
                birdRadius * 1.1,
                5,
                0,
                0,
                Math.PI * 2
            );
            context.fill();

            context.fillStyle = "#f3c95f";
            context.beginPath();
            context.arc(
                0,
                0,
                birdRadius,
                0,
                Math.PI * 2
            );
            context.fill();

            context.fillStyle = "#fffdf6";
            context.beginPath();
            context.arc(7, -5, 6, 0, Math.PI * 2);
            context.fill();

            context.fillStyle = "#29333a";
            context.beginPath();
            context.arc(9, -5, 2.5, 0, Math.PI * 2);
            context.fill();

            context.fillStyle = "#ec8e56";
            context.beginPath();
            context.moveTo(13, 2);
            context.lineTo(27, 7);
            context.lineTo(13, 11);
            context.closePath();
            context.fill();

            context.fillStyle = "#eab64b";
            context.beginPath();
            context.ellipse(
                -5,
                5 + Math.sin(animationTime * 17) * 2,
                9,
                5,
                -0.35,
                0,
                Math.PI * 2
            );
            context.fill();

            context.restore();
        }

        function drawGround() {
            context.fillStyle = "#d6b982";
            context.fillRect(
                0,
                groundY,
                worldWidth,
                groundHeight
            );

            context.fillStyle = "#8fc77f";
            context.fillRect(0, groundY, worldWidth, 9);

            context.strokeStyle = "rgba(119, 147, 93, 0.35)";
            context.lineWidth = 2;

            for (
                let x = -groundOffset;
                x < worldWidth + 48;
                x += 48
            ) {
                context.beginPath();
                context.moveTo(x, groundY + 22);
                context.lineTo(x + 20, groundY + 22);
                context.moveTo(x + 17, groundY + 42);
                context.lineTo(x + 38, groundY + 42);
                context.stroke();
            }
        }

        function drawMessage(title, subtitle) {
            context.fillStyle = "rgba(255, 255, 255, 0.82)";
            context.strokeStyle = "rgba(35, 73, 75, 0.12)";
            context.lineWidth = 1;
            context.beginPath();
            drawRoundedRect(
                48,
                worldHeight * 0.31,
                worldWidth - 96,
                116,
                20
            );
            context.fill();
            context.stroke();

            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = "#254c50";
            context.font =
                "700 26px -apple-system, BlinkMacSystemFont, sans-serif";
            context.fillText(
                title,
                worldWidth / 2,
                worldHeight * 0.31 + 40
            );

            context.fillStyle = "#587276";
            context.font =
                "500 15px -apple-system, BlinkMacSystemFont, sans-serif";
            context.fillText(
                subtitle,
                worldWidth / 2,
                worldHeight * 0.31 + 77
            );
        }

        function drawRoundedRect(x, y, width, height, radius) {
            const corner = Math.min(radius, width / 2, height / 2);

            context.moveTo(x + corner, y);
            context.lineTo(x + width - corner, y);
            context.quadraticCurveTo(
                x + width,
                y,
                x + width,
                y + corner
            );
            context.lineTo(x + width, y + height - corner);
            context.quadraticCurveTo(
                x + width,
                y + height,
                x + width - corner,
                y + height
            );
            context.lineTo(x + corner, y + height);
            context.quadraticCurveTo(
                x,
                y + height,
                x,
                y + height - corner
            );
            context.lineTo(x, y + corner);
            context.quadraticCurveTo(
                x,
                y,
                x + corner,
                y
            );
            context.closePath();
        }

        function draw() {
            drawBackground();
            pipes.forEach(drawPipe);
            drawGround();
            drawBird();

            if (state === "ready") {
                drawMessage(
                    "Flappy Sky",
                    "點擊或按空白鍵，讓小鳥起飛"
                );
            } else if (paused) {
                drawMessage(
                    "已暫停",
                    "使用平台暫停按鈕繼續"
                );
            } else if (state === "game-over") {
                drawMessage(
                    "遊戲結束",
                    `通過 ${score} 組水管 · 點擊再玩一次`
                );
            }
        }

        function animationLoop(timestamp) {
            if (destroyed || paused || state === "game-over") {
                animationFrameId = null;
                return;
            }

            if (previousFrameTime === null) {
                previousFrameTime = timestamp;
            }

            const deltaSeconds = Math.min(
                (timestamp - previousFrameTime) / 1000,
                0.032
            );

            previousFrameTime = timestamp;
            update(deltaSeconds);
            draw();

            if (state !== "game-over") {
                animationFrameId =
                    window.requestAnimationFrame(animationLoop);
            } else {
                animationFrameId = null;
            }
        }

        function startAnimation() {
            if (
                animationFrameId !== null ||
                destroyed ||
                paused ||
                state === "game-over"
            ) {
                return;
            }

            previousFrameTime = null;
            animationFrameId =
                window.requestAnimationFrame(animationLoop);
        }

        function stopAnimation() {
            if (animationFrameId !== null) {
                window.cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }

        function handlePointerDown(event) {
            event.preventDefault();
            canvas.focus();
            flap();

            if (!paused && state === "playing") {
                startAnimation();
            }

            draw();
        }

        function handleKeyDown(event) {
            const key = event.key.toLowerCase();

            if (
                key !== " " &&
                key !== "arrowup" &&
                key !== "w"
            ) {
                return;
            }

            if (event.repeat) {
                return;
            }

            event.preventDefault();
            flap();

            if (!paused && state === "playing") {
                startAnimation();
            }

            draw();
        }

        function togglePause() {
            if (destroyed || state === "game-over") {
                return;
            }

            paused = !paused;

            if (paused) {
                stopAnimation();
                statusElement.textContent = "已暫停";
            } else {
                statusElement.textContent =
                    state === "ready"
                        ? "點擊畫面或按空白鍵開始飛行"
                        : "穿越水管之間的空隙，避開水管與地面。";
                startAnimation();
            }

            draw();
        }

        function destroy() {
            if (destroyed) {
                return;
            }

            destroyed = true;
            stopAnimation();
            canvas.removeEventListener(
                "pointerdown",
                handlePointerDown
            );
            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
        }

        canvas.addEventListener(
            "pointerdown",
            handlePointerDown
        );
        document.addEventListener(
            "keydown",
            handleKeyDown
        );

        api.updateScore(0);
        draw();
        startAnimation();

        return {
            togglePause,
            refresh: draw,
            destroy
        };
    }
};
