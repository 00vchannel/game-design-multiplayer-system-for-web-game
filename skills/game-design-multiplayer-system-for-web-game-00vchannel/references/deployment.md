# 發佈流程
1. 使用學員自己的 Cloudflare 帳號。setup 提供 Node/npm、固定 Wrangler、三個官方 Cloudflare Skills 及 MCP；本 Skill 負責多人程式的接入規則。
2. 已登入直接沿用。未登入由 AI 執行課程版 `wrangler login --device --browser=false`，將它實際回傳的驗證網址開在 ZCode 內建瀏覽器，讓本人輸入代碼及授權。MCP 原生 OAuth 可能由 ZCode 開系統瀏覽器；不能複製憑證或自行修改回呼。
3. 確認已取得本次作品的發佈授權。選定專屬 Worker 名稱，檢查目前帳號是否已有同名作品，避免蓋掉其他專案；不要為每次更新建新服務。未授權時先完成本機可檢閱成果。
4. 在作品資料夾執行 build，再由既有 Wrangler deploy。保留 assets binding、/api/mp 路由、ClassroomRoom export、ROOMS binding 及 new_sqlite_classes migration；變更已有部署的 migration 要增量新增，不能刪改歷史。
5. 只使用 Workers 靜態資源與 SQLite Durable Objects；不加 R2、付費資料庫、TURN、分析服務或其他非必要資源。不改帳號方案；平台真的要求升級就停止。免費額度用盡可能失敗，不承諾永久免費無限連線。
6. 分享同一個 HTTPS 網站產生的 invite URL。hostToken 只留房主連線記憶體，不能加進分享連結、日誌或網站原始碼。沒有模型 API 金鑰要部署到遊戲。
7. 登入成功、MCP 顯示工具、部署成功和多人成功是不同結果。完成後核對公開頁面與兩人操作，報告還未完成的實體手機／跨網路驗證。

官方來源：
- https://developers.cloudflare.com/agent-setup/prompt.md （只採課程需要部分，不執行全量安裝）
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://zcode.z.ai/en/docs/skill
- https://zcode.z.ai/en/docs/browser-use
