# 開發規則
- 專用 Skill 名稱：Game design: Multiplayer system for web game；可攜識別字 game-design-multiplayer-system-for-web-game。接入／修改多人玩法前，先讀該 Skill 與 references/integration.md。
- 保留學員自己寫的玩法 prompt；不要把同步檢查場當成他選好的遊戲。
- 預設只改 src/game/adapter.js 與顯示層。共同狀態由房主 Worker 修改；訪客只傳操作。
- 切換視窗只釋放輸入，不關房。requestAnimationFrame 只渲染；保留固定步長、序號、局次及狀態驗證。
- 修改共享物件時同步補上重複領取防護、離線回收、新局重置；不要刪除安全檢查來讓錯誤消失。
- 跨地點連線使用自己授權發佈的 HTTPS 網站。不要上傳金鑰、分享 hostToken 或開通付費服務。
- 已有發佈授權可以沿用；沒有時先完成本機可檢閱成果。工具與套件依鎖定版本，不任意更新。
