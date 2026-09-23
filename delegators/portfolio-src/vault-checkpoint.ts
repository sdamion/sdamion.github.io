import {openVault,sealVault} from './vault-crypto.ts';
import type {VaultEnvelope} from './vault-crypto.ts';
import type {Snapshot} from './cache';

export type VaultData={version:1;settings:Record<string,string>;snapshot:{key:string;data:Snapshot}|null};
type Reference={id:string;digest:string};
export type CheckpointIndex={version:2;meta:Omit<VaultData,'snapshot'>&{snapshot:{key:string;data:Omit<Snapshot,'txs'|'facts'>}|null};buckets:Record<string,Reference>};
export type Checkpoint={payload:VaultEnvelope;chunks:{id:string;payload:VaultEnvelope}[];chunk_ids:string[];commit_id:string;index:CheckpointIndex;saved:number;total:number};
const encoder=new TextEncoder();
const randomId=()=>crypto.randomUUID().replaceAll('-','');
async function digest(value:unknown){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoder.encode(JSON.stringify(value)))),byte=>byte.toString(16).padStart(2,'0')).join('');}
export async function prepareCheckpoint(data:VaultData,key:CryptoKey,stake:string,previous:CheckpointIndex|null,signal?:AbortSignal):Promise<Checkpoint>{
  // Snapshot once: analysis may continue mutating its next batch while hashing/encrypting.
  const captured=structuredClone(data);
  const groups=new Map<string,{txs:Snapshot['txs'];facts:Snapshot['facts']}>();
  const snapshot=captured.snapshot;
  // Stable time buckets keep a newly analysed batch from rewriting the entire history.
  const buckets=new Map((snapshot?.data.txs||[]).map(tx=>[tx.tx_hash,Number.isFinite(tx.block_time)?String(Math.floor(tx.block_time/(30*86400))):'other']));
  const group=(hash:string)=>{const bucket=buckets.get(hash)||'other';if(!groups.has(bucket))groups.set(bucket,{txs:[],facts:{}});return groups.get(bucket)!;};
  for(const tx of snapshot?.data.txs||[])group(tx.tx_hash).txs.push(tx);
  for(const [hash,fact] of Object.entries(snapshot?.data.facts||{}).sort(([a],[b])=>a.localeCompare(b)))group(hash).facts[hash]=fact;
  const {txs,facts,...header}=snapshot?.data||{} as Snapshot;
  const index:CheckpointIndex={version:2,meta:{version:1,settings:captured.settings,snapshot:snapshot?{key:snapshot.key,data:header}:null},buckets:{}};
  const chunks:Checkpoint['chunks']=[];
  for(const [bucket,content] of groups){
    signal?.throwIfAborted();content.txs.sort((a,b)=>a.tx_hash.localeCompare(b.tx_hash));
    const fingerprint=await digest(content),old=previous?.buckets[bucket];
    if(old?.digest===fingerprint){index.buckets[bucket]=old;continue;}
    const id=randomId();index.buckets[bucket]={id,digest:fingerprint};
    chunks.push({id,payload:await sealVault(key,stake,content)});
  }
  signal?.throwIfAborted();
  return {payload:await sealVault(key,stake,index),chunks,chunk_ids:Object.values(index.buckets).map(row=>row.id),commit_id:randomId(),index,saved:Object.keys(snapshot?.data.facts||{}).length,total:snapshot?.data.txs.length||0};
}
export async function restoreCheckpoint(index:CheckpointIndex,key:CryptoKey,stake:string,load:(ids:string[])=>Promise<{id:string;payload:VaultEnvelope}[]>):Promise<VaultData>{
  if(index.version!==2||index.meta?.version!==1||!index.meta.settings||!index.buckets||Object.keys(index.buckets).length>257)throw new Error('Invalid Portfolio checkpoint index.');
  const refs=Object.values(index.buckets);
  if(refs.some(row=>!row||!/^[a-f0-9]{32}$/.test(row.id)||!/^[a-f0-9]{64}$/.test(row.digest)))throw new Error('Invalid Portfolio checkpoint reference.');
  const txs:Snapshot['txs']=[],facts:Snapshot['facts']={};
  let decodedBytes=0;
  for(let offset=0;offset<refs.length;offset+=16){
    const batch=refs.slice(offset,offset+16),rows=await load(batch.map(row=>row.id));
    for(const ref of batch){
      const row=rows.find(row=>row.id===ref.id);if(!row)throw new Error('Portfolio checkpoint is incomplete. Reopen it to retry.');
      const content=await openVault(key,stake,row.payload);
      decodedBytes+=encoder.encode(JSON.stringify(content)).length;
      if(decodedBytes>100*1024*1024)throw new Error('Portfolio checkpoint exceeds the decoded size limit.');
      if(await digest(content)!==ref.digest||!Array.isArray(content.txs)||!content.facts)throw new Error('Portfolio checkpoint integrity check failed.');
      txs.push(...content.txs);Object.assign(facts,content.facts);
    }
  }
  txs.sort((a,b)=>b.block_time-a.block_time||a.tx_hash.localeCompare(b.tx_hash));
  return {version:1,settings:index.meta.settings,snapshot:index.meta.snapshot?{key:index.meta.snapshot.key,data:{...index.meta.snapshot.data,txs,facts}}:null};
}
