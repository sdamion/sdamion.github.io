import {useState} from 'react';
import {Trash2,ExternalLink} from 'lucide-react';
import {ServiceAddressForm} from './ServiceAddressForm';
import {SwapWallets} from './SwapWallets';
import {addSwapWallet} from './swap-wallets';
import type {Wallet} from './core';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from '@/components/ui/table';
import {short} from './core';
import {validStakeAddress} from './member';
import {normalizeExchangeAddress,validExchangeAddress,validByronAddress} from './exchange-address';
import type {CexAddress} from './cex';

export function CexAddresses({entries,owned,onChange,swap}:{entries:CexAddress[];owned:string[];onChange:(entries:CexAddress[])=>boolean;swap?:{wallets:Wallet[];groups?:Record<string,string[]>;onChange:(wallets:Wallet[])=>void|boolean}}){
  const [error,setError]=useState('');
  return <section className="portfolio-section">
    <p className="small muted">Saved exchange addresses use your CEX rule: incoming ADA is a buy, outgoing ADA a sell. This does not decode DEX swaps. Saved using your selected Portfolio storage.</p>
    <ServiceAddressForm id="portfolio-cex" chooseType={!!swap} onAdd={(type,name,address)=>{
      const value=normalizeExchangeAddress(address);setError('');
      if(!validExchangeAddress(value)){setError('Enter a valid mainnet payment, stake or Byron address (addr1…, stake1…, DdzFF… or Ae2…).');return false;}
      if(owned.includes(value)){setError('This address belongs to a wallet in your portfolio.');return false;}
      if(type==='swap'&&swap){try{return swap.onChange(addSwapWallet(swap.wallets,value,name))!==false;}catch(reason){setError(reason instanceof Error?reason.message:'Could not add wallet.');return false;}}
      if(entries.some(entry=>entry.address===value)){setError('This CEX address is already saved.');return false;}
      return onChange([...entries,{address:value,name}]);
    }}/><p className="negative" role="status">{error}</p>
    <div className="history-table"><Table><TableHeader><TableRow><TableHead>Exchange</TableHead><TableHead>Address</TableHead><TableHead>Remove</TableHead></TableRow></TableHeader><TableBody>{entries.filter(entry=>!validByronAddress(entry.address)).map(entry=><TableRow key={entry.address}>
      <TableCell>{entry.name}</TableCell>
      <TableCell><a className="address" title={entry.address} href={`https://cardanoscan.io/${validStakeAddress(entry.address)?'stakekey':'address'}/${entry.address}`} target="_blank" rel="noreferrer">{short(entry.address)} <ExternalLink size={12}/></a></TableCell>
      <TableCell><button className="governance-vote-secondary" title={`Remove ${entry.name} address`} aria-label={`Remove ${entry.name} address`} onClick={()=>onChange(entries.filter(item=>item.address!==entry.address))}><Trash2 size={16}/></button></TableCell>
    </TableRow>)}</TableBody></Table></div>
    {swap&&<><h2>Swap</h2><SwapWallets inline showForm={false} {...swap}/></>}
  </section>;
}
