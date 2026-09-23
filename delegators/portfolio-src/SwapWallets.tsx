import {useState} from 'react';
import {Plus,Trash2} from 'lucide-react';
import {MenuTile,Input,Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from './ui';
import {AssetOverlay} from './AssetOverlay';
import {short} from './core';
import type {Wallet} from './core';
import {addSwapWallet} from './swap-wallets';

export function SwapWallets({wallets,onChange}:{wallets:Wallet[];onChange:(wallets:Wallet[])=>void}){
  const [open,setOpen]=useState(false),[address,setAddress]=useState(''),[error,setError]=useState('');
  const members=wallets.filter(wallet=>wallet.group==='swap');
  return <>
    <div className="tdsp-tile-grid"><MenuTile title="Swap" value={`${members.length} wallets`} onOpen={()=>setOpen(true)}/></div>
    {open&&<AssetOverlay id="portfolio-swap-wallets-overlay" name="Swap" onClose={()=>setOpen(false)}>
      <section className="portfolio-section">
        <p className="small muted">Owned internal wallets. Balances and transactions are combined with your portfolio. These addresses cannot be selected in Combined Byron CEX or DEX / CEX.</p>
        <div className="history-table"><Table><TableHeader><TableRow><TableHead>Wallet address</TableHead><TableHead>Remove</TableHead></TableRow></TableHeader><TableBody>{members.map(wallet=><TableRow key={wallet.address}>
          <TableCell><a className="address" title={wallet.address} href={`https://cardanoscan.io/address/${wallet.address}`} target="_blank" rel="noreferrer">{short(wallet.address)}</a></TableCell>
          <TableCell><button type="button" className="governance-vote-secondary" aria-label={`Remove ${wallet.address} from Swap`} title="Remove wallet" onClick={()=>onChange(wallets.filter(item=>item.address!==wallet.address))}><Trash2 size={16}/></button></TableCell>
        </TableRow>)}</TableBody></Table></div>
        {!members.length&&<p className="empty">No Swap wallets added.</p>}
        <form className="wallet-form governance-drep-registration-form" onSubmit={event=>{event.preventDefault();try{onChange(addSwapWallet(wallets,address));setAddress('');setError('');}catch(reason){setError(reason instanceof Error?reason.message:'Could not add wallet.');}}}>
          <label className="address-field" htmlFor="portfolio-swap-address">Payment or Byron address<Input id="portfolio-swap-address" name="swap_address" value={address} onChange={event=>setAddress(event.target.value)} required aria-describedby="portfolio-swap-error"/></label>
          <button type="submit" className="governance-vote-primary"><Plus size={16}/>Add to Swap</button>
        </form>
        <p id="portfolio-swap-error" className="negative" role="status">{error}</p>
      </section>
    </AssetOverlay>}
  </>;
}
