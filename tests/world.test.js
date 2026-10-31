import test from 'node:test';import assert from 'node:assert/strict';import {blocked,rooms,desks,people} from '../src/world.js';
test('eight employees and unique room IDs',()=>{assert.equal(people.length,8);assert.equal(new Set(rooms.map(r=>r.id)).size,rooms.length);});
test('scene walls block while the meeting room doorway remains open',()=>{assert.equal(blocked(815,470),true);assert.equal(blocked(815,620),false);});
test('furniture blocks movement; main corridor reaches parking',()=>{for(const d of desks)assert.equal(blocked(d.x+30,d.y+20),true);for(let y=740;y<1200;y+=4)assert.equal(blocked(860,y),false);assert.equal(blocked(-5,300),true);});
