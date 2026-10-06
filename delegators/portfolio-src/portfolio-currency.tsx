import {createContext,useContext} from 'react';
import {fiatRate,type ComparisonFiat,type FxHistory} from './transfer-comparison';

export type PortfolioCurrency='ADA'|ComparisonFiat;
export type CurrencyDisplay={currency:PortfolioCurrency;rate:number|null;adaUsd:number|null;locale:string;fxHistory?:FxHistory};
export const PortfolioCurrencyContext=createContext<CurrencyDisplay|null>(null);
export const usePortfolioCurrency=()=>useContext(PortfolioCurrencyContext);
export function formatAdaNumber(value:number,locale='en-US'):string{
  return (window as unknown as {TDSPRuntime:{formatAdaNumber:(value:number,locale:string)=>string}}).TDSPRuntime.formatAdaNumber(value,locale);
}

export function transactionCurrency(display:CurrencyDisplay|null,time:number,adaUsd?:number|null):CurrencyDisplay|null{
  if(!display)return null;
  return {...display,adaUsd:adaUsd===undefined?display.adaUsd:adaUsd,rate:display.currency==='ADA'?null:fiatRate(time,display.currency,display.fxHistory||{})};
}

export function formatPortfolioAmount(value:number|null,display:CurrencyDisplay,precision?:number):string{
  if(value===null)return '—';
  if(display.currency==='ADA')return '₳ '+formatAdaNumber(value,display.locale);
  return new Intl.NumberFormat(display.locale,{style:'currency',currency:display.currency,maximumFractionDigits:precision??(display.currency==='JPY'?0:Math.abs(value)>0&&Math.abs(value)<0.01?8:2)}).format(value);
}

export function formatPortfolioUsd(value:number|null,display:CurrencyDisplay,precision?:number):string{
  if(value===null)return '—';
  const rate=display.currency==='ADA'?display.adaUsd!==null&&display.adaUsd>0?1/display.adaUsd:null:display.rate;
  if(rate===null)return '—';
  return formatPortfolioAmount(value*rate,display,precision);
}
export function formatPortfolioAda(value:number|null,display:CurrencyDisplay,price=display.adaUsd):string{
  if(value===null)return '—';
  if(display.currency==='ADA')return '₳ '+formatAdaNumber(value,display.locale);
  return formatPortfolioUsd(price===null?null:value*price,display);
}
