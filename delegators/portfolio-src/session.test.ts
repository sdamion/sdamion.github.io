import assert from 'node:assert/strict';
import {acceptRenewedSession} from './session.ts';
const data=new Map<string,string>();
const storage={getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);}};
data.set('tdsp-raffle-session-delegator','old');
data.set('tdsp-raffle-session-admin','old');
acceptRenewedSession(storage,'old','new');
assert.equal(storage.getItem('tdsp-raffle-session-delegator'),'new');
assert.equal(storage.getItem('tdsp-raffle-session-admin'),'new');
acceptRenewedSession(storage,'old','late');
assert.equal(storage.getItem('tdsp-raffle-session-admin'),'new');
data.clear();
acceptRenewedSession(storage,'old','late');
assert.equal(data.size,0);
data.set('tdsp-raffle-session-delegator','different-login');
acceptRenewedSession(storage,'old','late');
assert.equal(storage.getItem('tdsp-raffle-session-delegator'),'different-login');

// Portfolio sessions renew independently of the wallet session, and logout wins.
data.set('tdsp-portfolio-session','account-old');
acceptRenewedSession(storage,'account-old','account-new');
assert.equal(storage.getItem('tdsp-portfolio-session'),'account-new');
assert.equal(storage.getItem('tdsp-raffle-session-delegator'),'different-login');
data.delete('tdsp-portfolio-session');
acceptRenewedSession(storage,'account-new','late-account-renewal');
assert.equal(storage.getItem('tdsp-portfolio-session'),null);
