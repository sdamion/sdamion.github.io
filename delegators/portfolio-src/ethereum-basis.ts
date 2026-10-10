import {ethereumTransfer,ownedEthereumWallets,weiToEth,type EthereumData,type EthereumWallet} from './ethereum.ts';
import {receiptBasis,type ReceiptEvent} from './receipt-basis.ts';
import {ethereumExecutionOrder} from './ethereum-order.ts';

export function ethereumReceiptBasis(data:EthereumData,wallets:EthereumWallet[],exchanges:EthereumWallet[]){
  wallets=ownedEthereumWallets(wallets);
  if(!wallets.length||wallets.some(w=>!data.accounts[w.address]))return {reconciled:false,usd:null,average:null};
  const transactions=ethereumExecutionOrder(data,wallets);
  if(!transactions)return {reconciled:false,usd:null,average:null};
  const owned=new Set(wallets.map(w=>w.address));
  const events:ReceiptEvent[]=transactions.map(tx=>{
    const from=owned.has(tx.from),to=owned.has(tx.to),amount=tx.failed?0n:BigInt(tx.valueWei);
    const receivedRaw=to&&!from?amount:0n;
    const spentRaw=(from&&!to?amount:0n)+(from&&tx.kind==='normal'?BigInt(tx.feeWei||'0'):0n);
    const receipt=ethereumTransfer(tx,wallets,exchanges),mined=receipt&&'mined' in receipt;
    const price=data.history[new Date(tx.time*1000).toISOString().slice(0,10)];
    const costUsd=mined?0:receipt?.side==='buy'&&Number.isFinite(price)&&price>0?weiToEth(String(receivedRaw))*price:null;
    return {receivedRaw,spentRaw,costUsd};
  });
  const balance=wallets.reduce((sum,w)=>sum+BigInt(data.accounts[w.address].balanceWei),0n);
  return receiptBasis(events,balance,18);
}
