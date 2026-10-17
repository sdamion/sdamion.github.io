import React from 'react';
import {usePortfolioText} from './use-portfolio-text';
import {uniqueTileMessages,type TileMessage} from './tile-messages';

export function WalletSyncStatus({cardano,ethereum,solana,messages=[]}:{cardano:string;ethereum?:string;solana?:string;messages?:TileMessage[]}){
  const t=usePortfolioText();
  const unique=uniqueTileMessages([...([cardano,ethereum,solana].filter(Boolean) as string[]).map(text=>({text})),...messages].map(message=>({...message,text:t(message.text)})));
  return <>{unique.map(message=><p key={message.text} translate="no" role={message.error?'alert':'status'} className={`small-text${message.error?' error-text':''}`}>{message.text}</p>)}</>;
}
