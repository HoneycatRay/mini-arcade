# Mini Arcade

Mini Arcade 是一個純前端、完全離線可運作的瀏覽器小遊戲平台，適合在 Windows 與 macOS 上直接本機執行。它由 HTML、CSS、JavaScript 組成，沒有後端服務，也不依賴任何外部 CDN 或套件管理工具，讓你可以在不連接網路的環境下直接開啟並遊玩。

這個專案的設計目標是：

- 提供一個簡潔的遊戲平台入口
- 讓每款遊戲都能獨立維護與擴充
- 使用本地儲存空間保存最高分與歷史紀錄
- 支援主題切換、全螢幕、暫停、操作說明等通用功能
- 保持讓新手也能快速理解與維護的程式架構

## 專案概覽

Mini Arcade 目前是一個以「遊戲平台 + 獨立遊戲模組」為核心架構的前端專案。平台負責首頁、遊戲列表、Modal、遊戲生命週期、分數顯示、儲存機制、主題切換與全螢幕處理；每個遊戲則實作自己的規則、輸入、更新與渲染。

本專案不使用 ES Modules，也不需要打包工具；只要開啟本機 HTTP Server 即可直接瀏覽器執行。

## 目前已實作的遊戲

目前專案已包含以下遊戲：

- 貪吃蛇（Snake）
- 2048
- 踩地雷（Minesweeper）
- 俄羅斯方塊（Tetris）
- Flappy Sky
- Drive Ahead

未來計畫延伸的遊戲包括：

- 小型賽車（Mini Racing）
- 平台跳躍（Sky Jumper / Platformer）
- 猜數字（Guess Number）
- 其他可以快速實作的 arcade 類遊戲

## 主要功能

- 完全離線運作
- 支援本機 HTTP Server 啟動
- Apple-like / 極簡風格 UI
- 深色 / 淺色主題切換
- 全螢幕模式
- 暫停與重新開始
- 每個遊戲都有單獨的說明內容
- 每個遊戲支援最高分與最近遊玩紀錄
- 透過 localStorage 保存資料
- 每款遊戲使用獨立 JS 模組與 CSS 檔案

## 專案架構

```text
Mini-Arcade/
├── index.html
├── README.md
├── .gitignore
├── assets/
│   └── icons/
│       └── favicon.svg
├── css/
│   ├── main.css
│   └── games/
│       ├── 2048.css
│       ├── drive-ahead.css
│       ├── flappy-sky.css
│       ├── minesweeper.css
│       ├── snake.css
│       └── tetris.css
├── js/
│   ├── app.js
│   ├── storage.js
│   └── games/
│       ├── 2048.js
│       ├── drive-ahead.js
│       ├── flappy-sky.js
│       ├── minesweeper.js
│       ├── snake.js
│       └── tetris.js
└── assets/
    ├── icons/
    └── sounds/
```

## 架構設計原則

這個專案遵循清楚的模組化方式：

### 1. 平台核心

`js/app.js` 負責：

- 遊戲列表渲染
- 遊戲卡片建立
- Modal 開關
- 遊戲啟動 / 清理
- 分數更新
- 最高分儲存與讀取
- 暫停 / 重新開始
- 主題切換
- 全螢幕控制
- 遊戲說明顯示

注意：`app.js` 不應塞入特定遊戲邏輯。

### 2. 遊戲模組

每個遊戲都以獨立物件方式註冊至 `window.MiniArcadeGames`：

```javascript
window.MiniArcadeGames = window.MiniArcadeGames || {};
```

類似這種結構：

```javascript
window.MiniArcadeGames.snake = {
    id: "snake",
    name: "貪吃蛇",
    icon: "🐍",
    description: "吃掉食物、變得更長，並避免撞到自己。",
    category: "Arcade",
    instructions: "...",

    launch(container, api) {
        return {
            togglePause,
            destroy
        };
    }
};
```

每個遊戲提供一致的生命週期：

```javascript
launch(container, api)
```

並至少回傳：

```javascript
return {
    togglePause,
    destroy
};
```

如果需要，也可加入：

- `restart`
- `refresh`
- `resize`

但要依實際需求加入，避免過度擴充接口。

### 3. 儲存系統

所有資料統一由 `js/storage.js` 管理，使用 `localStorage`：

- 最高分
- 遊戲歷史紀錄
- 最後遊玩時間
- 設定項目（主題、排序設定等）

這樣做的目的是讓所有遊戲共用一套資料存取機制，避免每個遊戲各自寫一套 storage 邏輯。

### 4. CSS 分層

- 共用 UI：`css/main.css`
- 遊戲專屬樣式：`css/games/*.css`

這有助於將平台與遊戲樣式分開，並讓新遊戲能獨立新增樣式檔案而不干擾既有 UI。

## 啟動方法

### 方法 1：本機 HTTP Server

建議在本地端使用 Python 啟動 HTTP Server：

```bash
cd Mini-Arcade
python -m http.server 8000
```

然後在瀏覽器開啟：

```text
http://localhost:8000
```

這是最穩定且符合專案設計的啟動方式。

### 方法 2：直接檔案開啟

雖然可以直接用瀏覽器打開 `index.html`，但不建議長期使用。

原因是：

- `localStorage` 在不同開啟方式下可能行為不一致
- 本地檔案開啟有時可能受到瀏覽器限制
- 這個專案原設計就是在本機 HTTP Server 上運作

為了保證主題設定、最高分與歷史紀錄都能正確保存，建議使用 `http://localhost:8000`。

## 執行環境要求

Mini Arcade 是純前端專案，幾乎不需要額外依賴：

- 瀏覽器：Chrome / Edge / Safari / Firefox 皆可
- 作業系統：Windows、macOS、Linux（本機開發）
- 不需要 Node.js
- 不需要 npm install
- 不需要後端服務

## 技術實作說明

### HTML

入口檔案為 `index.html`，包含：

- 頂部品牌區
- 主題切換按鈕
- 全螢幕按鈕
- 遊戲庫列表容器
- 遊戲 Modal
- 遊戲說明 Modal
- 遊戲容器區域

### JavaScript

專案採用傳統的 script 載入方式，不使用 ES modules：

```html
<script src="js/storage.js"></script>
<script src="js/games/snake.js"></script>
<script src="js/games/2048.js"></script>
<script src="js/games/minesweeper.js"></script>
<script src="js/games/tetris.js"></script>
<script src="js/games/flappy-sky.js"></script>
<script src="js/games/drive-ahead.js"></script>
<script src="js/app.js"></script>
```

這樣做的目的是：

- 簡化本機開發流程
- 降低瀏覽器兼容性問題
- 適合純靜態前端專案

### localStorage 儲存內容

`js/storage.js` 提供統一 API：

- `getBestScore(gameId)`
- `saveScore(gameId, score)`
- `getHistory(gameId)`
- `getLastPlayed(gameId)`
- `recordGamePlayed(gameId)`
- `getSetting(key)`
- `setSetting(key, value)`
- `clearGameData(gameId)`
- `clearAllData()`

這使得各遊戲能透過同一套儲存邏輯管理歷史紀錄與分數，不需要自行撰寫不同資料格式。

## 目前遊戲簡介

### 1. 貪吃蛇

- 玩家控制蛇在格子地圖上移動
- 吃到食物後變長
- 避免撞牆與撞到自己
- 以分數與長度作為遊戲成功指標

### 2. 2048

- 在格子上合併相同數字
- 目標是合成 2048 或更大數字
- 需要策略性地選擇移動方向

### 3. 踩地雷

- 點擊格子翻開區域
- 避開地雷，若踩到則遊戲結束
- 透過數字提示周圍地雷數量

### 4. 俄羅斯方塊

- 方塊持續落下，玩家操作旋轉與移動
- 清除一整排可得分
- 需要規劃方塊堆疊避免上頂

### 5. Flappy Sky

- 角色持續往下掉落
- 透過點擊或按空白鍵控制上升
- 以穿越障礙物為目標

### 6. Drive Ahead

- 以簡單的車輛/前進類遊戲玩法為核心
- 需要在障礙與路線中做判斷
- 典型 arcade-style 競速 / 閃避遊戲

## 開發規範與原則

這個專案的設計有幾個核心原則：

### 不把所有遊戲程式碼塞進單一檔案

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

- 規則邏輯
- 狀態管理
- 輸入處理
- 更新循環
- 繪製
- 結束判定
- 遊戲專屬 UI

### 讓遊戲為獨立模組

每個遊戲都應：

- 有自己獨立的 JS 檔
- 有自己獨立的 CSS 檔
- 在全域 `window.MiniArcadeGames` 註冊
- 提供統一的 `launch(container, api)` 入口

### 不直接在遊戲模組中操作平台 Modal / 遊戲列表

遊戲應透過 API 來更新分數與儲存成果：

```javascript
api.updateScore(score);
api.recordScore(score);
```

這保持了遊戲邏輯與平台邏輯的分離，也讓平台更容易擴充與維護。

## 新增遊戲的建議流程

若要新增一款遊戲，建議依照以下流程：

1. 在 `js/games/` 建立新的遊戲檔案（例如 `sample.js`）
2. 在 `css/games/` 建立相對應的 CSS 檔
3. 在 `index.html` 中加入 `<script src="js/games/...">` 依序載入
4. 在遊戲模組中使用：

```javascript
window.MiniArcadeGames = window.MiniArcadeGames || {};
```

5. 建立 `launch(container, api)` 入口
6. 實作 `togglePause` 與 `destroy`
7. 若必要，實作 `restart`、`refresh` 或 `resize`
8. 讓遊戲透過 `api.updateScore()` 和 `api.recordScore()` 與平台整合
9. 使用 `MiniArcadeStorage` 進行資料存取

## 目前已知的開發風格

專案目前保持極簡與直觀的開發態度：

- 沒有複雜框架
- 沒有前端建置流程
- 沒有 TypeScript 編譯
- 沒有後端依賴
- 沒有大規模狀態管理庫

這對一個小型離線遊戲平台來說非常適合，因為它能讓專案更容易：

- 初學者理解
- 快速迭代
- 低成本維護
- 跨平台執行

## 開發建議

### 對維護者的建議

- 遊戲互相獨立，不要把邏輯寫在 `app.js`
- 儲存邏輯集中在 `storage.js`
- 新增遊戲時一定要維持一致 API
- 盡量遵守 `window.MiniArcadeGames` 註冊模式
- 保持遊戲 CSS 與平台 CSS 分離

### 對貢獻者的建議

- 先閱讀 `index.html` 和 `js/app.js` 以理解平台核心
- 再看一個既有遊戲模組，例如 `snake.js` 或 `2048.js`
- 維持風格一致，避免隨意重構整個主架構
- 遊戲新增時，務必保持離線使用特性

## 未來規劃

根據目前專案願景，未來可能擴充：

- 更多 arcade 類遊戲
- 更完整的排行榜與紀錄
- 成就系統
- 設定選項（音效、難度、操作設定）
- 純本地化遊戲統計
- 更好的遊戲選單排序系統
- 遊戲互動動畫與視覺回饋

## 常見問題

### Q: 為什麼不用 Node 或 npm？

因為這個專案設計上是純前端靜態網站，不需要建立中介層或打包流程，這樣能保持本機開發與使用的簡單程度，並降低相容性問題。

### Q: 為什麼不直接打開 `index.html` 就好？

雖然可以用檔案方式打開，但本專案依賴 `localStorage` 和本機 HTTP 環境的穩定性，透過 `python -m http.server` 啟動更穩定。

### Q: 如何新增一個遊戲？

建立新遊戲 JS + CSS，註冊到 `window.MiniArcadeGames`，然後讓 `app.js` 自動從註冊表載入與顯示即可。

### Q: 這個專案有後端嗎？

沒有。這是一個純前端離線專案，不依賴任何後端 API。

## 授權

目前專案未明確附加授權條款，若要對外發佈或再利用，建議在使用前確認作者是否有特定授權要求。

## 貢獻方式

你可以透過以下方式參與：

- 改善現有遊戲玩法
- 修正功能錯誤
- 優化 UI 與使用者體驗
- 新增遊戲模組
- 補充說明文件
- 提升可維護性與架構品質

## 結語

Mini Arcade 是一個用來實驗「純前端離線遊戲平台」設計的輕量專案。它結合了簡潔的 UI、模組化架構與可維護的遊戲邏輯，讓遊戲開發與擴充���加容易。

如果你想要快速建立一個可本機運作的小型遊戲集合，這個專案是一個很好的起點。

如果你想要深入開發、擴充更多遊戲，建議先從 `js/app.js`、`js/storage.js` 以及其中一個遊戲模組，例如 `snake.js` 開始閱讀，這樣能最快掌握專案的整體設計。

---

Mini Arcade
Offline browser game collection

Built with HTML, CSS, and JavaScript.
Designed for local, private, and self-contained entertainment.
