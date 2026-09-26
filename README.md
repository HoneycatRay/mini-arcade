# Mini Arcade

一個可在 Windows / macOS 上直接以瀏覽器開啟的離線小遊戲平台。

## 啟動
使用本機 HTTP Server 提供專案檔案，例如 `http://localhost:8000`。
不需要網路、Node.js、npm 或任何外部套件。

直接以 `file://` 開啟時，瀏覽器對 `localStorage` 的支援可能不同，因此不保證主題與遊戲紀錄可持續保存。

## 第一版遊戲
- 目前已實作：貪吃蛇、2048、踩地雷、俄羅斯方塊、Flappy Sky、Drive Ahead!
- 規劃中：Mini Racing、Sky Jumper、猜數字

## 特色
- Apple-like 極簡介面
- 深色 / 淺色模式
- 全螢幕
- 鍵盤操作
- 暫停
- 遊戲說明
- 每款遊戲本機最高分與歷史紀錄
- 無 CDN、無網路依賴
- 遊戲程式獨立放在 `games/`，方便日後新增
