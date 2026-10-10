import {useEffect,useState} from 'react';
import {getUploadProgress} from './upload-progress';

export function CacheUploadProgress({onRetry}:{onRetry?:()=>void}){
  const [progress,setProgress]=useState(getUploadProgress);
  useEffect(()=>{const update=()=>setProgress(getUploadProgress());window.addEventListener('tdsp:portfolio-upload-progress',update);update();return()=>window.removeEventListener('tdsp:portfolio-upload-progress',update);},[]);
  if(progress.phase!=='error')return null;
  return <div className="portfolio-section" aria-live="polite">
    {progress.phase==='error'&&<div className="section-heading"><span role="status" className="small negative">{progress.message}</span>{onRetry&&<button type="button" className="governance-vote-secondary" onClick={onRetry}>Retry upload</button>}</div>}
  </div>;
}
