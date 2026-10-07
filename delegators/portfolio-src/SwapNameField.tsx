import {useState} from 'react';
import {Save} from 'lucide-react';
import {Input} from './ui';
import {usePortfolioText} from './use-portfolio-text';

export function SwapNameField({name,onSave,onError}:{name:string;onSave:(name:string)=>boolean;onError:()=>void}){
  const [draft,setDraft]=useState<string|null>(null),t=usePortfolioText();
  return <form className="wallet-form" onSubmit={event=>{
    event.preventDefault();const next=(draft??name).trim();if(!next)return;
    try{if(onSave(next))setDraft(null);else onError();}catch{onError();}
  }}><Input aria-label={t('Swap name')} name="swap_name" maxLength={60} required pattern=".*\S.*" value={draft??name} onChange={event=>setDraft(event.target.value)}/><button type="submit" className="governance-vote-secondary" title={t('Save Swap name')} aria-label={t('Save Swap name')} disabled={draft===null||draft.trim()===name}><Save size={16}/></button></form>;
}
