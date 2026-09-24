import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source=readFileSync(new URL('../delegators/delegator-access.js',import.meta.url),'utf8');
const init=source.slice(source.indexOf('async function init(options = {})'),source.indexOf('window.TDSPDelegatorAccess ='));
const connect=source.slice(source.indexOf('async function connectWallet(walletInfo)'),source.indexOf('async function walletHasAdminCredential'));
function walletContext(addresses,network=1){
  const state={authenticated:[],choices:[]};
  const wallet={getNetworkId:async()=>network};
  const ctx=vm.createContext({ROLE:'delegator',t:value=>value,setStatus(){},
    loadMesh:async()=>({BrowserWallet:{enable:async()=>wallet}}),
    getWalletAddresses:async()=>addresses,
    authenticateAddress:async(w,address)=>{assert.equal(w,wallet);state.authenticated.push(address);},
    renderStakeAddressChoices(w,items){state.choices.push(...items);}
  });
  vm.runInContext(connect,ctx);
  return {ctx,state};
}
test('one unique stake key goes directly to wallet authentication',async()=>{
  const {ctx,state}=walletContext(['stake1member','stake1member']);
  await ctx.connectWallet({id:'wallet',name:'Wallet'});
  assert.deepEqual(state.authenticated,['stake1member']);
  assert.deepEqual(state.choices,[]);
});
test('multiple stake keys require an explicit selection',async()=>{
  const {ctx,state}=walletContext(['stake1first','stake1second']);
  await ctx.connectWallet({id:'wallet',name:'Wallet'});
  assert.deepEqual(state.authenticated,[]);
  assert.deepEqual(state.choices,['stake1first','stake1second']);
});
test('missing stake keys and testnet wallets cannot authenticate',async()=>{
  for(const [addresses,network] of [[[],1],[['stake1member'],0]]){
    const {ctx,state}=walletContext(addresses,network);
    await assert.rejects(ctx.connectWallet({id:'wallet',name:'Wallet'}));
    assert.deepEqual(state.authenticated,[]);
  }
});
function context(token=''){
  const state={discoveries:0,authenticated:null};
  const ctx=vm.createContext({
    ROLE:'delegator',IS_EMBEDDED:false,sessionToken:token,
    window:{},document:{body:{classList:{remove(){}}},getElementById(){return null;},querySelectorAll(){return []; }},
    setRaffleRole(){},showAuthenticatedUi(value){state.authenticated=value;},
    async populateWallets(){state.discoveries++;},async loadProtectedArea(){state.authenticated=true;},
    setStatus(){},logout(){},openMemberPortfolio(){},improveLostStakeMessage(){},submitDraw(){},submitExclusions(){},submitAdminUsers(){},submitLostStakeMessage(){}
  });
  vm.runInContext(init,ctx);
  return {ctx,state};
}
test('dashboard immediately lists wallets for an unauthenticated delegator',async()=>{
  const {ctx,state}=context();
  await ctx.init({overlay:true});
  assert.equal(state.discoveries,1);
  assert.equal(state.authenticated,false);
});
test('an existing authenticated session opens without another wallet prompt',async()=>{
  const {ctx,state}=context('session');
  await ctx.init({overlay:true});
  assert.equal(state.discoveries,0);
  assert.equal(state.authenticated,true);
});
test('delegator template shows the short connection prompt without an extra connect button',()=>{
  const template=readFileSync(new URL('../delegators/delegator-dashboard-template.js',import.meta.url),'utf8');
  const delegator=template.slice(template.indexOf('function createDelegatorsDashboardBody'),template.indexOf('function createAdmin'));
  assert.match(delegator,/data-wallet-connect/);
  assert.match(template,/createWalletConnectBox/);
  assert.match(template,/Select wallet and connect/);
  assert.match(delegator,/id="raffle-wallet-list"/);
  assert.doesNotMatch(delegator,/Connect Delegator Wallet/);
});
