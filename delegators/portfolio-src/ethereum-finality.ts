import type {EthereumAccount} from './ethereum';

export function ethereumScanStart(previous:EthereumAccount|undefined,block:number,finalizedBlock:number|null|undefined){
  if(!Number.isSafeInteger(block)||block<0||
    finalizedBlock!=null&&(!Number.isSafeInteger(finalizedBlock)||finalizedBlock<0||finalizedBlock>block)||
    previous?.finalizedBlock!==undefined&&previous.finalizedBlock>(finalizedBlock??block))throw new Error('Ethereum finalized block unavailable. Saved data is retained.');
  if(!previous)return 0;
  if(previous.finalizedBlock!==undefined)return previous.finalizedBlock+1;
  // Old caches did not record finality; validate their former overlap once.
  return Math.min(Math.max(0,Math.min(previous.block,block)-64),(finalizedBlock??block)+1);
}
