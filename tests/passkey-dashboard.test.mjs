import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source=readFileSync(new URL('../delegators/delegator-access.js',import.meta.url),'utf8');
const restore=source.slice(source.indexOf('async function restorePasskeyDashboard('),source.indexOf('async function openMemberPortfolio('));
const connect=source.slice(source.indexOf('async function connectPortfolioPasskey('),source.indexOf('async function restorePasskeyDashboard(')).replace(/await import\('[^']+'\)/,'globalThis.module');
function fixture(session){
  const storage=new Map([['tdsp-raffle-session-admin','previous-admin'],['tdsp-raffle-session-delegator','previous-member']]);
  const state={events:[],loads:0,signedIn:0,authenticated:false,status:[],tiles:{'raffle-open':{hidden:false},'raffle-prizes-open':{hidden:false}}};
  const ctx=vm.createContext({
    ADMIN_SESSION_KEY:'tdsp-raffle-session-admin',sessionToken:'previous-admin',passkeyLoginPending:false,
    portfolioUnlockWallet:{},adminTransactionWallet:{},
    sessionStorage:{getItem:key=>storage.get(key)||null,setItem:(key,value)=>storage.set(key,value),removeItem:key=>storage.delete(key)},
    module:{async getPortfolioDashboardSession(){return session;},async signInPortfolioWithPasskey(){state.signedIn++;}},
    window:{dispatchEvent:event=>state.events.push(event.type)},CustomEvent:class{constructor(type){this.type=type;}},
    document:{getElementById:id=>state.tiles[id]||null,querySelector:()=>null},
    showAuthenticatedUi:value=>{state.authenticated=value;},postEmbeddedDelegatorIdentity(){},
    setStatus:(text,error)=>state.status.push({text,error}),async loadProtectedArea(){state.loads++;}
  });
  vm.runInContext(restore+connect,ctx);
  return {ctx,state,storage};
}
test('admin passkey opens the admin dashboard and clears the previous identity',async()=>{
  const {ctx,state,storage}=fixture({role:'admin',token:'verified-admin'});
  await ctx.connectPortfolioPasskey();
  assert.equal(state.signedIn,1);
  assert.deepEqual(state.events,['tdsp:open-admin-dashboard']);
  assert.equal(storage.get('tdsp-raffle-session-admin'),'verified-admin');
  assert.equal(storage.has('tdsp-raffle-session-delegator'),false);
  assert.equal(ctx.portfolioUnlockWallet,null);
  assert.equal(ctx.passkeyLoginPending,false);
});
test('member passkey loads the user dashboard without opening Portfolio',async()=>{
  const {ctx,state,storage}=fixture({role:'delegator',token:'verified-member'});
  await ctx.connectPortfolioPasskey();
  assert.equal(state.loads,1);
  assert.deepEqual(state.events,[]);
  assert.equal(storage.get('tdsp-raffle-session-delegator'),'verified-member');
  assert.equal(storage.has('tdsp-raffle-session-admin'),false);
});
test('historical standalone passkeys cannot restore a removed user Portfolio dashboard',async()=>{
  const {ctx,state,storage}=fixture({role:'portfolio',member_id:'portfolio:legacy'});
  await assert.rejects(ctx.restorePasskeyDashboard(ctx.module), /available to admins only/);
  assert.equal(state.authenticated,false);assert.equal(state.loads,0);
  assert.equal(storage.size,0);assert.equal(ctx.sessionToken,'');
});
test('cancelled passkey stays on login and reports the cancellation',async()=>{
  const {ctx,state}=fixture({});
  ctx.module.signInPortfolioWithPasskey=async()=>{throw Object.assign(new Error('cancelled'),{name:'NotAllowedError'});};
  await ctx.connectPortfolioPasskey();
  assert.equal(state.loads,0);assert.deepEqual(state.events,[]);
  assert.equal(state.status.at(-1).text,'Passkey request cancelled or timed out. Please retry.');
  assert.equal(ctx.passkeyLoginPending,false);
});
