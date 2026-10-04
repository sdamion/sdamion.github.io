import {currentPrice} from './core.ts';
import type {Market} from './core.ts';

type Valuation={price:number|null;value:number|null;source:string;ada:number|null;stale?:boolean};

export function mergeMarketQuote(previous:Market|undefined,incoming:Market):Market{
  const merged={...previous,...incoming,decimals:incoming.decimals??previous?.decimals};
  const previousTime=Date.parse(previous?.wayup_quoted_at||'');
  const incomingTime=Date.parse(incoming.wayup_quoted_at||'');
  const validPrevious=typeof previous?.wayup_floor_ada==='number'&&Number.isFinite(previous.wayup_floor_ada)&&previous.wayup_floor_ada>0&&Number.isFinite(previousTime);
  const validIncoming=typeof incoming.wayup_floor_ada==='number'&&Number.isFinite(incoming.wayup_floor_ada)&&incoming.wayup_floor_ada>0&&Number.isFinite(incomingTime);
  // Failed or incomplete lookups must not erase or re-date the last valid quote.
  if(previous?.token_id===incoming.token_id&&validPrevious&&(!validIncoming||incomingTime<previousTime)){
    merged.wayup_floor_ada=previous.wayup_floor_ada;
    merged.wayup_quoted_at=previous.wayup_quoted_at;
    merged.is_nft=incoming.is_nft??previous.is_nft;
  }
  return merged;
}

export function currentValuation(id:string,qty:number|null,manual:number|null,market:Market|undefined,adaUsd:number|null,now=Date.now()):Valuation{
  const adaQuote=adaUsd!==null&&Number.isFinite(adaUsd)&&adaUsd>0?adaUsd:null;
  if(manual!==null)return {price:manual,value:qty===null?null:qty*manual,source:'manual',ada:null};
  const floor=market?.wayup_floor_ada;
  const at=Date.parse(market?.wayup_quoted_at||'');
  if(id!=='lovelace'&&market?.is_nft&&typeof floor==='number'&&Number.isFinite(floor)&&floor>0&&Number.isFinite(at)&&at<=now){
    const price=adaQuote===null?null:floor*adaQuote;
    return {price,value:qty===null||price===null?null:qty*price,source:'wayup',ada:floor,stale:now-at>900000};
  }
  const price=currentPrice(id,market?{[id]:market}:{},adaQuote);
  if(price!==null)return {price,value:qty===null?null:qty*price,source:'market',ada:null};
  if(id==='lovelace')return {price:null,value:null,source:'unavailable',ada:null};
  // User-defined fallback is per holding, not a quote multiplied by an unknown
  // token supply. Never use purchase history as current market value.
  const value=adaQuote===null?null:2*adaQuote;
  return {price:qty!==null&&qty>0&&value!==null?value/qty:null,value,source:'fallback',ada:2};
}
