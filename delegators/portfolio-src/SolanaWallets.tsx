import {useState} from 'react';
import {Trash2} from 'lucide-react';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from './ui';
import {NamedTableGroups} from './TableGroupToggle';
import {ServiceAddressForm} from './ServiceAddressForm';
import {short} from './core';
import {solAmount,validSolana,type NativeWallet,type SolanaData} from './solana';
import {formatPortfolioUsd,usePortfolioCurrency} from './portfolio-currency';
import {usePortfolioText} from './use-portfolio-text';
import {RewardSourceCheckbox} from './RewardSourceCheckbox';
import {rewardSourceTitle} from './reward-sources';

export function SolanaWallets({wallets,owned,data,exchanges=false,onChange}:{wallets:NativeWallet[];owned:NativeWallet[];data:SolanaData;exchanges?:boolean;onChange:(rows:NativeWallet[])=>boolean}){
  const t=usePortfolioText(),display=usePortfolioCurrency(),[error,setError]=useState('');
  return <section className="portfolio-section"><h3>{t(exchanges?'Solana CEX addresses':'Solana Wallets')}</h3>
    <ServiceAddressForm id={exchanges?'portfolio-sol-cex':'portfolio-sol-wallet'} type="exchange" nameLabel={exchanges?'Exchange name':'Wallet name'} addressLabel="Solana address" placeholder="Solana address" onAdd={(_,name,input)=>{
      const address=input.trim();if(!validSolana(address)||wallets.length>=20){setError('Invalid Solana request.');return false;}
      if([...wallets,...owned].some(w=>w.address===address)){setError('This address is already saved.');return false;}
      if(!onChange([...wallets,{name:name.trim(),address}]))return false;setError('');return true;
    }}/>
    {error&&<p translate="no" role="alert" className="small-text error-text">{t(error)}</p>}
    <Table><TableHeader><TableRow><TableHead>{t('Wallet')}</TableHead><TableHead>{t('Address')}</TableHead>{!exchanges&&<TableHead translate="no">SOL</TableHead>}{exchanges&&<TableHead translate="no">{t(rewardSourceTitle)}</TableHead>}<TableHead>{t('Remove')}</TableHead></TableRow></TableHeader><TableBody>
      <NamedTableGroups rows={wallets} nameOf={w=>w.name} columns={4} renderRow={w=><TableRow key={w.address}><TableCell translate="no">{w.name}</TableCell><TableCell translate="no"><a href={`https://solscan.io/account/${w.address}`} target="_blank" rel="noreferrer" title={w.address}>{short(w.address)}</a></TableCell>{!exchanges&&<TableCell translate="no">{data.accounts[w.address]?solAmount(data.accounts[w.address].raw).toLocaleString(undefined,{maximumFractionDigits:9}):'—'}{display&&<div className="small muted">{formatPortfolioUsd(data.accounts[w.address]&&data.usd!==null?solAmount(data.accounts[w.address].raw)*data.usd:null,display)}</div>}</TableCell>}{exchanges&&<TableCell><RewardSourceCheckbox name={w.name} checked={w.miner===true} onChange={miner=>onChange(wallets.map(row=>row.address===w.address?{...row,miner}:row))}/></TableCell>}<TableCell><button type="button" className="governance-vote-secondary" title={t('Remove')} aria-label={t('Remove')} onClick={()=>onChange(wallets.filter(row=>row.address!==w.address))}><Trash2 size={14}/></button></TableCell></TableRow>}/>
    </TableBody></Table>
    <p className="small muted">{t('Solana mainnet · native SOL only. SPL tokens and NFTs are not included. CEX addresses are counterparties, not your holdings.')}</p>
  </section>;
}
