import {useState} from 'react';
import {Save} from 'lucide-react';
import {Input} from './ui';
import {usePortfolioText} from './use-portfolio-text';

export type AddressNameProps={name:string;onSave:(name:string)=>boolean;onError:()=>void;label?:string;saveLabel?:string;inputName?:string};
export function AddressNameField({name,onSave,onError,label='Wallet name',saveLabel='Save name',inputName='address_name'}:AddressNameProps){
  const [draft,setDraft]=useState<string|null>(null),t=usePortfolioText();
  return <form className="wallet-form" onSubmit={event=>{
    event.preventDefault();const next=(draft??name).trim();if(!next)return;
    try{if(onSave(next))setDraft(null);else onError();}catch{onError();}
  }}><Input aria-label={t(label)} name={inputName} maxLength={60} required pattern=".*\S.*" value={draft??name} onChange={event=>setDraft(event.target.value)}/><button type="submit" className="governance-vote-secondary" title={t(saveLabel)} aria-label={t(saveLabel)} disabled={draft===null||draft.trim()===name}><Save size={16}/></button></form>;
}
