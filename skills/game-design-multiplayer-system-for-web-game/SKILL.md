---
name: game-design-multiplayer-system-for-web-game
description: "Game design: Multiplayer system for web game。當學員提到此名稱、要求將自己的網頁遊戲接上 2–4 人房間，或修復其同步、背景分頁、離線及重開局問題時使用。內附 Cloudflare 轉送、房主判定的可執行範本；支援 Canvas 或 Three.js，不替學員決定玩法。"
---

# Game design: Multiplayer system for web game

by Deep Frame Studio

讓學員用自己寫的 prompt 開發玩法，同時沿用本 Skill 的多人基礎。這是「房主電腦運算、Cloudflare Workers + SQLite Durable Objects 轉送」，不是玩家直接互連，也不是雲端運算遊戲。2–4 人，電腦開房，電腦或手機加入；不需要購買伺服器，但免費額度不是無限制。

## 名稱與啟用
完整名稱就是 **Game design: Multiplayer system for web game**。Windows 資料夾不允許冒號，因此可攜識別字是 `game-design-multiplayer-system-for-web-game`；學員用完整名稱描述需求時，也必須載入本檔。ZCode 的 `$` 選單可能顯示資料夾識別字，不要謊稱一定顯示帶冒號的標題。

## 開始工作
1. 先讀目前專案及學員自己的 prompt。已給出的玩法不要重新決定；缺少會影響玩法的資訊才問。只安裝環境時不自行建立玩法。構思仍使用 gameplay-brainstorm-00vchannel，由學員親自寫開發 prompt。
2. 接入前讀 [玩法接入接口](references/integration.md)。既有作品先依實際連線版本整合；新專案以本次安裝 Skill 同目錄的 `assets/starter` 為範本，課程包的 `multiplayer-starter` 是固定版本檢查場，不假設與更新後 Skill 相同。沒有課程包時，本 Skill 也有完整範本，不依賴老師電腦路徑。已有遊戲時逐項合併，不能整包覆蓋作品。
3. 先保存修改前版本。盤點現有角色、輸入、互動、勝負與渲染，列出哪些狀態要全隊共享，再對照接口修改。通常只改 `src/game/adapter.js`、`src/main.js` 與畫面檔案；不要重寫 `src/net`、`shared/protocol.js` 或 `worker/index.js`。
4. 使用既有固定版本套件與鎖檔。依範本 README 啟動前端及本機房間服務；不要只開 Vite 就宣稱多人可用。需測試或使用者要求驗收時，依 [驗證情境](references/verification.md) 執行。不能把建置成功當作多人行為成功。
5. 發佈時才讀 [發佈流程](references/deployment.md)。setup 的登入授權不等於發佈作品授權。沿用已授權範圍，不重複詢問同一事項；不可啟用付費服務或要求查帳單。

## 不可破壞的連線規則
- 房主是唯一共同狀態來源。訪客只傳操作，不能傳分數、物品歸屬或完整世界狀態。角色 ID 由房間服務綁定 socket，不信任訪客自己填寫的 ID。
- 房主在 `host.worker.js` 中按固定步長更新玩法。`requestAnimationFrame` 只畫畫面，不能推進訂單、倒數、碰撞或共同狀態。玩法接口不能讀 DOM、`window`、Three.js 物件或發送網路要求。
- `visibilitychange`、`blur` 只清除輸入，不能關房、判定房主離線或停止多人模擬。背景 Worker 也可能被系統暫停；醒來要限制補算量，重新等心跳，不能以暫停時間直接判斷網路失效。不可用假音訊、禁止省電或不斷重新整理作為解法。
- 只有真正關閉遊戲、離開、連線失效或房間到期才結束房間。沒有自動換房主、刷新後重連或離線續玩；不要擅自承諾。
- `round` 隔離局次，`revision` 隔離快照，`seq` 去除重複操作。新局必須收到服務端 `round` 後才重建狀態；不能只把 UI 改成大廳，不能沿用前局物品、計時、輸入、序號。
- 每個玩家的連續方向輸入短時間未更新便歸零；互動只在按下瞬間送一次。不要把按住互動鍵變成每幀領取或交付。按鍵、觸控、取消觸控、失焦都要釋放。
- 爭用物件時，在房主的一次同步 `applyInput` 中先檢查再修改，不在中間 await。離線玩家持有的物品由 `syncPlayers` 回收至可取得的位置。
- 所有共享狀態都可 JSON 序列化且有界；禁止 NaN、Infinity、循環參照、場景物件、音訊、材質與圖片資料。只傳識別字、位置與玩法數值。改結構時同步改 `validateState`；不刪驗證來掩蓋錯誤。
- 雲端維持人數、授權、局次、房間階段與轉送；不把玩法 tick 移到 Durable Object。保留 Hibernation WebSocket API、連線 attachment 恢復、SQLite migration、訊息與頻率限制。

## 卡關時
讀 [常見問題與修復](references/troubleshooting.md)，按可觀察證據定位。不要為了解決一個錯誤而換平台、加自製 MCP、關閉來源檢查或一次重寫整個系統。

完成時只說明學員能做甚麼、實際驗證項目與尚未驗證的限制。明確區分「檔案已安裝」「ZCode 已載入」「本機多人可用」「公開網路可用」。
