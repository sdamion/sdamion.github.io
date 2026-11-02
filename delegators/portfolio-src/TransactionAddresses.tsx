import {useState} from 'react';
import {AddressLink} from './AddressLink';
import type {AddressNetwork} from './CryptoAddressForm';
import {uniqueTransactionAddresses,type TransactionAddress} from './transaction-addresses';
import {usePortfolioText} from './use-portfolio-text';

export function TransactionAddresses({network,from,to}:{network:AddressNetwork;from:TransactionAddress[];to:TransactionAddress[]}){
  const t=usePortfolioText(),[error,setError]=useState('');
  const link=(row:TransactionAddress)=><><AddressLink network={network} address={row.address} name={row.name} onError={setError}/>{row.out&&<span className="small muted"> · {t('OUT address')}</span>}</>;
  const rows=(values:TransactionAddress[],direction:'From'|'To')=>{
    const addresses=uniqueTransactionAddresses(values);
    if(!addresses.length)return null;
    if(addresses.length===1)return <div translate="no">{t(direction)}: {link(addresses[0])}</div>;
    const name=addresses.every(row=>row.name&&row.name===addresses[0].name)?addresses[0].name:null;
    return <details className="portfolio-transaction-addresses" translate="no"><summary>{t(direction)}: {name&&<>{name} · </>}{t('{count} addresses',{count:addresses.length})}</summary>{addresses.map(row=><div key={row.address}>{link(row)}</div>)}</details>;
  };
  return <>{rows(from,'From')}{rows(to,'To')}{error&&<div translate="no" role="alert" className="small negative">{t(error)}</div>}</>;
}
