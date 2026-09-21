export type Wallet = { address:string; label:string };
export type Asset = { policy_id:string; asset_name:string; quantity:string; decimals?:number };
export type Utxo = { tx_hash:string; tx_index:number; value:string; asset_list?:Asset[] };
export type AddressInfo = { address:string; balance:string; utxo_set?:Utxo[] };
export type Tx = { tx_hash:string; block_time:number; block_height:number };
export type Io = { value:string; payment_addr?:{bech32?:string}; asset_list?:Asset[] };
export type Detail = { tx_hash:string; tx_timestamp:number; fee:string; inputs:Io[]; outputs:Io[] };
export type Fact = { hash:string; time:number; adaRaw:string; assets:Record<string,string>; decimals:Record<string,number>; feeRaw:string|null; internal:boolean; wallets:string[]; swapCandidate:boolean };
export type Market = { token_id:string; ticker?:string|null; decimals?:number|null; price_by_ada?:number|null; price_by_usd?:number|null; is_verified?:boolean|null };
export type Holding = { id:string; raw:string };
export type Trade = { side:'buy'|'sell'; id:string; raw:string; ada:number; costAda:number };
export const assetId=(a:Asset)=>a.policy_id+a.asset_name;
export const short=(s:string)=>s.length>24?s.slice(0,12)+'…'+s.slice(-8):s;
export function assetName(id:string){if(id==='lovelace')return 'ADA';try{return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(id.slice(56).match(/../g)||[],x=>parseInt(x,16)))||short(id);}catch{return short(id);}}
export function validAddress(s:string){
  if(!/^addr1[023456789acdefghjklmnpqrstuvwxyz]+$/.test(s))return false;
  const alphabet='qpzry9x8gf2tvdw0s3jn54khce6mua7l',hrp='addr';
  const values=[...hrp].map(c=>c.charCodeAt(0)>>5).concat([0],[...hrp].map(c=>c.charCodeAt(0)&31),[...s.slice(5)].map(c=>alphabet.indexOf(c)));
  let chk=1;const gen=[0x3b6a57b2,0x26508e6d,0x1ea119fa,0x3d4233dd,0x2a1462b3];
  for(const v of values){const top=chk>>>25;chk=((chk&0x1ffffff)<<5)^v;for(let i=0;i<5;i++)if((top>>>i)&1)chk^=gen[i];}
  // Cardano payment addresses encode 29 or 57 bytes; validate mainnet discriminator too.
  const data=[...s.slice(5,-6)].map(c=>alphabet.indexOf(c));const bytes=Math.floor(data.length*5/8);
  return chk===1&&(bytes===29||bytes===57)&&(((data[0]<<3)|(data[1]>>2))&15)===1;
}
export function combineHoldings(infos:AddressInfo[]):Holding[]{
  const totals=new Map<string,bigint>();const seen=new Set<string>();
  for(const info of infos){if(!Array.isArray(info.utxo_set))throw new Error('The indexer did not return complete unspent outputs.');for(const u of info.utxo_set){const key=u.tx_hash+':'+u.tx_index;if(seen.has(key))continue;seen.add(key);totals.set('lovelace',(totals.get('lovelace')||0n)+BigInt(u.value));for(const a of u.asset_list||[])totals.set(assetId(a),(totals.get(assetId(a))||0n)+BigInt(a.quantity));}}
  return [...totals].filter(([,n])=>n>0n).map(([id,raw])=>({id,raw:String(raw)}));
}
export function analyse(detail:Detail, addresses:Set<string>):Fact {
  let ada=0n;const amounts=new Map<string,bigint>();const touched=new Set<string>();const decimals:Record<string,number>={};
  for(const [sign,rows] of [[-1n,detail.inputs],[1n,detail.outputs]] as const)for(const row of rows){const a=row.payment_addr?.bech32;if(!a||!addresses.has(a))continue;touched.add(a);ada+=sign*BigInt(row.value);for(const asset of row.asset_list||[]){const id=assetId(asset);amounts.set(id,(amounts.get(id)||0n)+sign*BigInt(asset.quantity));}}
  const allInputs=detail.inputs.length>0&&detail.inputs.every(x=>addresses.has(x.payment_addr?.bech32||''));
  const allOutputs=detail.outputs.length>0&&detail.outputs.every(x=>addresses.has(x.payment_addr?.bech32||''));
  const fee=BigInt(detail.fee||'0');const assets=Object.fromEntries([...amounts].filter(([,v])=>v!==0n).map(([k,v])=>[k,String(v)]));
  for(const row of [...detail.inputs,...detail.outputs])for(const a of row.asset_list||[])if(a.decimals!=null)decimals[assetId(a)]=a.decimals;
  return {hash:detail.tx_hash,time:detail.tx_timestamp,adaRaw:String(ada),assets,decimals,feeRaw:allInputs?String(fee):null,internal:allInputs&&allOutputs&&Object.keys(assets).length===0&&ada===-fee,wallets:[...touched],swapCandidate:detail.inputs.some(x=>!addresses.has(x.payment_addr?.bech32||''))||detail.outputs.some(x=>!addresses.has(x.payment_addr?.bech32||''))};
}
export function tradeOf(f:Fact):Trade|null{
  if(f.internal||!f.swapCandidate)return null;const changed=Object.entries(f.assets);if(changed.length!==1)return null;
  const [id,raw]=changed[0];const n=BigInt(raw);const ada=Number(f.adaRaw)/1e6;const fee=Number(f.feeRaw||0)/1e6;const exchangeAda=ada+fee;
  if(n===0n||exchangeAda===0||(n>0n)===(exchangeAda>0))return null;
  return {side:n>0n?'buy':'sell',id,raw:String(n<0n?-n:n),ada:Math.abs(exchangeAda),costAda:Math.abs(ada)};
}
export function kindOf(f:Fact){if(f.internal)return 'internal';if(tradeOf(f))return 'trade';const adjusted=BigInt(f.adaRaw)+BigInt(f.feeRaw||0);const vals=[adjusted,...Object.values(f.assets).map(BigInt)];const plus=vals.some(x=>x>0n),minus=vals.some(x=>x<0n);return plus&&minus?'mixed':plus?'receive':minus?'send':'other';}
export function units(raw:string, decimals:number|null|undefined){return decimals==null?null:Number(raw)/10**decimals;}
export function currentPrice(id:string, markets:Record<string,Market>, adaUsd:number|null):number|null{if(id==='lovelace')return adaUsd;const m=markets[id];if(!m)return null;if(m.price_by_usd!=null&&m.price_by_usd>0)return m.price_by_usd;if(m.price_by_ada!=null&&m.price_by_ada>0&&adaUsd!=null)return m.price_by_ada*adaUsd;return null;}
// User-defined receipt valuation, not exchange execution cost or tax basis.
// Combine owned inputs/outputs first so change and self transfers cannot be buys.
// Outgoing ADA and fees remove proportional cost, preserving the remaining average.
export function adaReceiptBasis(facts:Fact[], history:Record<string,number>){
  let raw=0n,usd:number|null=0,valid=true,missingPrices=0;
  const seen=new Set<string>();
  // Receipts first within a block-time bucket avoid false deficits when an output
  // is spent again in that block; exact intrablock ordering is not claimed.
  const ordered=[...facts].sort((a,b)=>a.time-b.time||(Number(BigInt(b.adaRaw)>0n)-Number(BigInt(a.adaRaw)>0n))||a.hash.localeCompare(b.hash));
  for(const f of ordered){
    if(seen.has(f.hash))continue;seen.add(f.hash);
    const delta=BigInt(f.adaRaw),fee=BigInt(f.feeRaw||'0');
    const received=f.internal?0n:delta+fee>0n?delta+fee:0n;
    if(received>0n){
      const price=history[new Date(f.time*1000).toISOString().slice(0,10)];
      if(!Number.isFinite(price)||price<=0){usd=null;missingPrices++;}
      else if(usd!==null)usd+=Number(received)/1e6*price;
      raw+=received;
    }
    const spent=received-delta;
    if(spent>raw){valid=false;usd=null;}
    else if(spent>0n&&usd!==null&&raw>0n)usd*=Number(raw-spent)/Number(raw);
    raw-=spent;
    if(raw===0n)usd=0;
  }
  return {raw:String(raw),usd:valid?usd:null,valid,missingPrices};
}
// While history is incomplete, project the average of priced, loaded receipts
// onto the current balance. This is explicitly NOT the reconciled remaining cost.
export function liveAdaBasis(facts:Fact[],history:Record<string,number>,currentRaw:string,complete:boolean){
  let receiptRaw=0n,pricedRaw=0n,receiptUsd=0,receiptCount=0;
  const seen=new Set<string>();
  for(const f of facts){
    if(seen.has(f.hash)||f.internal)continue;seen.add(f.hash);
    const received=BigInt(f.adaRaw)+BigInt(f.feeRaw||0);
    if(received<=0n)continue;
    receiptRaw+=received;
    const price=history[new Date(f.time*1000).toISOString().slice(0,10)];
    if(!Number.isFinite(price)||price<=0)continue;
    pricedRaw+=received;receiptUsd+=Number(received)/1e6*price;receiptCount++;
  }
  const exact=complete?adaReceiptBasis(facts,history):null;
  const average=pricedRaw>0n?receiptUsd/(Number(pricedRaw)/1e6):null;
  const usd=complete?(exact?.raw===currentRaw?exact.usd:null):average===null?null:average*Number(currentRaw)/1e6;
  return {raw:currentRaw,usd,provisional:!complete,receiptCount,pricedReceiptAda:Number(pricedRaw)/1e6,missingReceiptAda:Number(receiptRaw-pricedRaw)/1e6,reconciled:complete&&exact?.valid===true&&exact.raw===currentRaw};
}
// Tokens use FIFO across the portfolio; ADA uses the receipt-price method above.
// Incoming token transfers retain unknown acquisition cost, unlike ADA receipts.
export function remainingBasis(facts:Fact[], history:Record<string,number>):Record<string,{raw:string;usd:number|null}>{
  const lots=new Map<string,{raw:bigint;usd:number|null}[]>();
  for(const f of [...facts].sort((a,b)=>a.time-b.time||a.hash.localeCompare(b.hash))){if(f.internal)continue;const trade=tradeOf(f);for(const [id,v] of Object.entries(f.assets)){const amount=BigInt(v);const rows=lots.get(id)||[];if(amount>0n){const price=history[new Date(f.time*1000).toISOString().slice(0,10)];rows.push({raw:amount,usd:trade?.side==='buy'&&price>0?trade.costAda*price:null});}else{let consume=-amount;while(consume>0n&&rows.length){const first=rows[0],take=consume<first.raw?consume:first.raw;if(first.usd!==null)first.usd*=Number(first.raw-take)/Number(first.raw);first.raw-=take;consume-=take;if(first.raw===0n)rows.shift();}}lots.set(id,rows);}}
  return {...Object.fromEntries([...lots].map(([id,rows])=>[id,{raw:String(rows.reduce((s,r)=>s+r.raw,0n)),usd:rows.some(r=>r.usd===null)?null:rows.reduce((s,r)=>s+(r.usd||0),0)}])),lovelace:adaReceiptBasis(facts,history)};
}
