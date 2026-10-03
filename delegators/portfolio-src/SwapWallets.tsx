import {useState} from 'react';
import {Save,Trash2} from 'lucide-react';
import {Input,MenuTile,Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from './ui';
import {ServiceAddressForm} from './ServiceAddressForm';
import {AssetOverlay} from './AssetOverlay';
import {short} from './core';
import type {Wallet} from './core';
import {addSwapWallet} from './swap-wallets';
import {validStakeAddress} from './member';

export function SwapWallets({wallets,groups={},onChange,inline=false,showForm=true}:{wallets:Wallet[];groups?:Record<string,string[]>;onChange:(wallets:Wallet[])=>void|boolean;inline?:boolean;showForm?:boolean}){
  const [open,setOpen]=useState(false),[error,setError]=useState('');
  const [names,setNames]=useState<Record<string,string>>({});
  const members=wallets.filter(wallet=>wallet.group==='swap');
  const content=(
      <section className="portfolio-section">
        <p className="small muted">Swap addresses are excluded from CEX. Transaction amounts are matched to your tracked wallet addresses, including addresses linked to your member stake key. Other recipients and shared service balances are not counted as yours.</p>
        {showForm&&<ServiceAddressForm id="portfolio-swap" type="swap" onAdd={(_,name,address)=>{try{if(onChange(addSwapWallet(wallets,address,name))===false)return false;setError('');return true;}catch(reason){setError(reason instanceof Error?reason.message:'Could not add wallet.');return false;}}}/>}
        <p id="portfolio-swap-error" className="negative" role="status">{error}</p>
        <div className="history-table"><Table><TableHeader><TableRow><TableHead>Swap name</TableHead><TableHead>Wallet address</TableHead><TableHead>Remove</TableHead></TableRow></TableHeader><TableBody>{members.map(wallet=><TableRow key={wallet.address}>
          <TableCell><form className="wallet-form" onSubmit={event=>{
            event.preventDefault();
            const label=(names[wallet.address]??wallet.label??'Swap').trim();
            if(!label)return;
            try{
              if(onChange(wallets.map(item=>item.address===wallet.address?{...item,label}:item))===false){setError('Could not save Swap name.');return;}
              setNames(previous=>{const next={...previous};delete next[wallet.address];return next;});setError('');
            }catch{setError('Could not save Swap name.');}
          }}><Input aria-label="Swap name" name="swap_name" maxLength={60} required pattern=".*\S.*" value={names[wallet.address]??wallet.label??'Swap'} onChange={event=>setNames(previous=>({...previous,[wallet.address]:event.target.value}))}/><button type="submit" className="governance-vote-secondary" title="Save Swap name" aria-label="Save Swap name" disabled={names[wallet.address]===undefined||names[wallet.address].trim()===(wallet.label||'Swap')}><Save size={16}/></button></form></TableCell>
          <TableCell><a className="address" title={wallet.address} href={`https://cardanoscan.io/${validStakeAddress(wallet.address)?'stakekey':'address'}/${wallet.address}`} target="_blank" rel="noreferrer">{short(wallet.address)}</a>{validStakeAddress(wallet.address)&&<div className="small muted">{groups[wallet.address]?`${groups[wallet.address].length} linked addresses excluded from CEX`:'Linked addresses awaiting refresh'}</div>}</TableCell>
          <TableCell><button type="button" className="governance-vote-secondary" aria-label={`Remove ${wallet.address} from Swap`} title="Remove wallet" onClick={()=>onChange(wallets.filter(item=>item.address!==wallet.address))}><Trash2 size={16}/></button></TableCell>
        </TableRow>)}</TableBody></Table></div>
        {!members.length&&<p className="empty">No Swap wallets added.</p>}
      </section>
  );
  if(inline)return content;
  return <>
    <MenuTile title="Swap" value={String(members.length)} onOpen={()=>setOpen(true)}/>
    {open&&<AssetOverlay id="portfolio-swap-wallets-overlay" name="Swap" onClose={()=>setOpen(false)}>{content}</AssetOverlay>}
  </>;
}
