# 玩法接入接口

## 檔案責任
| 檔案 | 可修改範圍 |
|---|---|
| src/game/adapter.js | 學員的共同狀態、規則、勝負及驗證 |
| src/main.js、style.css、index.html | 渲染、HUD、鍵盤與手機輸入 |
| src/net/multiplayer.js | 串連連線與房主 Worker；通常保留 |
| src/net/host.worker.js | 固定步長、輸入去重、快照；通常保留 |
| src/net/room-client.js | 邀請、WebSocket、心跳、取消連線；保留 |
| shared/protocol.js、worker/index.js | 傳輸格式、角色權限、房間階段；保留 |
| vite.config.js、wrangler.jsonc | 本機代理、靜態檔案、SQLite DO 綁定與版本 |

既有作品：先比對檔案，再合併連線層、Worker 與設定，沿用原來畫面。不要把範本 main.js 蓋到已完成的遊戲。備份不能包含憑證。新作品可從整個範本開始，再替換檢查場玩法。課程 setup 已在 `multiplayer-starter` 安裝依賴；直接從 Skill 複製時，用其鎖檔安裝，禁止 latest。

## adapter 的六個函式（名稱與參數順序固定）
```js
createState(players)                 // 回傳全新 JSON 狀態；每次 round 都重新建立
syncPlayers(state, players)          // 修改 state；保留在線玩家，回收離線玩家物品
applyInput(state, playerId, input)   // 修改 state；一次性的動作，只由房主呼叫
step(state, dt, inputs)              // 修改 state；固定 dt=0.05，inputs 是 Map<id,{x,z,at}>
isFinished(state)                    // 回傳 boolean，決定何時容許下一局
validateState(state)                 // 回傳 boolean；房主輸出、訪客接收均使用
```
`players` 是服務提供的 `{id,name,host}` 陣列，最多四人。`input` 是 `{seq,x,z,action}`；x/z 有限且介於 -1 至 1，action 是單次操作。不可相信玩家帶來的傷害或座標；要從房主狀態計算。新玩法需要額外按鈕時，一起更新 protocol、服務轉送、runtime、Worker、輸入 UI 及驗證，不可只把額外欄位塞進 main.js。

`Multiplayer` 的接口：`connect(name, invite)`、`start()`、`input(x,z,action)`、`close()`。`invite` 為 null 時開房，否則是 `{id,invite}`。`onChange(view)` 提供 id、host、players、round、phase、state、share、message、lastSnapshot。渲染只讀 `view.state`；不能在渲染回呼偷偷改分數。`phase` 為 idle、connecting、lobby、playing、finished、closed。

## 料理等共同物件的正確寫法
```js
export function applyInput(state, playerId, input) {
 const player = state.players.find(p => p.id === playerId);
 if (!player || !input.action) return;
 const item = findReachableItem(state, player); // 依房主位置判斷距離
 if (!item || item.ownerId !== null || player.heldId !== null) return;
 item.ownerId = playerId;
 player.heldId = item.id; // 同一個同步函式內完成，不能 await
}
```
上面僅示範原子領取，不可直接貼進缺少這些欄位的遊戲。必須依學員自己的 state 建立欄位、初始化、釋放及 validateState。第二個玩家的操作到來時會看到已被領取，不能再次成功。

離線回收：先找 roster 中已不在的舊玩家，取出其 heldId，將物品 ownerId 設回 null 並放在可取得位置，再刪玩家。不要先刪玩家才尋找他拿著的物品。再次開局直接 createState，不把上一局物品混回來。

## 時間、序號與體積
- 固定 20Hz 模擬、最多 10Hz 快照；輸入約 10Hz＋單次動作。這些是起始預算，不為追求畫面流暢而改成每幀送完整世界。
- 畫面流暢度可用本機插值；插值狀態不回寫共同狀態。晚到快照必須按 round/revision 丟棄。
- 房主在 await 期間不能判定共同物件。載入素材、模型、音效在開始前處理，渲染層用 id 對應本機資源。
- 超過 48,000 UTF-8 bytes 的訊息會被拒絕；同玩家每秒最多 40 個非心跳訊息。位置以數值傳送，不傳完整 Three.js scene。
- host worker 在休眠後最多補算 0.2 秒，避免醒來瞬間輸掉。這是暫停恢復策略，不等於精確牆鐘倒數；要更改時間語義，先確認學員玩法需要並補測。
- 本範本適合可信親友小房間。房主可改自己程式，因此不是防作弊競技伺服器。
## Three.js 接入
Three.js 已在鎖定依賴內。保留 main.js 中的 Multiplayer 與輸入，將 Canvas 繪製改成你自己的場景渲染即可：以玩家 id 對應 mesh，每次只從 view.state 複製位置／動畫狀態；玩家離開時移除對應 mesh，離開作品時 dispose 幾何、材質與 renderer。角色碰撞、拾取距離和分數仍放在 adapter，由房主計算，不能依賴某台電腦的 Three.js raycast 結果決定全隊得分。手機顯示品質可降低，不改動共同規則。
