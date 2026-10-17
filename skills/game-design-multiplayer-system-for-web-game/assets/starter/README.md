# 多人連線起始範本

這是 Game design: Multiplayer system for web game 附帶的連線檢查場，供 AI 接入使用者自己的玩法。範本只示範連線與同步，不指定作品玩法。

先確認 Node/npm 可用，並依下一段準備依賴。維護／AI 操作：在此資料夾啟動 `npm run build`（先產生 Worker 靜態資源目錄），接著分別保持 `npm run relay`（8790）及 `npm run dev`（5174）運行。開啟 http://127.0.0.1:5174 ，兩個頁面開房與加入。未經本人授權不執行 deploy。

依賴尚未就緒時，使用專案鎖檔執行 `npm ci --ignore-scripts --no-audit --no-fund`，再建置；先保護已有依賴中的手動修改。已有作品依其套件清單及鎖檔處理，不整套覆蓋。確認目前終端能執行 Node/npm，不依賴父目錄或特定安裝器的路徑檔。

`src/game/adapter.js` 是玩法接口；`src/main.js` 是顯示及輸入。詳細契約與排錯在已安裝 Skill 的 references。`npm test` 檢查示例玩法與傳輸格式；要確認真實多人還需雙瀏覽器操作。

一次 2–4 人。按互動讓共同計數達六次，或倒數到零後可再開局。這只是同步檢查，不是預設遊戲設計。房主切換視窗保留房間；真正離開、刷新、關閉或斷線結束房間，不自動換房主。系統休眠可能暫停模擬。

公網使用同一個 Cloudflare HTTPS 作品；localhost 只用於本機。禁止付費升級、金鑰上傳或把 hostToken 放入邀請連結。
