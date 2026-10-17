# 發佈流程
1. 使用使用者自己的 Cloudflare 帳號。先檢查專案的 Node/npm、鎖定版本 Wrangler 與帳號授權；缺少工具時按專案需求準備，不假設另有安裝器。Cloudflare Skills 或 MCP 已安裝且適用時才使用，不以它們作為必要前提。
2. 已登入直接沿用。未登入時先核對已安裝 Wrangler 的登入說明，使用該版本支援的流程，讓本人在官方頁面批准。若使用 MCP，依目前工具支援的 OAuth 流程處理；不強制指定編輯器或瀏覽器，不複製憑證或自行修改回呼。
3. 確認已取得本次作品的發佈授權。選定專屬 Worker 名稱，檢查目前帳號是否已有同名作品，避免蓋掉其他專案；不要為每次更新建新服務。未授權時先完成本機可檢閱成果。
4. 在作品資料夾執行 build，再由既有 Wrangler deploy。保留 assets binding、/api/mp 路由、ClassroomRoom export、ROOMS binding 及 new_sqlite_classes migration；變更已有部署的 migration 要增量新增，不能刪改歷史。
5. 只使用 Workers 靜態資源與 SQLite Durable Objects；不加 R2、付費資料庫、TURN、分析服務或其他非必要資源。不改帳號方案；平台真的要求升級就停止。免費額度用盡可能失敗，不承諾永久免費無限連線。
6. 分享同一個 HTTPS 網站產生的 invite URL。hostToken 只留房主連線記憶體，不能加進分享連結、日誌或網站原始碼。沒有模型 API 金鑰要部署到遊戲。
7. 登入成功、MCP 顯示工具、部署成功和多人成功是不同結果。完成後核對公開頁面與兩人操作，報告還未完成的實體手機／跨網路驗證。

官方來源：
- https://developers.cloudflare.com/agent-setup/prompt.md （只採本次部署需要部分，不執行無關安裝）
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
