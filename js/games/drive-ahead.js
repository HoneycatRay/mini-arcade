/**
 * Mini Arcade
 * Drive Ahead! Game
 */

window.MiniArcadeGames = window.MiniArcadeGames || {};

window.MiniArcadeGames.driveAhead = {

    id: "drive-ahead",

    name: "Drive Ahead!",

    icon: "🏎️",

    description: "駕駛特技車、跳躍閃避，在競技場中先拿下三勝。",

    category: "Racing",

    instructions: `
        <p><strong>遊戲目標</strong></p>

        <p>
            在原創的側視角競技場中與對手對戰。
            利用加速與跳躍取得衝撞優勢，先贏得三回合即可獲勝。
        </p>

        <p><strong>鍵盤操作</strong></p>

        <ul>
            <li>← / A：向左行駛</li>
            <li>→ / D：向右行駛</li>
            <li>↑ / W / 空白鍵：跳躍</li>
            <li>手機或平板：使用畫面下方的方向與跳躍按鈕</li>
        </ul>

        <p>
            碰撞時，速度較快的一方會造成傷害。
            每回合車輛有三格耐久；先贏得三回合的一方贏得比賽。
        </p>
    `,

    launch(container, api) {
        const worldWidth = 820;
        const worldHeight = 500;
        const groundY = 402;
        const carWidth = 82;
        const carHeight = 38;
        const carHalfWidth = carWidth / 2;
        const carHalfHeight = carHeight / 2;
        const gravity = 1180;
        const acceleration = 690;
        const maximumSpeed = 335;
        const jumpVelocity = -485;
        const winsNeeded = 3;
        const collisionCooldown = 0.85;
        const roundPause = 1.35;
        const palette = {
            player: {
                body: "#288f91",
                light: "#64c5ba",
                dark: "#17666c",
                glass: "#bde9e1",
                wheel: "#28363c"
            },
            rival: {
                body: "#d65c49",
                light: "#f18d67",
                dark: "#93403d",
                glass: "#ffe0bd",
                wheel: "#33333a"
            }
        };

        const wrapper = document.createElement("section");
        const canvas = document.createElement("canvas");
        const hud = document.createElement("div");
        const roundDisplay = document.createElement("span");
        const statusElement = document.createElement("p");
        const controls = document.createElement("div");
        const buttonBindings = [];
        const context = canvas.getContext("2d");

        if (!context) {
            throw new Error(
                "Mini Arcade：瀏覽器無法建立 Drive Ahead! 畫布。"
            );
        }

        wrapper.className = "drive-ahead-game";
        canvas.className = "drive-ahead-canvas";
        canvas.width = worldWidth;
        canvas.height = worldHeight;
        canvas.tabIndex = 0;
        canvas.setAttribute("role", "img");
        canvas.setAttribute(
            "aria-label",
            "Drive Ahead! 側視角車輛競技場"
        );

        hud.className = "drive-ahead-hud";
        roundDisplay.className = "drive-ahead-rounds";
        roundDisplay.setAttribute("aria-live", "polite");
        statusElement.className = "drive-ahead-status";
        statusElement.setAttribute("aria-live", "polite");
        controls.className = "drive-ahead-controls";
        controls.setAttribute("aria-label", "駕駛操作");

        wrapper.appendChild(hud);
        wrapper.appendChild(canvas);
        wrapper.appendChild(statusElement);
        wrapper.appendChild(controls);
        hud.appendChild(roundDisplay);
        container.appendChild(wrapper);

        const pressedKeys = new Set();
        const heldPointers = new Map();
        let playerWins = 0;
        let rivalWins = 0;
        let player = createCar("player", 190, 1);
        let rival = createCar("rival", 630, -1);
        let animationFrameId = null;
        let previousFrameTime = null;
        let collisionTimer = 0;
        let roundTimer = 0;
        let rivalDecisionTimer = 0;
        let rivalJumpCooldown = 0;
        let arenaTime = 0;
        let paused = false;
        let roundInProgress = true;
        let matchOver = false;
        let destroyed = false;
        let flashTimer = 0;
        let lastImpact = null;

        function createCar(team, x, facing) {
            return {
                team,
                x,
                y: groundY - carHalfHeight,
                velocityX: 0,
                velocityY: 0,
                angle: 0,
                angularVelocity: 0,
                facing,
                durability: 3,
                grounded: true
            };
        }

        function createControl(label, keys, isJump = false) {
            const button = document.createElement("button");

            button.className = isJump
                ? "drive-ahead-control drive-ahead-jump"
                : "drive-ahead-control";
            button.type = "button";
            button.textContent = label;
            button.setAttribute(
                "aria-label",
                isJump
                    ? "跳躍"
                    : label === "←"
                        ? "向左行駛"
                        : "向右行駛"
            );

            const pointerDown = event => {
                event.preventDefault();
                button.setPointerCapture(event.pointerId);
                heldPointers.set(event.pointerId, keys);

                if (isJump) {
                    jump(player);
                }

                button.classList.add("is-pressed");
            };

            const pointerUp = event => {
                heldPointers.delete(event.pointerId);
                button.classList.remove("is-pressed");
            };

            button.addEventListener("pointerdown", pointerDown);
            button.addEventListener("pointerup", pointerUp);
            button.addEventListener("pointercancel", pointerUp);
            button.addEventListener("lostpointercapture", pointerUp);
            controls.appendChild(button);
            buttonBindings.push({
                button,
                pointerDown,
                pointerUp
            });
        }

        createControl("←", ["left"]);
        createControl("跳", ["jump"], true);
        createControl("→", ["right"]);

        function isKeyDown(...keys) {
            return keys.some(key => pressedKeys.has(key));
        }

        function getPointerInputs() {
            const inputs = new Set();

            heldPointers.forEach(keys => {
                keys.forEach(key => inputs.add(key));
            });

            return inputs;
        }

        function updateHud() {
            roundDisplay.textContent =
                `你 ${"◆".repeat(playerWins)}${"◇".repeat(winsNeeded - playerWins)}　對手 ${"◆".repeat(rivalWins)}${"◇".repeat(winsNeeded - rivalWins)}`;
        }

        function resetRound() {
            player = createCar("player", 190, 1);
            rival = createCar("rival", 630, -1);
            collisionTimer = 0;
            rivalDecisionTimer = 0.25;
            rivalJumpCooldown = 0.8;
            roundInProgress = true;
            lastImpact = null;
            flashTimer = 0;
            statusElement.textContent =
                "加速衝撞，或跳起來避開對手！";
        }

        function roundEnded(winner) {
            if (!roundInProgress || matchOver) {
                return;
            }

            roundInProgress = false;
            roundTimer = roundPause;

            if (winner === "player") {
                playerWins++;
                statusElement.textContent =
                    `漂亮的衝撞！你贏下這回合（${playerWins} : ${rivalWins}）。`;
            } else if (winner === "rival") {
                rivalWins++;
                statusElement.textContent =
                    `對手贏下這回合（${playerWins} : ${rivalWins}），再接再厲！`;
            } else {
                statusElement.textContent =
                    "平手！準備再來一回合。";
            }

            updateHud();
            api.updateScore(playerWins);

            if (playerWins >= winsNeeded || rivalWins >= winsNeeded) {
                matchOver = true;
                roundTimer = 0;
                statusElement.textContent =
                    playerWins >= winsNeeded
                        ? "比賽獲勝！按平台「重新開始」再來一場。"
                        : "比賽結束！按平台「重新開始」再挑戰。";
                api.recordScore(playerWins);
            }
        }

        function applyDamage(car) {
            car.durability = Math.max(0, car.durability - 1);
            flashTimer = 0.18;
        }

        function resolveCarCollision() {
            const horizontalDistance = rival.x - player.x;
            const verticalDistance = rival.y - player.y;

            if (
                Math.abs(horizontalDistance) >= carWidth - 12 ||
                Math.abs(verticalDistance) >= carHeight + 7
            ) {
                return;
            }

            const sign = horizontalDistance >= 0 ? 1 : -1;
            const penetration =
                carWidth - 12 - Math.abs(horizontalDistance);
            const separation = penetration / 2 + 1;

            player.x -= sign * separation;
            rival.x += sign * separation;

            const closingSpeed = Math.max(
                0,
                (player.velocityX - rival.velocityX) * sign
            );

            if (closingSpeed > 0) {
                const bounce = Math.min(closingSpeed * 0.44, 215);
                player.velocityX -= sign * bounce;
                rival.velocityX += sign * bounce;
            }

            player.angularVelocity -= sign * Math.min(
                closingSpeed / 460,
                1.4
            );
            rival.angularVelocity += sign * Math.min(
                closingSpeed / 460,
                1.4
            );

            if (collisionTimer > 0 || closingSpeed < 205) {
                return;
            }

            collisionTimer = collisionCooldown;
            lastImpact = {
                x: (player.x + rival.x) / 2,
                y: (player.y + rival.y) / 2
            };

            const playerAttack = Math.max(
                0,
                player.velocityX * sign
            );
            const rivalAttack = Math.max(
                0,
                -rival.velocityX * sign
            );
            const attackDifference =
                playerAttack - rivalAttack;

            if (attackDifference > 26) {
                applyDamage(rival);
                statusElement.textContent =
                    "命中對手！繼續保持速度。";
            } else if (attackDifference < -26) {
                applyDamage(player);
                statusElement.textContent =
                    "對手撞中了你！小心迎戰。";
            } else {
                applyDamage(player);
                applyDamage(rival);
                statusElement.textContent =
                    "猛烈的正面碰撞！雙方都受到傷害。";
            }

            if (
                player.durability === 0 &&
                rival.durability === 0
            ) {
                roundEnded("tie");
            } else if (player.durability === 0) {
                roundEnded("rival");
            } else if (rival.durability === 0) {
                roundEnded("player");
            }
        }

        function jump(car) {
            if (
                destroyed ||
                paused ||
                matchOver ||
                !roundInProgress ||
                !car.grounded
            ) {
                return false;
            }

            car.velocityY = jumpVelocity;
            car.grounded = false;
            car.angularVelocity += car.facing * 0.5;
            return true;
        }

        function updateCar(car, deltaSeconds, directionInput) {
            if (directionInput !== 0) {
                car.velocityX +=
                    acceleration * directionInput * deltaSeconds;
                car.facing = directionInput;

                if (!car.grounded) {
                    car.angularVelocity +=
                        directionInput * 0.72 * deltaSeconds;
                }
            } else {
                const friction = car.grounded ? 0.84 : 0.98;
                car.velocityX *= Math.pow(
                    friction,
                    deltaSeconds * 60
                );
            }

            car.velocityX = Math.max(
                -maximumSpeed,
                Math.min(maximumSpeed, car.velocityX)
            );

            car.velocityY += gravity * deltaSeconds;
            car.x += car.velocityX * deltaSeconds;
            car.y += car.velocityY * deltaSeconds;
            car.angle += car.angularVelocity * deltaSeconds;

            if (car.y + carHalfHeight >= groundY) {
                car.y = groundY - carHalfHeight;

                if (car.velocityY > 80) {
                    car.angularVelocity +=
                        Math.sign(car.velocityY) *
                        Math.sign(car.angle || car.facing) *
                        Math.min(car.velocityY / 1600, 0.8);
                }

                car.velocityY = 0;
                car.grounded = true;
                car.angularVelocity *= Math.pow(
                    0.84,
                    deltaSeconds * 60
                );
                car.angle *= Math.pow(
                    0.88,
                    deltaSeconds * 60
                );
            } else {
                car.grounded = false;
                car.angularVelocity *= Math.pow(
                    0.995,
                    deltaSeconds * 60
                );
            }

            if (car.x < carHalfWidth + 12) {
                car.x = carHalfWidth + 12;
                car.velocityX = Math.max(0, car.velocityX) * 0.46;
                car.angularVelocity += 0.22;
            } else if (car.x > worldWidth - carHalfWidth - 12) {
                car.x = worldWidth - carHalfWidth - 12;
                car.velocityX = Math.min(0, car.velocityX) * 0.46;
                car.angularVelocity -= 0.22;
            }

            if (Math.abs(car.angle) > Math.PI * 4) {
                car.angle %= Math.PI * 2;
            }
        }

        function updateRival(deltaSeconds) {
            rivalDecisionTimer -= deltaSeconds;
            rivalJumpCooldown -= deltaSeconds;

            if (rivalDecisionTimer <= 0) {
                rivalDecisionTimer = 0.16 + Math.random() * 0.18;

                const distance = player.x - rival.x;
                const direction = Math.sign(distance);
                let rivalDirection = direction;

                if (Math.abs(distance) < 102) {
                    rivalDirection = -direction;
                } else if (Math.random() < 0.15) {
                    rivalDirection = 0;
                }

                updateCar(rival, deltaSeconds, rivalDirection);

                if (
                    rivalJumpCooldown <= 0 &&
                    rival.grounded &&
                    Math.abs(distance) < 230 &&
                    Math.random() < 0.32
                ) {
                    jump(rival);
                    rivalJumpCooldown = 1.1 + Math.random() * 0.7;
                }
            } else {
                updateCar(rival, deltaSeconds, 0);
            }
        }

        function update(deltaSeconds) {
            arenaTime += deltaSeconds;

            if (flashTimer > 0) {
                flashTimer = Math.max(
                    0,
                    flashTimer - deltaSeconds
                );
            }

            if (collisionTimer > 0) {
                collisionTimer = Math.max(
                    0,
                    collisionTimer - deltaSeconds
                );
            }

            if (matchOver) {
                return;
            }

            if (!roundInProgress) {
                roundTimer -= deltaSeconds;

                if (roundTimer <= 0) {
                    resetRound();
                }

                return;
            }

            const pointerInputs = getPointerInputs();
            const movingLeft =
                isKeyDown("arrowleft", "a") ||
                pointerInputs.has("left");
            const movingRight =
                isKeyDown("arrowright", "d") ||
                pointerInputs.has("right");

            const directionInput =
                movingLeft === movingRight
                    ? 0
                    : movingLeft
                        ? -1
                        : 1;

            updateCar(player, deltaSeconds, directionInput);
            updateRival(deltaSeconds);

            const wantsJump =
                isKeyDown("arrowup", "w", " ") ||
                pointerInputs.has("jump");

            if (wantsJump && player.grounded) {
                jump(player);
            }

            resolveCarCollision();
        }

        function drawRoundedRect(x, y, width, height, radius) {
            const corner = Math.min(
                radius,
                width / 2,
                height / 2
            );

            context.beginPath();
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

        function drawBackground() {
            const gradient = context.createLinearGradient(
                0,
                0,
                0,
                groundY
            );

            gradient.addColorStop(0, "#cce9ed");
            gradient.addColorStop(0.72, "#e8f1e8");
            gradient.addColorStop(1, "#c8d8c6");
            context.fillStyle = gradient;
            context.fillRect(0, 0, worldWidth, groundY);

            context.fillStyle = "rgba(255, 255, 255, 0.48)";
            context.beginPath();
            context.arc(690, 82, 34, 0, Math.PI * 2);
            context.fill();

            context.fillStyle = "rgba(255, 255, 255, 0.64)";
            drawRoundedRect(92, 74, 98, 8, 4);
            context.fill();
            drawRoundedRect(114, 90, 62, 6, 3);
            context.fill();
        }

        function drawArena() {
            context.fillStyle = "#778b75";
            context.fillRect(0, groundY, worldWidth, 10);

            context.fillStyle = "#4f6258";
            context.fillRect(0, groundY + 10, worldWidth, 3);

            context.fillStyle = "#b8a37e";
            context.fillRect(
                0,
                groundY + 13,
                worldWidth,
                worldHeight - groundY - 13
            );

            context.strokeStyle = "rgba(84, 93, 77, 0.18)";
            context.lineWidth = 2;

            for (let x = 26; x < worldWidth; x += 76) {
                context.beginPath();
                context.moveTo(x, groundY + 30);
                context.lineTo(x + 27, groundY + 30);
                context.stroke();
            }

            context.fillStyle = "rgba(255, 255, 255, 0.28)";
            context.fillRect(worldWidth / 2 - 1, groundY + 13, 2, 50);

            context.fillStyle = "#718777";
            context.fillRect(0, 300, 12, 102);
            context.fillRect(worldWidth - 12, 300, 12, 102);
        }

        function drawWheel(x, y, radius) {
            context.fillStyle = "#26343a";
            context.beginPath();
            context.arc(x, y, radius, 0, Math.PI * 2);
            context.fill();

            context.fillStyle = "#aab8b5";
            context.beginPath();
            context.arc(x, y, radius * 0.47, 0, Math.PI * 2);
            context.fill();

            context.strokeStyle = "rgba(38, 52, 58, 0.56)";
            context.lineWidth = 1.5;
            context.beginPath();
            context.moveTo(x - radius * 0.32, y);
            context.lineTo(x + radius * 0.32, y);
            context.moveTo(x, y - radius * 0.32);
            context.lineTo(x, y + radius * 0.32);
            context.stroke();
        }

        function drawCar(car) {
            const colors = palette[car.team];
            const wheelRadius = 12;
            const facing = car.facing;

            context.save();
            context.translate(car.x, car.y);
            context.rotate(car.angle);

            context.fillStyle = "rgba(40, 54, 54, 0.13)";
            context.beginPath();
            context.ellipse(
                0,
                carHalfHeight + 13,
                carWidth * 0.46,
                6,
                0,
                0,
                Math.PI * 2
            );
            context.fill();

            drawWheel(-carWidth * 0.29, carHalfHeight - 1, wheelRadius);
            drawWheel(carWidth * 0.29, carHalfHeight - 1, wheelRadius);

            context.fillStyle = colors.dark;
            drawRoundedRect(
                -carWidth * 0.51,
                -carHeight * 0.18,
                carWidth * 1.02,
                carHeight * 0.63,
                12
            );
            context.fill();

            context.fillStyle = colors.body;
            context.beginPath();
            context.moveTo(-carWidth * 0.5, 4);
            context.lineTo(-carWidth * 0.42, -carHeight * 0.2);
            context.lineTo(-carWidth * 0.2, -carHeight * 0.23);
            context.lineTo(-carWidth * 0.04, -carHeight * 0.76);
            context.lineTo(carWidth * 0.26, -carHeight * 0.76);
            context.lineTo(carWidth * 0.43, -carHeight * 0.19);
            context.lineTo(carWidth * 0.5, -carHeight * 0.08);
            context.lineTo(carWidth * 0.48, carHeight * 0.22);
            context.lineTo(-carWidth * 0.43, carHeight * 0.22);
            context.closePath();
            context.fill();

            context.fillStyle = colors.light;
            context.beginPath();
            context.moveTo(-carWidth * 0.11, -carHeight * 0.68);
            context.lineTo(carWidth * 0.2, -carHeight * 0.68);
            context.lineTo(carWidth * 0.32, -carHeight * 0.25);
            context.lineTo(-carWidth * 0.23, -carHeight * 0.25);
            context.closePath();
            context.fill();

            context.fillStyle = colors.glass;
            context.beginPath();
            context.moveTo(-carWidth * 0.08, -carHeight * 0.61);
            context.lineTo(carWidth * 0.16, -carHeight * 0.61);
            context.lineTo(carWidth * 0.26, -carHeight * 0.32);
            context.lineTo(-carWidth * 0.18, -carHeight * 0.32);
            context.closePath();
            context.fill();

            context.fillStyle = "#f3d1a3";
            context.beginPath();
            context.arc(
                facing > 0 ? 2 : -2,
                -carHeight * 0.47,
                7,
                0,
                Math.PI * 2
            );
            context.fill();

            context.fillStyle = "#53606a";
            context.beginPath();
            context.arc(
                facing > 0 ? 4 : -4,
                -carHeight * 0.5,
                7,
                Math.PI,
                Math.PI * 2
            );
            context.fill();

            context.fillStyle = facing > 0 ? "#fff1b8" : "#ff8d7e";
            drawRoundedRect(
                facing * (carWidth * 0.4 - 4) - 2,
                -1,
                6,
                8,
                2
            );
            context.fill();

            context.restore();

            drawDurability(car);
        }

        function drawDurability(car) {
            const barWidth = 62;
            const barHeight = 6;
            const x = car.x - barWidth / 2;
            const y = car.y - carHalfHeight - 23;

            context.fillStyle = "rgba(30, 43, 43, 0.17)";
            drawRoundedRect(
                x - 2,
                y - 2,
                barWidth + 4,
                barHeight + 4,
                5
            );
            context.fill();

            for (let index = 0; index < 3; index++) {
                context.fillStyle = index < car.durability
                    ? car.team === "player"
                        ? "#2d9d8f"
                        : "#d86451"
                    : "rgba(73, 83, 82, 0.18)";

                drawRoundedRect(
                    x + index * 21,
                    y,
                    18,
                    barHeight,
                    3
                );
                context.fill();
            }
        }

        function drawImpact() {
            if (!lastImpact || flashTimer <= 0) {
                return;
            }

            context.save();
            context.globalAlpha = flashTimer / 0.18;
            context.strokeStyle = "#fff7d1";
            context.lineWidth = 4;

            for (let index = 0; index < 8; index++) {
                const angle =
                    (Math.PI * 2 * index) / 8 + arenaTime;
                const innerRadius = 9;
                const outerRadius = 24;

                context.beginPath();
                context.moveTo(
                    lastImpact.x + Math.cos(angle) * innerRadius,
                    lastImpact.y + Math.sin(angle) * innerRadius
                );
                context.lineTo(
                    lastImpact.x + Math.cos(angle) * outerRadius,
                    lastImpact.y + Math.sin(angle) * outerRadius
                );
                context.stroke();
            }

            context.restore();
        }

        function drawOverlay(title, subtitle) {
            context.fillStyle = "rgba(24, 37, 42, 0.62)";
            context.fillRect(0, 0, worldWidth, worldHeight);

            context.fillStyle = "rgba(255, 255, 255, 0.94)";
            drawRoundedRect(
                184,
                164,
                worldWidth - 368,
                138,
                22
            );
            context.fill();

            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillStyle = "#243b40";
            context.font =
                "700 30px -apple-system, BlinkMacSystemFont, sans-serif";
            context.fillText(
                title,
                worldWidth / 2,
                212
            );

            context.fillStyle = "#587075";
            context.font =
                "500 16px -apple-system, BlinkMacSystemFont, sans-serif";
            context.fillText(
                subtitle,
                worldWidth / 2,
                254
            );
        }

        function draw() {
            drawBackground();
            drawArena();

            context.fillStyle = "rgba(255, 255, 255, 0.48)";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.font =
                "600 13px -apple-system, BlinkMacSystemFont, sans-serif";
            context.fillText("ARENA", worldWidth / 2, 58);

            drawCar(player);
            drawCar(rival);
            drawImpact();

            if (paused) {
                drawOverlay(
                    "已暫停",
                    "使用平台暫停按鈕繼續"
                );
            } else if (matchOver) {
                drawOverlay(
                    playerWins >= winsNeeded
                        ? "你贏得比賽！"
                        : "比賽結束",
                    `${playerWins} : ${rivalWins}　按平台「重新開始」再來一場`
                );
            } else if (!roundInProgress) {
                drawOverlay(
                    "下一回合",
                    `${playerWins} : ${rivalWins}`
                );
            }
        }

        function animationLoop(timestamp) {
            if (destroyed || paused) {
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

            if (!matchOver && !destroyed && !paused) {
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
                matchOver
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

        function handleKeyDown(event) {
            const key = event.key.toLowerCase();
            const controlKeys = [
                "arrowleft",
                "arrowright",
                "arrowup",
                "a",
                "d",
                "w",
                " "
            ];

            if (!controlKeys.includes(key) || matchOver) {
                return;
            }

            event.preventDefault();

            if (key === "arrowup" || key === "w" || key === " ") {
                if (!event.repeat) {
                    if (jump(player)) {
                        api.reportValidAction?.();
                    } else if (roundInProgress && !paused) {
                        api.reportInvalidAction?.();
                    }
                }
            } else {
                pressedKeys.add(key);

                if (!event.repeat && roundInProgress && !paused) {
                    api.reportValidAction?.();
                }
            }

            startAnimation();
        }

        function handleKeyUp(event) {
            pressedKeys.delete(event.key.toLowerCase());
        }

        function handlePointerDown(event) {
            event.preventDefault();
            canvas.focus();

            if (event.button === 0) {
                if (jump(player)) {
                    api.reportValidAction?.();
                }
            }

            startAnimation();
        }

        function handleWindowBlur() {
            pressedKeys.clear();
            heldPointers.clear();
            buttonBindings.forEach(({ button }) => {
                button.classList.remove("is-pressed");
            });
        }

        function togglePause() {
            if (destroyed || matchOver) {
                return;
            }

            paused = !paused;

            if (paused) {
                stopAnimation();
                statusElement.textContent = "已暫停";
            } else {
                statusElement.textContent =
                    "加速衝撞，或跳起來避開對手！";
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
            pressedKeys.clear();
            heldPointers.clear();

            document.removeEventListener(
                "keydown",
                handleKeyDown
            );
            document.removeEventListener(
                "keyup",
                handleKeyUp
            );
            window.removeEventListener(
                "blur",
                handleWindowBlur
            );
            canvas.removeEventListener(
                "pointerdown",
                handlePointerDown
            );

            buttonBindings.forEach(binding => {
                binding.button.removeEventListener(
                    "pointerdown",
                    binding.pointerDown
                );
                binding.button.removeEventListener(
                    "pointerup",
                    binding.pointerUp
                );
                binding.button.removeEventListener(
                    "pointercancel",
                    binding.pointerUp
                );
                binding.button.removeEventListener(
                    "lostpointercapture",
                    binding.pointerUp
                );
            });
        }

        document.addEventListener("keydown", handleKeyDown);
        document.addEventListener("keyup", handleKeyUp);
        window.addEventListener("blur", handleWindowBlur);
        canvas.addEventListener("pointerdown", handlePointerDown);

        updateHud();
        api.updateScore(0);
        statusElement.textContent =
            "加速衝撞，或跳起來避開對手！";
        draw();
        startAnimation();

        return {
            togglePause,
            refresh: draw,
            destroy
        };
    }
};