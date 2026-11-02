import {useEffect,useRef,useState} from 'react';

// Start nearby artwork before it scrolls into view, not every full-size file on the page.
export function useArtworkLoading(){
  const ref=useRef<HTMLDivElement>(null);
  const [load,setLoad]=useState(()=>typeof IntersectionObserver==='undefined');
  useEffect(()=>{
    if(load||!ref.current)return;
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting)){setLoad(true);observer.disconnect();}
    },{rootMargin:'160px'});
    observer.observe(ref.current);
    return()=>observer.disconnect();
  },[load]);
  return {ref,load};
}
