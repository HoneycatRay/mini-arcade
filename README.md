# Mini Arcade

一個可在 Windows / macOS 上直接以瀏覽器開啟的離線小遊戲平台。

## 啟動
直接雙擊 `index.html`。不需要網路、Node.js、npm 或任何外部套件。

## 第一版遊戲
- 貪吃蛇
- 2048
- 俄羅斯方塊
- 踩地雷
- Flappy Sky
- Mini Racing
- Sky Jumper
- 猜數字

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

## 新增遊戲
在 `games/` 新增 JavaScript，並在 `index.html` 用 `<script src="games/你的遊戲.js"></script>` 載入，再以 `MiniArcade.register({...})` 註冊即可。
