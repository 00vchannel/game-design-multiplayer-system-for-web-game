# 多人連線起始範本

這是 Game design: Multiplayer system for web game 附帶的連線檢查場，供 AI 接入學員自己的玩法。不是湯屋完成版，也不替學員寫好課堂遊戲。

課程 setup 已安裝依賴。維護／AI 操作：在此資料夾啟動 `npm run build`（先產生 Worker 靜態資源目錄），接著分別保持 `npm run relay`（8790）及 `npm run dev`（5174）運行。開啟 http://127.0.0.1:5174 ，兩個頁面開房與加入。未經本人授權不執行 deploy。

若直接複製此範本，先按鎖檔安裝：`npm install --ignore-scripts --no-audit --no-fund`，再建置。套件版本不可浮動更新。課程下載的 Node 路徑在上一層 .node-path，由 AI 加入當次命令 PATH，不要求學員改環境變數。

`src/game/adapter.js` 是玩法接口；`src/main.js` 是顯示及輸入。詳細契約與排錯在已安裝 Skill 的 references。`npm test` 檢查示例玩法與傳輸格式；要確認真實多人還需雙瀏覽器操作。

一次 2–4 人。按互動讓共同計數達六次，或倒數到零後可再開局。這只是同步檢查，不是預設遊戲設計。房主切換視窗保留房間；真正離開、刷新、關閉或斷線結束房間，不自動換房主。系統休眠可能暫停模擬。

公網使用同一個 Cloudflare HTTPS 作品；localhost 只用於本機。禁止付費升級、金鑰上傳或把 hostToken 放入邀請連結。
