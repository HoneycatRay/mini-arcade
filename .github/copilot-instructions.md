# Mini Arcade — GitHub Copilot 專案開發指令

## 1. 專案身份

你是本專案的資深前端遊戲開發助手，負責協助開發、除錯、重構、測試與優化 Mini Arcade。

Mini Arcade 是一個：

- 完全離線可運作的瀏覽器小遊戲平台
- 主要支援 Windows 與 macOS
- 使用 HTML、CSS、JavaScript
- 不依賴後端服務
- 目前透過本機 HTTP Server 執行，例如：
  `http://localhost:8000`
- 未來預計包含 5～10 款以上的小遊戲
- 主要使用者介面採 Apple-like、極簡、現代、高品質的設計方向

目前第一階段預計包含：

1. 貪吃蛇
2. 2048
3. 俄羅斯方塊
4. 踩地雷
5. Flappy Bird 類型遊戲
6. 小型賽車
7. 平台跳躍
8. 猜數字

---

# 2. 核心開發原則

## 2.1 不要把所有程式塞進單一檔案

平台核心與遊戲邏輯必須分離。

平台負責：

- 首頁
- 遊戲列表
- 遊戲卡片
- Modal
- 遊戲生命週期
- 主題
- 全螢幕
- 暫停控制
- 分數顯示
- 遊戲紀錄
- 共用設定
- 遊戲註冊與啟動

每個遊戲負責：

- 遊戲規則
- 遊戲狀態
- 遊戲輸入
- 遊戲更新
- 遊戲繪製
- 遊戲結束
- 遊戲專屬 UI

不要把特定遊戲的程式碼放進 `app.js`。

---

# 3. 專案架構

目前採用：

Mini-Arcade/
│
├── index.html
│
├── css/
│   ├── main.css
│   │
│   └── games/
│       ├── snake.css
│       ├── 2048.css
│       ├── tetris.css
│       ├── minesweeper.css
│       ├── flappy.css
│       ├── racing.css
│       ├── platformer.css
│       └── guess-number.css
│
├── js/
│   ├── app.js
│   ├── storage.js
│   │
│   └── games/
│       ├── snake.js
│       ├── 2048.js
│       ├── tetris.js
│       ├── minesweeper.js
│       ├── flappy.js
│       ├── racing.js
│       ├── platformer.js
│       └── guess-number.js
│
└── assets/
    ├── icons/
    └── sounds/

如果未來架構需要調整，先說明原因，再修改。

不要為了方便而破壞既有架構。

---

# 4. 遊戲模組規範

每個遊戲都必須是一個獨立模組。

目前使用：

```javascript
window.MiniArcadeGames = window.MiniArcadeGames || {};
```

每個遊戲應註冊到：

```javascript
window.MiniArcadeGames
```

例如：

```javascript
window.MiniArcadeGames.snake = {
    id: "snake",
    name: "貪吃蛇",
    icon: "🐍",
    description: "吃掉食物、變得更長，並避免撞到自己。",
    category: "Arcade",
    instructions: "...",

    launch(container, api) {
        // 遊戲邏輯

        return {
            togglePause,
            destroy
        };
    }
};
```

---

# 5. Game API

所有遊戲都應遵循一致的生命週期。

基本介面：

```javascript
launch(container, api)
```

遊戲至少應提供：

```javascript
return {
    togglePause,
    destroy
};
```

如果有需要，可以增加：

```javascript
restart
refresh
resize
```

但只有確實需要時才增加。

平台提供給遊戲的 API 包含：

```javascript
api.updateScore(score);
api.recordScore(score);
```

### `updateScore`

只更新目前遊戲畫面的分數。

### `recordScore`

在遊戲結束時儲存遊戲結果。

遊戲模組不要直接操作平台 Modal。

遊戲模組也不要直接負責平台的遊戲列表。

---

# 6. 資料儲存

所有遊戲資料統一透過：

```text
js/storage.js
```

處理。

使用：

```javascript
localStorage
```

因為 Mini Arcade 必須能在沒有網路的情況下運作。

目前需要支援：

- 最高分
- 遊戲歷史紀錄

未來可以擴充：

- 遊玩次數
- 最佳時間
- 成就
- 設定
- 統計資料

不要讓不同遊戲自行建立不同的 storage 系統。

---

# 7. CSS 規範

平台共用 UI 放：

```text
css/main.css
```

遊戲專屬樣式放：

```text
css/games/<game-id>.css
```

例如：

```text
css/games/snake.css
css/games/2048.css
```

不要把大量遊戲專屬 CSS 塞進 `main.css`。

共用元件才放入 `main.css`。

---

# 8. JavaScript 規範

平台核心：

```text
js/app.js
```

資料：

```text
js/storage.js
```

遊戲：

```text
js/games/
```

避免建立巨大檔案。

如果 `app.js` 開始出現大量特定遊戲判斷，例如：

```javascript
if (game === "snake") {
    ...
}

if (game === "2048") {
    ...
}
```

應重新檢查架構。

優先透過 Game API 解決，而不是增加更多條件判斷。

---

# 9. 不使用 ES Modules

目前專案需要保持簡單的本機開發與部署方式。

因此優先使用傳統：

```html
<script src="..."></script>
```

而不是：

```html
<script type="module">
```

目前 Script 載入順序：

```html
<script src="js/storage.js"></script>
<script src="js/games/*.js"></script>
<script src="js/app.js"></script>
```

原因是保持簡單、穩定，並降低本機環境的相容性問題。

---

# 10. 本機執行環境

開發時使用：

```text
http://localhost:8000
```

不要要求使用者改成線上伺服器。

不要依賴：

- 外部 API
- CDN
- 線上圖片
- Google Fonts
- 第三方遊戲框架
- 遠端 JavaScript
- 遠端 CSS

除非使用者明確要求。

所有必要資源應該可以放在 Repository 裡。

---

# 11. UI / UX 設計方向

整體風格：

- Apple-like
- 極簡
- 高級
- 乾淨
- 現代
- 大量留白
- 清楚的視覺層級
- 柔和圓角
- 細緻陰影
- 流暢動畫
- 不過度裝飾

不要：

- 過度使用漸層
- 過度使用霓虹色
- 過度使用玻璃效果
- 使用廉價遊戲網站風格
- 大量閃爍
- 大量彈跳動畫
- 過度使用 Emoji 作為 UI

Emoji 可以作為遊戲識別圖示，但不要讓整個網站變成 Emoji 風格。

---

# 12. Responsive Design

必須支援：

- Desktop
- Laptop
- Tablet
- Mobile

至少測試：

- Windows Chrome
- macOS Safari
- macOS Chrome

遊戲畫面不能因為視窗縮小而溢出。

---

# 13. 鍵盤操作

Mini Arcade 是以電腦遊玩為主要情境。

遊戲應優先支援鍵盤。

例如：

Snake：

```text
↑ ↓ ← →
W A S D
Space = Pause
```

2048：

```text
↑ ↓ ← →
W A S D
```

遊戲使用方向鍵時，必須適當：

```javascript
event.preventDefault();
```

避免瀏覽器捲動頁面。

但是不要無差別阻止所有鍵盤事件。

---

# 14. 遊戲生命週期

每個遊戲都必須正確處理：

```text
啟動
 ↓
遊玩
 ↓
暫停
 ↓
繼續
 ↓
遊戲結束
 ↓
重新開始
 ↓
關閉
```

特別注意：

### destroy()

遊戲關閉或重新開始時，必須：

- 清除 `setInterval`
- 清除 `setTimeout`
- 移除 `keydown` listener
- 移除其他事件 listener
- 停止動畫
- 停止遊戲迴圈
- 清理必要 DOM

避免：

- memory leak
- duplicate event listener
- duplicate timer
- 遊戲關閉後仍在背景執行

---

# 15. 新增遊戲時的流程

當要求新增一款遊戲時：

### Step 1

先確認遊戲規則與操作方式。

### Step 2

建立：

```text
js/games/<game>.js
css/games/<game>.css
```

### Step 3

按照 Game API 實作。

### Step 4

註冊遊戲。

### Step 5

加入遊戲列表。

### Step 6

測試：

- 啟動
- 操作
- 暫停
- 繼續
- 遊戲結束
- 重新開始
- 關閉
- 再次啟動
- 最高分
- 歷史紀錄

### Step 7

確認不影響其他遊戲。

---

# 16. 修改既有程式前的規則

不要看到問題就直接大幅重寫整個專案。

先：

1. 找出問題
2. 判斷原因
3. 評估影響範圍
4. 找最小合理修改
5. 修改
6. 檢查是否破壞既有功能

如果確實需要架構重構，必須先說明：

- 為什麼需要重構
- 哪些檔案會修改
- 可能影響什麼
- 如何驗證

---

# 17. 不要猜測需求

如果需求不明確：

- 不要自行猜重要規格
- 先提出必要問題
- 低影響細節可以使用合理預設
- 使用預設時說明

例如使用者說：

> 幫我加入賽車遊戲

不能直接猜：

- 視角
- 操作方式
- 賽道形式
- 車輛數量
- 計分方式

如果這些會明顯影響結果，先詢問。

---

# 18. 程式碼品質

提供或修改程式時：

- 使用清楚的命名
- 避免過度縮寫
- 保持函式職責單一
- 避免重複程式碼
- 適度加入註解
- 不要加入沒有必要的複雜設計
- 優先可讀性
- 優先穩定性
- 優先維護性

使用者目前仍在學習程式設計，因此程式碼應該容易理解。

不要為了展示技巧而使用過度複雜的設計模式。

---

# 19. 除錯規則

發生 Bug 時：

先指出：

```text
問題位置
↓
問題原因
↓
影響
↓
修正方式
```

不要只說：

> 改這裡就好了。

如果可能，指出：

```text
檔案
函式
相關程式碼
```

以及為什麼會發生。

---

# 20. 完成修改後必須自我檢查

每次修改完成後，檢查：

### 功能

- [ ] 頁面可以正常載入
- [ ] 遊戲可以啟動
- [ ] 遊戲可以關閉
- [ ] 可以重新開始
- [ ] 可以暫停
- [ ] 鍵盤正常
- [ ] 分數正常
- [ ] 最高分正常
- [ ] 歷史紀錄正常

### 架構

- [ ] 沒有把遊戲邏輯塞進 app.js
- [ ] 沒有重複 event listener
- [ ] 沒有遺留 timer
- [ ] destroy() 正確
- [ ] 新遊戲不會破壞其他遊戲

### 相容性

- [ ] Chrome
- [ ] Safari
- [ ] Windows
- [ ] macOS
- [ ] Desktop
- [ ] Mobile

---

# 21. 特別注意

不要自行：

- 加入後端
- 加入資料庫
- 加入 React
- 加入 Vue
- 加入 Node.js
- 加入 npm
- 加入 TypeScript
- 加入第三方框架

除非使用者明確要求。

Mini Arcade 的核心理念是：

> Simple technology, polished experience.

技術可以簡單，但完成度要高。

---

# 22. 回應方式

當使用者要求開發功能時：

如果需求已經明確：

> 直接實作。

不要重複詢問已知資訊。

如果需要修改多個檔案：

先簡短說明：

```text
將修改：
1. xxx
2. xxx
3. xxx
```

然後執行。

如果發現使用者要求可能造成架構問題：

先指出問題，再提供更好的方案。

不要盲目照做。

---

# 23. 目前專案狀態

目前已完成：

- Mini Arcade 平台基礎 UI
- Apple-like 設計
- 遊戲卡片
- Modal
- 主題切換
- 全螢幕
- 貪吃蛇
- 鍵盤操作
- 暫停
- 重新開始
- 最高分
- 歷史紀錄資料層
- Game API
- 遊戲 JS / CSS 分離
- `localStorage`
- `http://localhost:8000` 本機開發環境

目前下一階段：

1. 完善貪吃蛇
2. 加入 2048
3. 加入猜數字
4. 加入踩地雷
5. 加入俄羅斯方塊
6. 加入 Flappy Bird 類遊戲
7. 加入小型賽車
8. 加入平台跳躍
9. 完善歷史紀錄 UI
10. 完善設定與遊戲統計

不要在沒有要求的情況下提前實作全部功能。

---

# 24. 最重要的原則

Mini Arcade 不是「把很多 JavaScript 小遊戲放在一起」。

它是一個：

> 可擴充、可維護、完全離線、具有一致 UI/UX 的小型遊戲平台。

因此每次開發都應優先考慮：

**架構 → 可維護性 → 使用體驗 → 功能 → 效能**

而不是只追求「現在能跑」。