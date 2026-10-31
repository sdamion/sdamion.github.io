import {useState} from 'react';
import {Trash2} from 'lucide-react';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from './ui';
import {AddressNameField} from './AddressNameField';
import {NamedTableGroups} from './TableGroupToggle';
import {short} from './core';
import {bitcoinAmount,type BitcoinWallet,type BitcoinData} from './bitcoin';
import {formatPortfolioUsd,usePortfolioCurrency} from './portfolio-currency';
import {usePortfolioText} from './use-portfolio-text';

export function BitcoinWallets({wallets,data,exchanges=false,onChange}:{wallets:BitcoinWallet[];data:BitcoinData;exchanges?:boolean;onChange:(rows:BitcoinWallet[])=>boolean}){
  const [error,setError]=useState(''),t=usePortfolioText(),display=usePortfolioCurrency();
  return <section className="portfolio-section">
    <h3 translate="no">{t(exchanges?'Bitcoin CEX addresses':'Bitcoin Wallets')}</h3>
    {error&&<p translate="no" role="alert" className="negative">{t(error)}</p>}
    <Table><TableHeader><TableRow><TableHead>{t(exchanges?'Exchange':'Wallet')}</TableHead><TableHead>{t('Address')}</TableHead>{!exchanges&&<TableHead translate="no">BTC</TableHead>}<TableHead>{t('Remove')}</TableHead></TableRow></TableHeader><TableBody>
      <NamedTableGroups rows={wallets} nameOf={row=>row.name} columns={exchanges?3:4} renderRow={wallet=><TableRow key={wallet.address}>
        <TableCell translate="no"><AddressNameField name={wallet.name} label={exchanges?'Exchange name':'Wallet name'} onSave={name=>{if(!onChange(wallets.map(row=>row.address===wallet.address?{...row,name}:row)))return false;setError('');return true;}} onError={()=>setError('Could not save the selection.')}/></TableCell>
        <TableCell translate="no"><a className="address" title={wallet.address} href={`https://blockstream.info/address/${wallet.address}`} target="_blank" rel="noreferrer">{short(wallet.address)}</a></TableCell>
        {!exchanges&&<TableCell translate="no">{data.accounts[wallet.address]?bitcoinAmount(data.accounts[wallet.address].raw).toLocaleString(undefined,{maximumFractionDigits:8}):'—'}{display&&<div className="small muted">{formatPortfolioUsd(data.accounts[wallet.address]&&data.usd!==null?bitcoinAmount(data.accounts[wallet.address].raw)*data.usd:null,display)}</div>}</TableCell>}
        <TableCell><button type="button" className="governance-vote-secondary" title={t('Remove')} aria-label={t('Remove')} onClick={()=>onChange(wallets.filter(row=>row.address!==wallet.address))}><Trash2 size={14}/></button></TableCell>
      </TableRow>}/>
    </TableBody></Table>
    <p className="small muted" translate="no">{t(exchanges?'Saved Bitcoin CEX addresses identify both IN and OUT. Exchange balances are not included.':'Bitcoin mainnet · confirmed transactions only. Add every receiving and change address you own. Extended public keys and Lightning are not supported.')}</p>
  </section>;
}
