import {useState} from 'react';
import {Input} from './ui';
import {usePortfolioText} from './use-portfolio-text';

export function ServiceAddressForm({id,type='exchange',chooseType=false,nameLabel,addressLabel,placeholder='addr1…, stake1…, DdzFF… or Ae2…',onAdd}:{id:string;type?:'exchange'|'swap';chooseType?:boolean;nameLabel?:string;addressLabel?:string;placeholder?:string;onAdd:(type:'exchange'|'swap',name:string,address:string)=>boolean}){
  const [kind,setKind]=useState(type),[name,setName]=useState(''),[address,setAddress]=useState('');
  const t=usePortfolioText();
  return <form className="wallet-form governance-drep-registration-form" onSubmit={event=>{event.preventDefault();if(onAdd(kind,name.trim(),address)){setName('');setAddress('');}}}>
    {chooseType&&<label htmlFor={`${id}-type`}>Address type<select id={`${id}-type`} name="address_type" value={kind} onChange={event=>setKind(event.target.value as 'exchange'|'swap')}><option value="exchange">DEX / CEX</option><option value="swap">Swap</option></select></label>}
    <label htmlFor={`${id}-name`} translate="no">{t(nameLabel||(kind==='swap'?'Swap name':'Exchange name'))}<Input id={`${id}-name`} name="address_name" value={name} onChange={event=>setName(event.target.value)} maxLength={60} required pattern=".*\S.*"/></label>
    <label className="address-field" htmlFor={`${id}-address`} translate="no">{t(addressLabel||(kind==='swap'?'Wallet address':'Payment, stake or Byron address'))}<Input id={`${id}-address`} name="service_address" value={address} onChange={event=>setAddress(event.target.value)} autoCapitalize="none" spellCheck={false} required placeholder={placeholder}/></label>
    <button className="governance-vote-primary" type="submit" translate="no">{t('Add')}</button>
  </form>;
}
