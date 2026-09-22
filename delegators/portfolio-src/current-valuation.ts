import {currentPrice} from './core.ts';
import type {Market} from './core.ts';

export function currentValuation(id:string,qty:number|null,manual:number|null,market:Market|undefined,adaUsd:number|null,now=Date.now()){
  const adaQuote=adaUsd!==null&&Number.isFinite(adaUsd)&&adaUsd>0?adaUsd:null;
  if(manual!==null)return {price:manual,value:qty===null?null:qty*manual,source:'manual',ada:null};
  const floor=market?.wayup_floor_ada;
  const at=Date.parse(market?.wayup_quoted_at||'');
  if(id!=='lovelace'&&market?.is_nft&&typeof floor==='number'&&Number.isFinite(floor)&&floor>0&&Number.isFinite(at)&&at<=now&&now-at<=900000){
    const price=adaQuote===null?null:floor*adaQuote;
    return {price,value:qty===null||price===null?null:qty*price,source:'wayup',ada:floor};
  }
  const price=currentPrice(id,market?{[id]:market}:{},adaQuote);
  if(price!==null)return {price,value:qty===null?null:qty*price,source:'market',ada:null};
  if(id==='lovelace')return {price:null,value:null,source:'unavailable',ada:null};
  // User-defined fallback is per holding, not a quote multiplied by an unknown
  // token supply. Never use purchase history as current market value.
  const value=adaQuote===null?null:2*adaQuote;
  return {price:qty!==null&&qty>0&&value!==null?value/qty:null,value,source:'fallback',ada:2};
}
