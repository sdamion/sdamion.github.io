import {useState} from 'react';
import {Copy,ExternalLink,Trash2} from 'lucide-react';
import {Table,TableHeader,TableBody,TableRow,TableHead,TableCell} from './ui';
import {ServiceAddressForm} from './ServiceAddressForm';
import {SwapNameField} from './SwapNameField';
import {NamedTableGroups} from './TableGroupToggle';
import {short} from './core';
import {validEthereumAddress,weiToEth,type EthereumWallet,type EthereumData} from './ethereum';
import {formatPortfolioUsd,usePortfolioCurrency} from './portfolio-currency';
import {usePortfolioText} from './use-portfolio-text';

export function EthereumWallets({wallets,data,exchanges=false,swap=false,owned=[],onChange}:{wallets:EthereumWallet[];data:EthereumData;exchanges?:boolean;swap?:boolean;owned?:EthereumWallet[];onChange:(wallets:EthereumWallet[])=>boolean}){
  const [error,setError]=useState('');
  const t=usePortfolioText(),display=usePortfolioCurrency();
  function add(name:string,address:string){
    const normalized=address.trim().toLowerCase();
    if(!validEthereumAddress(normalized)){setError('Enter an Ethereum mainnet address (0x…).');return false;}
    if(wallets.some(w=>w.address===normalized)){setError('This address is already saved.');return false;}
    if(exchanges&&owned.some(w=>w.address===normalized)){setError('Your own wallet cannot be added as a CEX address.');return false;}
    if(!exchanges&&owned.some(w=>w.address===normalized)){setError('This address is already saved.');return false;}
    if(wallets.length>=20){setError('A maximum of 20 Ethereum addresses can be added.');return false;}
    if(!onChange([...wallets,{address:normalized,name:name.trim(),...(swap?{group:'swap' as const}:{})}]))return false;
    setError('');return true;
  }
  return <section className="portfolio-section">
    <h3>{t(exchanges?'Ethereum CEX addresses':swap?'Ethereum Swap wallets':'Ethereum Wallets')}</h3>
    <ServiceAddressForm id={swap?'portfolio-eth-swap':exchanges?'portfolio-eth-cex':'portfolio-eth-wallet'} type={swap?'swap':'exchange'} nameLabel={swap?'Swap name':exchanges?'Exchange name':'Wallet name'} addressLabel={swap?'Wallet address':'Ethereum address'} placeholder="0x…" onAdd={(_,name,address)=>add(name,address)}/>
    {error&&<p translate="no" role="alert" className="negative">{t(error)}</p>}
    <Table><TableHeader><TableRow><TableHead>{t(swap?'Swap name':'Wallet')}</TableHead><TableHead>{t(swap?'Wallet address':'Address')}</TableHead>{!exchanges&&!swap&&<><TableHead translate="no">ETH</TableHead><TableHead>{t('Miner')}</TableHead></>}<TableHead>{t('Remove')}</TableHead></TableRow></TableHeader><TableBody>
      <NamedTableGroups rows={wallets} nameOf={w=>w.name} columns={exchanges||swap?3:5} renderRow={wallet=><TableRow key={wallet.address}>
        <TableCell translate="no">{swap?<SwapNameField name={wallet.name} onSave={name=>{if(!onChange(wallets.map(w=>w.address===wallet.address?{...w,name}:w)))return false;setError('');return true;}} onError={()=>setError('Could not save Swap name.')}/>:wallet.name}</TableCell>
        <TableCell translate="no"><a href={`https://etherscan.io/address/${wallet.address}`} target="_blank" rel="noreferrer" title={wallet.address}>{short(wallet.address)} <ExternalLink size={12}/></a> <button type="button" className="governance-vote-secondary" title={t('Copy address')} aria-label={t('Copy address')} onClick={()=>void navigator.clipboard.writeText(wallet.address).catch(()=>setError('Could not copy address.'))}><Copy size={14}/></button></TableCell>
        {!exchanges&&!swap&&<TableCell translate="no">{data.accounts[wallet.address]?weiToEth(data.accounts[wallet.address].balanceWei).toLocaleString(undefined,{maximumFractionDigits:6}):'—'}{display&&<div className="small muted">{formatPortfolioUsd(data.accounts[wallet.address]&&data.usd!==null?weiToEth(data.accounts[wallet.address].balanceWei)*data.usd:null,display)}</div>}</TableCell>}
        {!exchanges&&!swap&&<TableCell><input type="checkbox" checked={wallet.miner===true} aria-label={t('Miner wallet: {name}',{name:wallet.name})} title={t('Treat external receipts as mined ETH OUT. Own-wallet transfers and saved CEX purchases are excluded.')} onChange={event=>onChange(wallets.map(w=>w.address===wallet.address?{...w,miner:event.target.checked}:w))}/></TableCell>}
        <TableCell><button type="button" className="governance-vote-secondary" title={t('Remove')} aria-label={t('Remove')} onClick={()=>onChange(wallets.filter(w=>w.address!==wallet.address))}><Trash2 size={14}/></button></TableCell>
      </TableRow>}/>
    </TableBody></Table>
    <p className="small muted">{t(exchanges?'Only ETH transfers to or from saved CEX addresses contribute to CEX IN/OUT. Own-wallet transfers are excluded.':'Ethereum mainnet · ETH only. ERC-20 tokens, NFTs and other EVM networks are not included.')}</p>
    {swap&&<p className="small muted">{t('Add only Ethereum Swap wallets you own. Balances and fees are included; transfers between your own wallets are excluded from CEX IN/OUT.')}</p>}
    <p className="small muted"><a href="https://etherscan.io" target="_blank" rel="noreferrer">Powered by Etherscan.io APIs</a></p>
  </section>;
}
