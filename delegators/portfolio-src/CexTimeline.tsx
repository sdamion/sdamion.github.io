import {useEffect,useMemo,useRef,useState} from 'react';
import type {CexAddress} from './cex';
import type {Fact} from './core';
import {withinTransactionDates} from './transaction-date';
import {transferComparison} from './transfer-comparison';
import type {ComparisonCrypto,ComparisonCurrency,FxHistory} from './transfer-comparison';
import {formatAdaNumber} from './portfolio-currency';
import {usePortfolioText} from './use-portfolio-text';
import {siteChartDefaults} from '../../shared/chart-defaults.js';
import type {FiatTransfer} from './ethereum';
const emptyRates={};
const emptyTransfers:FiatTransfer[]=[];

export function CexTimeline({facts,entries,history,btcHistory=emptyRates,ethHistory=emptyRates,fxHistory=emptyRates,crypto='ADA',currency='USD',busy,dateFrom='',dateTo='',additional=emptyTransfers}:{facts:Record<string,Fact>;entries:CexAddress[];history:Record<string,number>;btcHistory?:Record<string,number>;ethHistory?:Record<string,number>;fxHistory?:FxHistory;crypto?:ComparisonCrypto;currency?:ComparisonCurrency;busy:boolean;dateFrom?:string;dateTo?:string;additional?:FiatTransfer[]}){
  const t=usePortfolioText();
  const points=useMemo(()=>transferComparison(Object.values(facts).filter(fact=>withinTransactionDates(fact.time,dateFrom,dateTo)),entries,history,btcHistory,fxHistory,crypto,currency,additional.filter(row=>withinTransactionDates(row.time,dateFrom,dateTo)),ethHistory),[facts,entries,history,btcHistory,ethHistory,fxHistory,crypto,currency,dateFrom,dateTo,additional]);
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
        const defaults=siteChartDefaults(canvas.current),{grid}=defaults;
        const green=defaults.positive,incomingColor=defaults.color;
        const i18n=(window as unknown as {TDSPI18n?:{translateText:(text:string)=>string;getLanguage:()=>string}}).TDSPI18n;
        const locale=i18n?.getLanguage()||'en';
        const fmt=(n:number)=>n.toLocaleString(locale,{maximumFractionDigits:crypto==='ADA'?6:8});
        const compact=new Intl.NumberFormat(undefined,{notation:'compact',maximumFractionDigits:1});
        const last=points[points.length-1];
        const floor=-Math.max(crypto==='ADA'?1:0.00000001,Math.max(last.incoming??0,last.outgoing??0)*0.05);
        chart?.destroy();
        chart=new Chart(canvas.current,{
          type:'line',
          data:{datasets:[
            {label:crypto+' IN',data:points.map(p=>({x:p.time*1000,y:p.incoming,fiat:p.inFiat})),borderColor:crypto==='BTC'?'#f7931a':incomingColor,backgroundColor:crypto==='BTC'?'#f7931a':incomingColor},
            {label:crypto+' OUT',borderDash:crypto==='BTC'?[6,4]:[],data:points.map(p=>({x:p.time*1000,y:p.outgoing,fiat:p.outFiat})),borderColor:crypto==='BTC'?'#f7931a':green,backgroundColor:crypto==='BTC'?'#f7931a':green}
          ].map(dataset=>({...defaults.line,...dataset,stepped:'after',pointRadius:points.length===1?4:0}))},
          options:{responsive:true,maintainAspectRatio:false,animation:false,layout:{padding:{top:8,right:12}},interaction:{mode:'index',intersect:false},
            plugins:{legend:defaults.legend,tooltip:{...defaults.tooltip,callbacks:{
              title:(items:{parsed:{x:number}}[])=>items.length?new Date(items[0].parsed.x).toLocaleString():'',
              label:(item:{dataset:{label:string};raw:{y:number;fiat:number|null}})=>`${item.dataset.label}: ${crypto==='ADA'?'₳ '+fmt(item.raw.y):fmt(item.raw.y)+' '+crypto}${crypto==='ADA'&&currency==='ADA'?'':item.raw.fiat===null?' · '+t('Historical currency price unavailable'):' ≈ '+(currency==='ADA'?'₳ '+formatAdaNumber(item.raw.fiat,locale):new Intl.NumberFormat(locale,{style:'currency',currency,maximumFractionDigits:currency==='JPY'?0:2}).format(item.raw.fiat))}`
            }}},
            scales:{x:{type:'linear',border:{display:false},ticks:{...defaults.ticks,maxRotation:0,callback:(value:number)=>new Date(value).toLocaleDateString(locale,{month:'short',year:'2-digit'})},grid:{display:false}},y:{min:floor,border:{display:false},title:{...defaults.title,display:true,text:t('Cumulative {crypto}',{crypto})},ticks:{...defaults.ticks,callback:(value:number)=>value<0?null:crypto!=='ADA'?fmt(value):compact.format(value)},grid:{color:grid,drawTicks:false}}}
          }
        });
        setError('');
      }catch{if(!stopped)setError('The transfer graph could not be loaded. Transaction details remain available below.');}
    };
    void render();
    const observer=new MutationObserver(()=>void render());
    observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
    const language=()=>void render();
    window.addEventListener('tdsp-language-change',language);
    return ()=>{stopped=true;observer.disconnect();window.removeEventListener('tdsp-language-change',language);chart?.destroy();};
  },[points,crypto,currency]);
  return <section className="portfolio-section portfolio-timeline" aria-label={t('{crypto} IN and OUT timeline graph',{crypto})}>
    {points.length>0?<div className="price-history-chart-frame"><canvas ref={canvas} role="img" aria-label={t('Cumulative {crypto} IN and OUT over time',{crypto})}>Cumulative incoming and outgoing amounts; detailed transfers are listed below.</canvas></div>:<p className="empty">{busy?'Loading CEX transfers…':'No classified CEX transfers.'}</p>}
    {error&&<p className="negative" role="status">{error}</p>}
    {points.length>0&&points[points.length-1].outgoing===0&&<p className="small muted" role="status">No outgoing CEX transfers matched in the analysed history. Check the saved destination addresses if transfers are missing.</p>}
    <p translate="no" className="small muted">{t('Cumulative {crypto} IN / OUT · Transfer-day {currency} estimates · Classified transfers only',{crypto,currency})}</p>
  </section>;
}
