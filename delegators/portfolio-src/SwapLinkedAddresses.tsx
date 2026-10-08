import {short} from './core';
import {usePortfolioText} from './use-portfolio-text';

export function SwapLinkedAddresses({addresses=[],ethereum=false}:{addresses?:string[];ethereum?:boolean}){
  const t=usePortfolioText();
  if(!addresses.length)return null;
  return <details className="small muted"><summary>{t('Linked addresses')} ({addresses.length})</summary>{addresses.map(address=><div key={address} translate="no"><a title={address} href={`${ethereum?'https://etherscan.io/address/':'https://cardanoscan.io/address/'}${address}`} target="_blank" rel="noreferrer">{short(address)}</a></div>)}</details>;
}
