import test from 'node:test';
import assert from 'node:assert/strict';
import { validInput, validSnapshot, parseMessage, MAX_BYTES } from '../shared/protocol.js';
import * as game from '../src/game/adapter.js';
const roster = [{id:'a',name:'甲',host:true},{id:'b',name:'乙',host:false}];
test('操作拒絕 NaN、過大方向與非整數序號', () => {
 const input = {seq:1,x:0,z:1,action:true}; assert.equal(validInput(input), true);
 for (const change of [{seq:0},{seq:1.1},{x:Infinity},{z:2},{action:'yes'}]) assert.equal(validInput({...input,...change}),false);
 assert.equal(parseMessage('null'),null); assert.equal(parseMessage('{'),null);
 assert.equal(parseMessage(JSON.stringify({text:'中'.repeat(MAX_BYTES/2)})),null);
 assert.equal(validSnapshot({round:1,revision:1,finished:false,state:{}}),true);
 assert.equal(validSnapshot({round:1,revision:NaN,finished:false,state:{}}),false);
});
test('示例共同狀態由房主修改，移動正規化、勝負及再開局重置', () => {
 const s=game.createState(roster), before=s.players[0].x;
 game.step(s,.05,new Map([['a',{x:1,z:1}]]));assert.ok(s.players[0].x>before);assert.ok(s.players[0].x-before<.15);
 for(let n=0;n<6;n++){game.applyInput(s,'a',{action:true});game.step(s,.3,new Map());}
 assert.equal(s.count,6);assert.equal(game.isFinished(s),true);assert.equal(game.validateState(s),true);
 const next=game.createState(roster);assert.equal(next.count,0);assert.equal(next.remaining,180);assert.equal(next.players[0].cooldown,0);
 game.syncPlayers(next,roster.slice(0,1));assert.equal(next.players.length,1);
 game.applyInput(next,'unknown',{action:true});assert.equal(next.count,0);
});
test('一次互動不因同幀重入增加兩次，結束後不再增加', () => {
 const s=game.createState(roster);game.applyInput(s,'a',{action:true});game.applyInput(s,'a',{action:true});assert.equal(s.count,1);
 s.count=6;game.applyInput(s,'b',{action:true});assert.equal(s.count,6);
 s.players[0].x=NaN;assert.equal(game.validateState(s),false);
});
