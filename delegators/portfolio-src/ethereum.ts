export type EthereumWallet={address:string;name:string;miner?:boolean;group?:'swap'};
export type EthereumTransaction={id:string;hash:string;kind:'normal'|'internal';block:number;time:number;from:string;to:string;valueWei:string;feeWei:string|null;failed:boolean};
export type EthereumAccount={balanceWei:string;block:number;transactions:EthereumTransaction[]};
export type EthereumData={accounts:Record<string,EthereumAccount>;history:Record<string,number>;usd:number|null;updated:string|null};
export const emptyEthereum=():EthereumData=>({accounts:{},history:{},usd:null,updated:null});
export const validEthereumAddress=(value:string)=>/^0x[0-9a-f]{40}$/i.test(value);
export function ethereumWallets(value:unknown):EthereumWallet[]{
  if(!Array.isArray(value))return [];
  const rows=new Map<string,EthereumWallet>();
  for(const item of value){
    if(typeof item?.address!=='string'||typeof item?.name!=='string')continue;
    const address=item.address.trim().toLowerCase(),name=item.name.trim().slice(0,60);
    if(validEthereumAddress(address)&&name)rows.set(address,{address,name,...(item.miner===true?{miner:true}:{}),...(item.group==='swap'?{group:'swap' as const}:{})});
    if(rows.size>=20)break;
  }
  return [...rows.values()];
}
export function validEthereumTransaction(row:unknown):row is EthereumTransaction{
  const r=row as EthereumTransaction;
  return !!r&&typeof r.id==='string'&&/^0x[0-9a-f]{64}:(?:normal|\d+(?:_\d+)*)$/.test(r.id)&&r.id.split(':')[0]===r.hash&&
    ['normal','internal'].includes(r.kind)&&(r.id.endsWith(':normal')===(r.kind==='normal'))&&validEthereumAddress(r.from)&&(r.to===''||validEthereumAddress(r.to))&&
    typeof r.valueWei==='string'&&/^\d{1,80}$/.test(r.valueWei)&&(r.feeWei===null||typeof r.feeWei==='string'&&/^\d{1,80}$/.test(r.feeWei))&&
    (r.kind==='normal'?r.feeWei!==null:r.feeWei===null)&&typeof r.failed==='boolean'&&Number.isSafeInteger(r.block)&&r.block>=0&&Number.isSafeInteger(r.time)&&r.time>0&&r.time<8640000000000;
}
export function ethereumData(value:unknown):EthereumData{
  const data=value as EthereumData;
  if(!data||typeof data.accounts!=='object'||!data.accounts)return emptyEthereum();
  const next=emptyEthereum();
  for(const [address,row] of Object.entries(data.accounts).slice(0,20)){
    if(!validEthereumAddress(address)||!row||!/^\d{1,80}$/.test(row.balanceWei)||!Number.isSafeInteger(row.block)||row.block<0||
      !Array.isArray(row.transactions)||row.transactions.length>100000||!row.transactions.every(validEthereumTransaction))continue;
    next.accounts[address]={...row,transactions:[...new Map(row.transactions.map(tx=>[tx.id,tx])).values()]};
  }
  for(const [date,price] of Object.entries(data.history||{}))if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(price)&&price>0)next.history[date]=price;
  next.usd=typeof data.usd==='number'&&Number.isFinite(data.usd)&&data.usd>0?data.usd:null;
  next.updated=typeof data.updated==='string'?data.updated:null;
  return next;
}
export function weiToEth(value:string):number{return Number(BigInt(value))/1e18;}
export function ethereumTransactions(data:EthereumData,wallets:EthereumWallet[]){
  return [...new Map(wallets.flatMap(wallet=>data.accounts[wallet.address]?.transactions||[]).map(tx=>[tx.id,tx])).values()].sort((a,b)=>b.time-a.time||a.id.localeCompare(b.id));
}
export function ethereumTransactionCount(data:EthereumData,wallets:EthereumWallet[]){
  return new Set(wallets.flatMap(wallet=>data.accounts[wallet.address]?.transactions.map(tx=>tx.hash)||[])).size;
}
export function ethereumTransfer(tx:EthereumTransaction,wallets:EthereumWallet[],exchanges:EthereumWallet[]){
  if(tx.failed||BigInt(tx.valueWei)===0n)return null;
  const owned=new Set(wallets.map(w=>w.address));
  if(owned.has(tx.from)&&owned.has(tx.to))return null;
  if(wallets.some(w=>w.address===tx.to&&w.miner)&&!exchanges.some(e=>e.address===tx.from))return {side:'sell' as const,amount:weiToEth(tx.valueWei),mined:true};
  const side=owned.has(tx.to)&&exchanges.some(e=>e.address===tx.from)?'buy':owned.has(tx.from)&&exchanges.some(e=>e.address===tx.to)?'sell':null;
  return side?{side,amount:weiToEth(tx.valueWei)}:null;
}
export function ethereumTransfers(data:EthereumData,wallets:EthereumWallet[],exchanges:EthereumWallet[]){
  return ethereumTransactions(data,wallets).flatMap(tx=>{
    const transfer=ethereumTransfer(tx,wallets,exchanges);
    if(!transfer)return [];
    const price=data.history[new Date(tx.time*1000).toISOString().slice(0,10)];
    const usd=transfer.amount*price;
    return [{hash:tx.id,time:tx.time,side:transfer.side,amount:transfer.amount,usd:Number.isFinite(price)&&price>0&&Number.isFinite(usd)?usd:null}];
  });
}
export function ethereumValue(data:EthereumData,wallets:EthereumWallet[]):number|null{
  if(!wallets.length)return 0;
  if(data.usd===null||wallets.some(w=>!data.accounts[w.address]))return null;
  const value=wallets.reduce((sum,w)=>sum+weiToEth(data.accounts[w.address].balanceWei)*data.usd!,0);
  return Number.isFinite(value)?value:null;
}
export function addKnownValues(a:number|null,b:number|null):number|null{return a===null||b===null||!Number.isFinite(a+b)?null:a+b;}
export type FiatTransfer={hash:string;time:number;side:'buy'|'sell';usd:number|null};
export function ethereumFees(data:EthereumData,wallets:EthereumWallet[]):number|null{
  if(wallets.some(w=>!data.accounts[w.address]))return null;
  const owned=new Set(wallets.map(w=>w.address));
  return weiToEth(String(ethereumTransactions(data,wallets).reduce((sum,tx)=>sum+(tx.kind==='normal'&&owned.has(tx.from)&&tx.feeWei!==null?BigInt(tx.feeWei):0n),0n)));
}
