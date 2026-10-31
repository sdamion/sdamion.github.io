import {useState} from 'react';
import {ServiceAddressForm} from './ServiceAddressForm';
import {usePortfolioText} from './use-portfolio-text';
import {validEthereumAddress} from './ethereum';
import {validSolana} from './solana';
import {validWalletAddress} from './member';
import {normalizeExchangeAddress,validExchangeAddress} from './exchange-address';

export type AddressNetwork='cardano'|'ethereum'|'solana';
export function cryptoAddress(network:AddressNetwork,input:string,counterparty:boolean){
  const address=network==='solana'?input.trim():network==='ethereum'?input.trim().toLowerCase():normalizeExchangeAddress(input);
  const valid=network==='ethereum'?validEthereumAddress(address):network==='solana'?validSolana(address):counterparty?validExchangeAddress(address):validWalletAddress(address);
  if(!valid)throw new Error(network==='ethereum'?'Enter an Ethereum mainnet address (0x…).':network==='solana'?'Invalid Solana request.':counterparty?'Enter a valid mainnet payment, stake or Byron address (addr1…, stake1…, DdzFF… or Ae2…).':'Enter a valid mainnet stake address (stake1…) or payment address (addr1…).');
  return address;
}

export function CryptoAddressForm({id,counterparty=false,ethereum=false,solana=false,onAdd}:{id:string;counterparty?:boolean;ethereum?:boolean;solana?:boolean;onAdd:(network:AddressNetwork,kind:'exchange'|'swap'|'dex',name:string,address:string)=>boolean}){
  const [network,setNetwork]=useState<AddressNetwork>('cardano'),[error,setError]=useState(''),t=usePortfolioText();
  const selected=network==='ethereum'&&!ethereum||network==='solana'&&!solana?'cardano':network;
  return <div>
    <ServiceAddressForm key={selected} id={id} allowDex={counterparty} chooseType={counterparty&&selected!=='solana'} nameLabel={counterparty?undefined:'Wallet name'} addressLabel="Wallet address" placeholder={selected==='ethereum'?'0x…':selected==='solana'?'Solana address':counterparty?'addr1…, stake1…, DdzFF… or Ae2…':'stake1… or addr1…'} onAdd={(kind,name,input)=>{
      try{const address=cryptoAddress(selected,input,counterparty);if(!onAdd(selected,kind,name,address)){setError('Could not save the selection.');return false;}setError('');return true;}
      catch(reason){setError(reason instanceof Error?reason.message:'Could not save the selection.');return false;}
    }}>
      <label htmlFor={`${id}-network`} translate="no">{t('Network')}<select id={`${id}-network`} value={selected} onChange={event=>{setNetwork(event.target.value as AddressNetwork);setError('');}}><option value="cardano">Cardano</option>{ethereum&&<option value="ethereum">Ethereum</option>}{solana&&<option value="solana">Solana</option>}</select></label>
    </ServiceAddressForm>
    {error&&<p role="alert" className="negative" translate="no">{t(error)}</p>}
  </div>;
}
