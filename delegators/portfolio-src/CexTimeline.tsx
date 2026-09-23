import {useEffect,useMemo,useRef,useState} from 'react';
import {cexTimelineSeries} from './cex';
import type {CexAddress} from './cex';
import type {Fact} from './core';

export function CexTimeline({facts,entries,history,busy}:{facts:Record<string,Fact>;entries:CexAddress[];history:Record<string,number>;busy:boolean}){
  const points=useMemo(()=>cexTimelineSeries(Object.values(facts),entries,history),[facts,entries,history]);
  const canvas=useRef<HTMLCanvasElement>(null);
  const [error,setError]=useState('');
  useEffect(()=>{
    if(!points.length||!canvas.current)return;
    let stopped=false,chart:{destroy:()=>void}|undefined;
    const host=window as unknown as {TDSPCharts:{load:()=>Promise<new(canvas:HTMLCanvasElement,options:unknown)=>{destroy:()=>void}>}};
    const render=async()=>{
      try{
        const Chart=await host.TDSPCharts.load();
        if(stopped||!canvas.current)return;
        const style=getComputedStyle(canvas.current),color=style.getPropertyValue('--text').trim(),grid=style.getPropertyValue('--line').trim();
        const fmt=(n:number)=>n.toLocaleString(undefined,{maximumFractionDigits:6});
        const last=points[points.length-1];
        const floor=-Math.max(1,Math.max(last.boughtAda,last.soldAda)*0.05);
        chart?.destroy();
        chart=new Chart(canvas.current,{
          type:'line',
          data:{datasets:[
            {label:'ADA IN',data:points.map(p=>({x:p.time*1000,y:p.boughtAda,usd:p.boughtUsd})),borderColor:style.getPropertyValue('--accent-strong').trim(),backgroundColor:style.getPropertyValue('--accent-strong').trim()},
            {label:'ADA OUT',data:points.map(p=>({x:p.time*1000,y:p.soldAda,usd:p.soldUsd})),borderColor:style.getPropertyValue('--ai-unavailable-color').trim()||'#c62828',backgroundColor:style.getPropertyValue('--ai-unavailable-color').trim()||'#c62828'}
          ].map(dataset=>({...dataset,stepped:'after',borderWidth:2,pointRadius:points.length===1?3:0,pointHitRadius:10,fill:false}))},
          options:{responsive:true,maintainAspectRatio:false,animation:false,interaction:{mode:'index',intersect:false},
            plugins:{legend:{labels:{color}},tooltip:{callbacks:{
              title:(items:{parsed:{x:number}}[])=>items.length?new Date(items[0].parsed.x).toLocaleString():'',
              label:(item:{dataset:{label:string};raw:{y:number;usd:number|null}})=>`${item.dataset.label}: ₳ ${fmt(item.raw.y)}${item.raw.usd===null?' · Historical USD unavailable':` ≈ $${item.raw.usd.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}`}`
            }}},
            scales:{x:{type:'linear',ticks:{color,maxTicksLimit:5,maxRotation:0,callback:(value:number)=>new Date(value).toLocaleDateString()},grid:{color:grid}},y:{min:floor,title:{display:true,text:'Cumulative ADA',color},ticks:{color,callback:(value:number)=>value<0?null:fmt(value)},grid:{color:grid}}}
          }
        });
        setError('');
      }catch{if(!stopped)setError('The transfer graph could not be loaded. Transaction details remain available below.');}
    };
    void render();
    const observer=new MutationObserver(()=>void render());
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    return ()=>{stopped=true;observer.disconnect();chart?.destroy();};
  },[points]);
  return <section className="portfolio-section" aria-label="ADA IN and ADA OUT timeline graph">
    {points.length>0?<div className="price-history-chart-frame"><canvas ref={canvas} role="img" aria-label="Cumulative ADA IN and ADA OUT over time">Cumulative incoming and outgoing amounts; detailed transfers are listed below.</canvas></div>:<p className="empty">{busy?'Loading CEX transfers…':'No classified CEX transfers.'}</p>}
    {error&&<p className="negative" role="status">{error}</p>}
    {points.length>0&&points[points.length-1].soldAda===0&&<p className="small muted" role="status">No outgoing CEX transfers matched in the analysed history. ADA OUT is shown at 0 ADA. Check the saved destination addresses if transfers are missing.</p>}
    <p className="small muted">Cumulative ADA IN / ADA OUT · Transfer-day USD estimates · Classified transfers only</p>
  </section>;
}
