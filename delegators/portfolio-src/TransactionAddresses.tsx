import {useState} from 'react';
import {AddressLink} from './AddressLink';
import type {AddressNetwork} from './CryptoAddressForm';
import {uniqueTransactionAddresses,type TransactionAddress} from './transaction-addresses';
import {usePortfolioText} from './use-portfolio-text';

export function TransactionAddresses({network,from,to}:{network:AddressNetwork;from:TransactionAddress[];to:TransactionAddress[]}){
  const t=usePortfolioText(),[error,setError]=useState('');
  const rows=(values:TransactionAddress[],direction:'From'|'To')=>uniqueTransactionAddresses(values).map(row=><div key={`${direction}:${row.address}`} translate="no">
    {t(direction)}: <AddressLink network={network} address={row.address} name={row.name} onError={setError}/>
    {row.out&&<span className="small muted"> · {t('OUT address')}</span>}
  </div>);
  return <>{rows(from,'From')}{rows(to,'To')}{error&&<div translate="no" role="alert" className="small negative">{t(error)}</div>}</>;
}
