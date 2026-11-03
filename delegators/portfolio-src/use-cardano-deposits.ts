import {useCallback,useEffect,useRef,useState} from 'react';
import type {CexAddress} from './cex';
import {portfolioSettings,flushVault} from './vault';
import {portfolioFetch} from './transport';
import {emptyCardanoDeposits,readCardanoDeposits,encodeCardanoDeposits,scanCardanoDeposits,cardanoDepositScope} from './cardano-deposits';

export function useCardanoDeposits(stake:string,enabled:boolean,targets:CexAddress[]){
  const key='tdsp-member-cardano-deposits:'+stake,scope=cardanoDepositScope(targets);
  const [state,setState]=useState({stake:'',data:emptyCardanoDeposits()}),[loaded,setLoaded]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const current=useRef(emptyCardanoDeposits()),controller=useRef<AbortController|null>(null);
  useEffect(()=>{
    controller.current?.abort();setBusy(false);setError('');setLoaded('');current.current=emptyCardanoDeposits();
    if(!enabled){setState({stake:'',data:current.current});return;}
    try{current.current=readCardanoDeposits(key,name=>portfolioSettings.getItem(name));}catch{setError('Cardano CEX deposits unavailable. Saved data is retained.');}
    setState({stake,data:current.current});setLoaded(stake);return()=>controller.current?.abort();
  },[stake,enabled]);
  const refresh=useCallback(async(force=false)=>{
    if(!enabled||loaded!==stake||!scope)return;
    const previous=current.current,age=Date.now()-previous.checkedAt;
    if(!force&&previous.scope===scope&&previous.complete!==false&&age>=0&&age<600000)return;
    controller.current?.abort();const control=new AbortController();controller.current=control;setBusy(true);setError('');
    const mergePartial=(partial:typeof previous)=>previous.scope===partial.scope?{...partial,details:[...new Map([...previous.details,...partial.details].map(tx=>[tx.tx_hash,tx])).values()]}:partial;
    try{
      const result=await scanCardanoDeposits(targets,portfolioFetch,control.signal,partial=>{
        if(control.signal.aborted)return;
        setState({stake,data:mergePartial(partial)});
      });control.signal.throwIfAborted();
      const next=result.complete===false?mergePartial(result):result;
      const settings=encodeCardanoDeposits(key,next);portfolioSettings.setItems(settings,portfolioSettings.keys().filter(name=>name.startsWith(key+'::')&&!Object.hasOwn(settings,name)));
      await flushVault();control.signal.throwIfAborted();current.current=next;setState({stake,data:next});
      if(next.complete===false)setError('Cardano CEX deposits partially loaded. Some transactions could not be checked; retry.');
    }catch{if(!control.signal.aborted)setError('Cardano CEX deposits unavailable. Saved data is retained.');}
    finally{if(controller.current===control)setBusy(false);}
  },[stake,enabled,loaded,scope]);
  useEffect(()=>{void refresh();return()=>controller.current?.abort();},[refresh]);
  return {data:enabled&&state.stake===stake?state.data:emptyCardanoDeposits(),busy:enabled&&busy,error:enabled?error:'',refresh};
}
