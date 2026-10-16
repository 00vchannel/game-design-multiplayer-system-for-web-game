# 常見問題與修復
| 現象 | 先查 | 正確處理／不可做 |
|---|---|---|
| 切到其他軟體立即關房 | visibilitychange、blur 有沒有 close/dispose | 只清輸入；不可把 document.hidden 當離線 |
| 房主背景後客人不能動 | 模擬是否藏在 rAF 或 visible 條件內 | 保留 host.worker 的固定步長；rAF 只渲染 |
| 電腦睡眠後一回來就被踢 | 心跳是否把停頓當網路失敗 | 回來先等新 ping/pong；真正斷線仍結束，不承諾休眠續局 |
| 雲端還有 pong，但玩家不動 | lastSnapshot 是否停止 | 顯示等待房主同步，不把 relay 活著當玩法正常，不自行選新房主 |
| 角色失焦後一直走 | blur、keyup、pointercancel、lostpointercapture | 立即送零方向，房主還要淘汰 400ms 未更新的方向 |
| 同時領物品出現複製／重複得分 | 訪客是否直接改 state；房主有無 await | 只由房主同步檢查＋修改；動作 seq 去重；保留物品唯一 owner |
| 重開局回到舊分數或瞬間結束 | 有沒有等服務端 round；有無清輸入/seq | 新局 createState；雲端允許 finished→playing；丟棄上一局訊息 |
| 網頁說進行中但新玩家擠進來 | 是否只在前端檢查 | HTTP 查詢和 WebSocket upgrade 都驗人數與 phase；客人結束後重試 |
| 客人能偽裝房主／其他玩家 | server 是否相信 data.id 或 data.host | 角色與 id 只看 socket attachment；訪客 snapshot 必須被忽略 |
| 久置後連線還在但角色消失 | DO constructor 是否恢復 attachment | 由 getWebSockets + deserializeAttachment 恢復，meta 讀 storage；不要在 constructor 關房 |
| JSON 解析錯誤／出現 HTML | Vite proxy、Wrangler 是否都啟動 | 保留 /api/mp 代理；只啟動前端不等於房間服務正常 |
| 公開頁面載不到 Worker 或 JS | build dist、assets directory、base 路徑 | deploy 前 build，含 host worker 產物；不要上傳來源程式代替 dist |
| localhost 拒絕連線的授權頁 | 是否使用一般 OAuth 本機回呼 | Wrangler 用 device 登入，AI 開真正驗證網址；不是自行開 localhost |
| 邀請手機卻連不到 | 分享的是 localhost 或內網 IP 嗎 | 跨地點要使用同一個已發佈 HTTPS 網站；不用開路由器 port |
| 有按鈕但沒有動作／連按才有效 | 焦點、repeat、action 序號與 cooldown | 動作只在邊緣觸發；不能每個 frame 重送 action=true |
| 訊息太大或操作過頻 | 網路幀大小、bufferedAmount、非心跳頻率 | 精簡快照／節流；不要直接移除服務限制 |
| 重跑 setup 停在檔案衝突 | 既有 Skill 或 package 是否改過 | 保留修改與作品；在新課程資料夾準備新版，先比較再合併 |
| 部署要求升級或付款 | 是否用了非課程服務／非 SQLite DO | 停止該步驟，保留本機成果；不得自動開通、付費或繞過限制 |

排錯順序：記錄一個可重現操作 → 查看客人與房主各自狀態 → 查看房間服務階段與 WS 事件 → 定位一個最小修正 → 重新驗證同一操作。日誌不要輸出 hostToken、完整 invite、OAuth token 或 API 金鑰。

不用重新開房作為所有問題的通用答案；只在房間確實終止、版本不相容或無法恢復時要求重新開房。每次建立物件或發佈逾時後先查是否已完成，不要直接重複建立。
