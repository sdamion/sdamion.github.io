import {short} from './core';
import {addressExplorer} from './AddressLink';
import type {AddressNetwork} from './CryptoAddressForm';
import {uniqueTransactionAddresses,type TransactionAddress} from './transaction-addresses';
import {usePortfolioText} from './use-portfolio-text';

export function TransactionAddresses({network,from,to}:{network:AddressNetwork;from:TransactionAddress[];to:TransactionAddress[]}){
  const t=usePortfolioText();
  const rows=(values:TransactionAddress[],direction:'From'|'To')=>uniqueTransactionAddresses(values).map(row=><div key={`${direction}:${row.address}`} translate="no">
    {t(direction)}: {row.name&&<span>{row.name} · </span>}<a className="address" href={addressExplorer(network,row.address)} target="_blank" rel="noreferrer" title={row.address}>{short(row.address)}</a>
    {row.out&&<span className="small muted"> · {t('OUT address')}</span>}
  </div>);
  return <>{rows(from,'From')}{rows(to,'To')}</>;
}
