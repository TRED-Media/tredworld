import test from 'node:test';
import assert from 'node:assert/strict';
import {visibleInOffice} from '../shared/presence.js';

test('office only shows online users or office check-ins; onsite staff stay outside',()=>{
 assert.equal(visibleInOffice({online:false,status:'Off Duty'}),false);
 assert.equal(visibleInOffice({online:true,status:'Off Duty'}),true);
 assert.equal(visibleInOffice({online:false,status:'At Office'}),true);
 assert.equal(visibleInOffice({online:true,status:'Onsite'}),false);
 assert.equal(visibleInOffice({online:false,status:'Onsite'}),false);
 assert.equal(visibleInOffice(null),false);
});
