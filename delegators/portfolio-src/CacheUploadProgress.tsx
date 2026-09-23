import {useEffect,useState} from 'react';
import {getUploadProgress} from './upload-progress';

export function CacheUploadProgress({onRetry}:{onRetry?:()=>void}){
  const [progress,setProgress]=useState(getUploadProgress);
  useEffect(()=>{const update=()=>setProgress(getUploadProgress());window.addEventListener('tdsp:portfolio-upload-progress',update);update();return()=>window.removeEventListener('tdsp:portfolio-upload-progress',update);},[]);
  if(progress.phase==='idle')return null;
  const active=['preparing','uploading','confirming'].includes(progress.phase);
  const percent=progress.total?Math.min(99,progress.loaded/progress.total*100):0;
  const label=progress.phase==='preparing'?'Preparing encrypted checkpoint…':progress.phase==='confirming'?'Upload sent · confirming save…':'Uploading encrypted checkpoint';
  return <div className="portfolio-section" aria-live="polite">
    {active&&<><span className="small muted">{label}</span><div className="section-heading"><span className="governance-vote-bar-track" style={{flex:1}} role="progressbar" aria-label="Portfolio cache upload" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.phase==='preparing'?undefined:percent}><span className="governance-vote-bar-fill governance-vote-bar-fill--yes" style={{flexBasis:`${percent}%`}}/></span><span className="tdsp-bar-legend">{progress.phase==='preparing'?'…':`${percent.toFixed(0)}%`}</span></div></>}
    <span className="tdsp-bar-legend">Cache saved: {progress.saved.toLocaleString()} / {progress.transactions.toLocaleString()} transactions{progress.transactions?` · ${Math.min(100,progress.saved/progress.transactions*100).toFixed(1)}%`:''}</span>
    {progress.phase==='error'&&<div className="section-heading"><span role="status" className="small negative">{progress.message}</span>{onRetry&&<button type="button" className="governance-vote-secondary" onClick={onRetry}>Retry upload</button>}</div>}
  </div>;
}
