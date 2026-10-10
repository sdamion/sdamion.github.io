import React from 'react';
import {usePortfolioText} from './use-portfolio-text';
import {downloadProgressValues,type DownloadProgress} from './download-progress';

export function DownloadStatus({chains,missingWallets=0,missingAssets=0,missingTransfers=0,missingCurrency=false}:{chains:{chain:string;progress:DownloadProgress}[];missingWallets?:number;missingAssets?:number;missingTransfers?:number;missingCurrency?:boolean}){
  const t=usePortfolioText();
  const line=(key:string,text:string)=><span key={key} translate="no" className="small muted" style={{display:'block'}} role="status">{text}</span>;
  return <>{chains.map(({chain,progress})=>line(chain,t('{chain}: {done} / {total} transactions',{chain,...downloadProgressValues(progress)})))}
    {chains.some(row=>row.progress.total===null)&&line('discovering',t('Total unknown until wallet history discovery finishes'))}
    {missingWallets>0&&line('wallets',t('Waiting for {count} wallet balances',{count:missingWallets}))}
    {missingAssets>0&&line('assets',t('Missing prices: {count} assets',{count:missingAssets}))}
    {missingTransfers>0&&line('transfers',t('Missing historical prices: {count} transfers',{count:missingTransfers}))}
    {missingCurrency&&line('currency',t('Selected currency rate unavailable'))}
  </>;
}
