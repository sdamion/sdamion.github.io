import {useEffect,useState} from 'react';

export function usePortfolioText(){
  const [,setVersion]=useState(0);
  useEffect(()=>{
    const update=()=>setVersion(value=>value+1);
    window.addEventListener('tdsp-language-change',update);
    return()=>window.removeEventListener('tdsp-language-change',update);
  },[]);
  return (text:string,values:Record<string,string|number>={})=>{
    const translated=(window as unknown as {TDSPI18n?:{translateText:(value:string)=>string}}).TDSPI18n?.translateText(text)||text;
    return translated.replace(/\{(\w+)\}/g,(token,name)=>Object.hasOwn(values,name)?String(values[name]):token);
  };
}
