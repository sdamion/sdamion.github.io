import {useState} from 'react';
import {ServiceAddressForm} from './ServiceAddressForm';
import {usePortfolioText} from './use-portfolio-text';
import {validEthereumAddress} from './ethereum';
import {validSolana} from './solana';
import {validWalletAddress} from './member';
import {normalizeExchangeAddress,validExchangeAddress} from './exchange-address';
import {normalizeBitcoinAddress,validBitcoinAddress} from './bitcoin';
import {addressNetworks,type AddressNetwork} from './address-networks';

export type {AddressNetwork} from './address-networks';
export function cryptoAddress(network:AddressNetwork,input:string,counterparty:boolean){
  if(network==='bitcoin'){
    if(!validBitcoinAddress(input.trim()))throw new Error('Enter a valid Bitcoin mainnet address.');
    return normalizeBitcoinAddress(input);
  }
  const address=network==='solana'?input.trim():network==='ethereum'?input.trim().toLowerCase():normalizeExchangeAddress(input);
  const valid=network==='ethereum'?validEthereumAddress(address):network==='solana'?validSolana(address):counterparty?validExchangeAddress(address):validWalletAddress(address);
  if(!valid)throw new Error(network==='ethereum'?'Enter an Ethereum mainnet address (0x…).':network==='solana'?'Invalid Solana request.':counterparty?'Enter a valid mainnet payment, stake or Byron address (addr1…, stake1…, DdzFF… or Ae2…).':'Enter a valid mainnet stake address (stake1…) or payment address (addr1…).');
  return address;
}

export function CryptoAddressForm({id,counterparty=false,ethereum=false,solana=false,bitcoin=false,initialKind='exchange',onAdd}:{id:string;counterparty?:boolean;ethereum?:boolean;solana?:boolean;bitcoin?:boolean;initialKind?:'exchange'|'swap'|'dex';onAdd:(network:AddressNetwork,kind:'exchange'|'swap'|'dex',name:string,address:string,out?:boolean)=>boolean}){
  const [network,setNetwork]=useState<AddressNetwork>('cardano'),[error,setError]=useState(''),t=usePortfolioText();
  const selected=network==='ethereum'&&!ethereum||network==='solana'&&!solana||network==='bitcoin'&&!bitcoin?'cardano':network;
  return <div>
    <ServiceAddressForm key={selected} id={id} type={initialKind==='swap'&&!addressNetworks[selected].swap?'exchange':initialKind} allowDex={counterparty} allowOut={counterparty} chooseType={counterparty&&addressNetworks[selected].swap} nameLabel={counterparty?undefined:'Wallet name'} addressLabel="Wallet address" placeholder={selected==='cardano'&&!counterparty?'stake1… or addr1…':addressNetworks[selected].placeholder} onAdd={(kind,name,input,out)=>{
      try{const address=cryptoAddress(selected,input,counterparty);if(!onAdd(selected,kind,name,address,out)){setError('Could not save the selection.');return false;}setError('');return true;}
      catch(reason){setError(reason instanceof Error?reason.message:'Could not save the selection.');return false;}
    }}>
      <label htmlFor={`${id}-network`} translate="no">{t('Network')}<select id={`${id}-network`} value={selected} onChange={event=>{setNetwork(event.target.value as AddressNetwork);setError('');}}>{(Object.keys(addressNetworks) as AddressNetwork[]).filter(network=>network==='cardano'||network==='ethereum'&&ethereum||network==='solana'&&solana||network==='bitcoin'&&bitcoin).map(network=><option key={network} value={network}>{addressNetworks[network].name}</option>)}</select></label>
    </ServiceAddressForm>
    {error&&<p role="alert" className="negative" translate="no">{t(error)}</p>}
  </div>;
}
