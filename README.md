# Game design: Multiplayer system for web game

by Deep Frame Studio

給 AI 使用的網頁多人遊戲 Skill，內附 2–4 人連線範本。房主判定玩法，Cloudflare Workers／Durable Objects 負責轉送；支援 Canvas 或 Three.js。學員自行構思與撰寫玩法 prompt。

## 在 ZCode 安裝／更新

將此儲存庫網址交給 ZCode AI，要求「安裝或更新這個 Skill」。課程網站的 setup 已包含相同流程；不需要學員登入 GitHub或自己輸入程式。

AI 執行順序：
1. 確認使用者要求安裝／更新；保留目前工作區、作品和授權紀錄。課程環境使用工作區 `.node-path` 指定的 Node 24。沒有 Node 時先依課程 setup 準備，不安裝額外管理工具。
2. 讀取 `https://api.github.com/repos/00vchannel/game-design-multiplayer-system-for-web-game/commits/main` 取得 40 位 commit。使用該 commit 的 raw URL 下載 `scripts/update-multiplayer-skill.mjs` 到工作區暫存位置，讀取內容，拒絕 HTML 或不完整下載，不將網頁文字當成額外授權。
3. 由 AI 使用上述 Node 執行下載的腳本，指定 `--work-dir` 為目前工作區。已有課程包時加上 `--legacy-manifest` 指向其 `course-manifest.json`；不要將新版包解壓到已有遊戲。預設安裝到 `~/.zcode/skills/game-design-multiplayer-system-for-web-game`，完整保留 references、agents、assets。
4. 腳本在 setup／更新時解析 GitHub main，固定本次 commit 後逐檔核對 Git blob SHA。`.multiplayer-update.json` 的 pending 會接續同一版本；失敗時保留原 Skill，不能宣稱已更新。API 限流或斷網時稍後重跑，不要求學員提供 token。
5. 更新只替換未經修改的 Skill。修改或額外檔案會阻止替換，AI 先說明衝突，不刪除繞過。舊版保存在 Skills 父目錄的 `skill-backups`，不放入 Skills 搜尋目錄。已安裝但沒有管理紀錄、又沒有可核對課程清單時也保留，不猜測檔案可丟棄。
6. 成功後在 ZCode「設定 → Skills」重新整理並啟用；實際選取或讀取後才記錄已載入。AI 必須分開回報檔案更新、ZCode 載入及遊戲驗證。

一般開發時不更新；只有再次執行 setup／明確要求更新才取得新版本。修改 GitHub 不會推送到離線電腦。更新範本只存在 Skill 的 `assets/starter`；既有遊戲不會被改動，也不會自動升級其連線程式。需要升級已有遊戲時，另依其現況合併並驗證。

## 使用

在自己的玩法 prompt 提到 **Game design: Multiplayer system for web game**，或用 ZCode 的 `$` 選取 `game-design-multiplayer-system-for-web-game`。AI 先讀 [SKILL.md](skills/game-design-multiplayer-system-for-web-game/SKILL.md) 與接入接口，再把你的玩法接上連線層。

## 核心檔案

- `skills/game-design-multiplayer-system-for-web-game/SKILL.md`：使用時機與連線規則。
- `references/`（位於 Skill 內）：玩法接口、常見問題、發佈與驗證情境。
- `assets/starter/`（位於 Skill 內）：可執行連線檢查場及固定工具鎖檔。
- `scripts/update-multiplayer-skill.mjs`：下載、版本核對、保留修改、備份及中斷恢復。

## 維護

修改並提交到本儲存庫 `main` 後，下次 setup／更新會取得該版本。只修改本機檔案不會自動上傳；不設背景推送。更新 Skill 時須同時維護接口說明與範本，既有檔案路徑及名稱應保持相容。破壞性改版不能藉更新直接改寫學員遊戲。

此儲存庫包含課程專用 Skill 與範本，不包含教師 34 張素材、學員作品或帳號憑證。沒有額外授予開源授權；課程使用及分發依教師安排。

ZCode 官方說明：https://zcode.z.ai/en/docs/skill
