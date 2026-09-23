import {portfolioFetch,portfolioUpload,setSessionRole} from './transport';
import {deriveVaultKey,unlockMessage,openVault} from './vault-crypto';
import {prepareCheckpoint,restoreCheckpoint,type Checkpoint,type CheckpointIndex} from './vault-checkpoint';
import {setUploadProgress,resetUploadProgress} from './upload-progress';
import type {Snapshot} from './cache';
import {memberWallets} from './member';
import {loadLocal,saveLocal,removeLocal} from './local-store';

type Data={version:1;settings:Record<string,string>;snapshot:{key:string;data:Snapshot}|null};
export type StorageMode='local'|'remote';
export type SigningWallet={signData:(payload:string,address:string)=>Promise<{signature:string;key:string}>};
type State={stake:string;mode:StorageMode;key:CryptoKey|null;data:Data;revision:string|null;expiresAt:number;dirty:boolean;generation:number;blocked:boolean;controller:AbortController;index?:CheckpointIndex;pending?:{checkpoint:Checkpoint;generation:number};saved?:number};
let state:State|null=null,timer:ReturnType<typeof setTimeout>|undefined,running:Promise<void>|null=null;
let unlockGeneration=0;
let lastActivity=0,touchPending=false;
const notice=(message:string)=>window.dispatchEvent(new CustomEvent('tdsp:portfolio-cache-notice',{detail:message}));
const ownSetting=(stake:string,key:string)=>['tdsp-member-wallets-v1:','tdsp-member-cex-v1:','tdsp-member-basis:','tdsp-member-payments:'].some(prefix=>key===prefix+stake||key.startsWith(prefix+stake+'::'));
async function legacySnapshot(stake:string,settings:Record<string,string>):Promise<Data['snapshot']>{
  const wallets=memberWallets(stake,JSON.parse(settings['tdsp-member-wallets-v1:'+stake]||'null'));
  const key=stake+'::'+wallets.map(w=>w.address).sort().join('|');
  return new Promise((resolve,reject)=>{const request=indexedDB.open('tdsp-member-portfolio',1);request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result;if(!db.objectStoreNames.contains('snapshots')){db.close();resolve(null);return;}const get=db.transaction('snapshots').objectStore('snapshots').get(key);get.onsuccess=()=>{db.close();resolve(get.result?{key,data:get.result}:null);};get.onerror=()=>{db.close();reject(get.error);};};});
}
export function lockVault(){unlockGeneration++;clearTimeout(timer);timer=undefined;state?.controller.abort();state=null;resetUploadProgress();}
window.addEventListener('tdsp:portfolio-session-expired',lockVault);
async function userActivity(event:Event){
  if(!event.isTrusted||!state||state.blocked||touchPending||Date.now()-lastActivity<3600000||!(event.target instanceof Element)||!event.target.closest('.member-portfolio'))return;
  const current=state;touchPending=true;lastActivity=Date.now();
  if(current.mode==='local'){current.expiresAt=Date.now()+604800000;changed();touchPending=false;return;}
  try{const response=await portfolioFetch('/vault',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'touch'}),signal:current.controller.signal});if(response.ok){const value=await response.json();if(state===current)current.expiresAt=value.expires_at;}else if(response.status===410&&state===current){current.blocked=true;notice('Portfolio cache expired. Sign in and unlock again.');}}
  catch{/* Interaction can retry later; background writes never extend retention. */}
  finally{touchPending=false;}
}
window.addEventListener('pointerdown',userActivity,{passive:true});
window.addEventListener('keydown',userActivity);
export function isPortfolioMobile(){return (window as unknown as {TDSPRuntime?:{isMobileDevice:()=>boolean}}).TDSPRuntime?.isMobileDevice()===true;}
export function vaultUnlocked(stake?:string){return !!state&&!state.blocked&&state.expiresAt>Date.now()&&(!stake||state.stake===stake)&&(state.mode==='remote'||!isPortfolioMobile());}
export function storageMode(){return state?.mode??null;}
export function rememberStorage(stake:string,mode:StorageMode){try{localStorage.setItem('tdsp-portfolio-storage:'+stake,mode);}catch{/* The chooser still works without a saved preference. */}}
export function preferredStorage(stake:string):StorageMode{try{return localStorage.getItem('tdsp-portfolio-storage:'+stake)==='remote'?'remote':'local';}catch{return 'local';}}
async function importLegacy(stake:string):Promise<Data>{
  const data:Data={version:1,settings:{},snapshot:null};
  for(let i=0;i<localStorage.length;i++){const name=localStorage.key(i)!;if(ownSetting(stake,name))data.settings[name]=localStorage.getItem(name)!;}
  data.snapshot=await legacySnapshot(stake,data.settings);return data;
}
export async function openLocalPortfolio(stake:string){
  if(isPortfolioMobile())throw new Error('Local Portfolio storage is desktop-only. Choose encrypted remote cache on mobile.');
  lockVault();const attempt=unlockGeneration;
  const stored=await loadLocal(stake);const data=stored?.data as Data||await importLegacy(stake);
  if(attempt!==unlockGeneration)throw new Error('Portfolio opening cancelled.');
  state={stake,mode:'local',key:null,data,revision:stored?.revision??null,expiresAt:Date.now()+604800000,dirty:true,generation:0,blocked:false,controller:new AbortController()};
  lastActivity=Date.now();await flushVault();rememberStorage(stake,'local');
}
export async function unlockPortfolio(wallet:{signData:(payload:string,address:string)=>Promise<{signature:string;key:string}>},{role='delegator'}:{role?:'delegator'|'admin'}={}){
  lockVault();setSessionRole(role);
  const attempt=unlockGeneration;
  const check=()=>{if(attempt!==unlockGeneration)throw new Error('Portfolio unlock cancelled. Sign in again.');};
  const session=await portfolioFetch('/session');if(!session.ok)throw new Error('Sign in to the members area first.');
  const {stake_address:stake}=await session.json();
  check();
  const payload=Array.from(new TextEncoder().encode(unlockMessage(stake)),b=>b.toString(16).padStart(2,'0')).join('');
  const signed=await wallet.signData(payload,stake);
  check();
  const key=await deriveVaultKey(stake,signed);
  const response=await portfolioFetch('/vault');
  if(!response.ok)throw new Error(response.status===404?'The backend needs the encrypted Portfolio cache update.':'Encrypted Portfolio cache could not be loaded.');
  const stored=await response.json();
  if(stored.checkpoint_version!==2)throw new Error('Update the backend before using incremental encrypted Portfolio storage.');
  let data:Data={version:1,settings:{},snapshot:null};
  let index:CheckpointIndex|undefined;
  if(stored.payload){
    let decoded;
    try{decoded=await openVault(key,stake,stored.payload);}catch{throw new Error('This wallet approval could not unlock the saved Portfolio. Use the same wallet app and stake account. The cache has not been changed.');}
    if(decoded.version===2){index=decoded;data=await restoreCheckpoint(decoded,key,stake,async ids=>{check();const result=await portfolioFetch('/vault',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'chunks',ids})});if(!result.ok)throw new Error('Encrypted checkpoint could not be loaded. Reopen Portfolio to retry.');return (await result.json()).chunks;});}
    else data=decoded;
    if(data.version!==1||!data.settings||typeof data.settings!=='object')throw new Error('Unsupported Portfolio cache version.');
  }
  // Import only this member's legacy settings; remove them after an encrypted save succeeds.
  if(!stored.payload)data=await importLegacy(stake);
  check();
  state={stake,mode:'remote',key,data,revision:stored.revision,expiresAt:stored.expires_at,dirty:!stored.payload,generation:0,blocked:false,controller:new AbortController(),index,saved:Object.keys(data.snapshot?.data.facts||{}).length};
  setUploadProgress({phase:'saved',saved:state.saved!,transactions:data.snapshot?.data.txs.length||0});
  lastActivity=Date.now();
  if(!stored.payload)await flushVault();
  rememberStorage(stake,'remote');
}
export async function switchStorage(mode:StorageMode,stake:string,wallet:SigningWallet|null,role:'delegator'|'admin',copyCurrent:boolean){
  await flushVault();const previous=state,attempt=unlockGeneration;const data=copyCurrent&&previous?structuredClone(previous.data):null;
  try{
    if(mode==='local')await openLocalPortfolio(stake);
    else {if(!wallet)throw new Error('Reconnect your wallet in the members area to enable encrypted remote storage.');await unlockPortfolio(wallet,{role});}
    if(data){const current=active();if(current.stake!==stake)throw new Error('Wrong Portfolio member.');current.data=data;changed();await flushVault();}
  }catch(error){if(previous&&unlockGeneration<=attempt+1){state={...previous,controller:new AbortController()};rememberStorage(previous.stake,previous.mode);}throw error;}
}
export async function deleteStoredCache(mode:StorageMode,stake:string){
  const wasActive=state?.stake===stake&&state?.mode===mode;
  if(wasActive){await running?.catch(()=>{});lockVault();}
  if(mode==='local'){
    await removeLocal(stake);
    await clearLegacy(stake);
  }else{
    const response=await portfolioFetch('/vault');if(!response.ok)throw new Error('Could not access the remote cache for deletion.');
    const stored=await response.json();
    const deleted=await portfolioFetch('/vault',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'delete',revision:stored.revision})});
    if(!deleted.ok)throw new Error('Remote cache was not deleted. It may have changed on another device; try again.');
  }
}
async function clearLegacy(stake:string){
  for(let i=localStorage.length-1;i>=0;i--){const name=localStorage.key(i)!;if(ownSetting(stake,name))localStorage.removeItem(name);}
  await new Promise<void>((resolve,reject)=>{const req=indexedDB.open('tdsp-member-portfolio',1);req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result;if(!db.objectStoreNames.contains('snapshots')){db.close();resolve();return;}const tx=db.transaction('snapshots','readwrite');const cursor=tx.objectStore('snapshots').openCursor();cursor.onsuccess=()=>{const row=cursor.result;if(row){if(String(row.key).startsWith(stake+'::'))row.delete();row.continue();}};tx.oncomplete=()=>{db.close();resolve();};tx.onerror=()=>{db.close();reject(tx.error);};};});
}
function active(){if(!vaultUnlocked())throw new Error('Approve Portfolio unlock with your wallet first.');return state!;}
function schedule(delay=30000){if(!timer)timer=setTimeout(()=>{timer=undefined;void flushVault().catch(()=>{});},delay);}
function changed(){const current=active();current.dirty=true;current.generation++;schedule();}
export const portfolioSettings={
  getItem(name:string){const current=active();return ownSetting(current.stake,name)?current.data.settings[name]??null:null;},
  setItem(name:string,value:string){const current=active();if(!ownSetting(current.stake,name))throw new Error('Wrong Portfolio member.');current.data.settings[name]=value;changed();}
};
export function cachedSnapshot(name:string){const current=active();return current.data.snapshot?.key===name?current.data.snapshot.data:null;}
export async function cacheSnapshot(name:string,data:Snapshot){const current=active();if(!name.startsWith(current.stake+'::'))throw new Error('Wrong Portfolio member.');current.data.snapshot={key:name,data};changed();if(current.mode==='remote'){setUploadProgress({transactions:data.txs.length});if(!running&&Object.keys(data.facts).length-(current.saved||0)>=500){clearTimeout(timer);timer=undefined;schedule(0);}}}
export async function flushVault():Promise<void>{
  if(running){await running;if(state?.dirty)return flushVault();return;}
  const current=state;if(!current?.dirty||current.blocked)return;
  clearTimeout(timer);timer=undefined;
  if(current.expiresAt<=Date.now()){lockVault();notice('Portfolio cache expired. Sign in and unlock again.');return;}
  running=(async()=>{
    const generation=current.generation;
    if(current.mode==='local'){
      const saved=await saveLocal(current.stake,current.data,current.revision,current.expiresAt);
      if(current!==state)return;
      current.revision=saved.revision;current.dirty=current.generation!==generation;
      await clearLegacy(current.stake);notice('Portfolio cache saved in this browser.');return;
    }
    setUploadProgress({phase:'preparing',loaded:0,total:0,message:''});
    if(!current.pending)current.pending={checkpoint:await prepareCheckpoint(current.data,current.key!,current.stake,current.index||null,current.controller.signal),generation};
    if(current!==state)return;
    const {checkpoint,generation:capturedGeneration}=current.pending;
    const {index,saved,total,...upload}=checkpoint;
    setUploadProgress({phase:'uploading'});
    const response=await portfolioUpload(JSON.stringify({action:'checkpoint',revision:current.revision,...upload}),current.controller.signal,(loaded,total)=>{if(current===state)setUploadProgress({phase:loaded>=total?'confirming':'uploading',loaded,total});});
    if(!response.ok){if(response.status===409||response.status===410)current.blocked=true;throw new Error(response.status===409?'Portfolio changed on another device. Sign in and unlock again before saving.':response.status===410?'Portfolio cache expired. Sign in and unlock again.':'Encrypted Portfolio cache could not be saved. Keep this page open and retry.');}
    const result=await response.json();if(current!==state)return;
    current.revision=result.revision;current.expiresAt=Math.max(current.expiresAt,result.expires_at);current.dirty=current.generation!==capturedGeneration;
    current.index=index;current.saved=saved;current.pending=undefined;
    setUploadProgress({phase:'saved',saved,transactions:current.data.snapshot?.data.txs.length||total,message:''});
    await clearLegacy(current.stake);
    notice('Encrypted Portfolio cache saved.');
  })().catch(error=>{if(!current.controller.signal.aborted){notice(error.message);if(current.mode==='remote')setUploadProgress({phase:'error',message:error.message});}throw error;}).finally(()=>{running=null;if(current===state&&current.dirty&&!current.blocked)schedule();});
  return running;
}
