import type {EthereumAccount} from './ethereum';

export function ethereumScanStart(previous:EthereumAccount|undefined,block:number,finalizedBlock:number){
  if(!Number.isSafeInteger(block)||block<0||!Number.isSafeInteger(finalizedBlock)||finalizedBlock<0||finalizedBlock>block||
    previous?.finalizedBlock!==undefined&&previous.finalizedBlock>finalizedBlock)throw new Error('Ethereum finalized block unavailable. Saved data is retained.');
  if(!previous)return 0;
  if(previous.finalizedBlock!==undefined)return previous.finalizedBlock+1;
  // Old caches did not record finality; validate their former overlap once.
  return Math.min(Math.max(0,Math.min(previous.block,block)-64),finalizedBlock+1);
}
