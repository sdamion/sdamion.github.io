import React from 'react';
import {usePortfolioText} from './use-portfolio-text';

export function WalletSyncStatus({cardano,ethereum,solana}:{cardano:string;ethereum?:string;solana?:string}){
  const t=usePortfolioText();
  return <>{[cardano,ethereum,solana].map((message,index)=>message&&<p key={index} translate="no" role="status" className="small muted">{t(message)}</p>)}</>;
}
