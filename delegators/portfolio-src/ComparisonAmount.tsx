import type {ComparisonCrypto,ComparisonCurrency} from './transfer-comparison';
import {formatAdaNumber} from './portfolio-currency';

export function ComparisonAmount({amount,value,crypto,currency,tone}:{amount:number|null;value:number|null;crypto:ComparisonCrypto;currency:ComparisonCurrency;tone?:'positive'|'negative'|''}){
  const locale=(window as unknown as {TDSPI18n?:{getLanguage:()=>string}}).TDSPI18n?.getLanguage()||'en';
  const number=amount===null?'—':crypto==='ADA'?formatAdaNumber(Math.abs(amount),locale):Math.abs(amount).toLocaleString(locale,{maximumFractionDigits:8});
  const fiat=value===null?'—':currency==='ADA'?'₳ '+formatAdaNumber(Math.abs(value),locale):new Intl.NumberFormat(locale,{style:'currency',currency,maximumFractionDigits:currency==='JPY'?0:2}).format(Math.abs(value));
  return <strong translate="no" className={`portfolio-transfer-amount ${tone??(amount!==null&&amount<0?'negative':'positive')}`}><span className="pool-delegator-amount">
    <span className="portfolio-comparison-crypto"><img src={crypto==='ADA'?'/cardano_logo_ico.webp':'/bitcoin-logo.png'} alt={crypto==='ADA'?'Cardano':'Bitcoin'} width="16" height="16"/>{tone===undefined&&amount!==null&&amount<0?'-':''}{number}</span>
    {!(crypto==='ADA'&&currency==='ADA')&&<span className={`pool-delegator-usd ${tone===undefined&&value!==null&&value<0?'negative':''}`}>≈ {tone===undefined&&value!==null&&value<0?'-':''}{fiat}</span>}
  </span></strong>;
}
