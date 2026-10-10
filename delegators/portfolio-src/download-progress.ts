export type DownloadProgress={downloaded:number;total:number|null};
export const emptyDownloadProgress=():DownloadProgress=>({downloaded:0,total:null});
export function downloadProgressValues(progress:DownloadProgress){
  return {done:progress.downloaded.toLocaleString('en-US'),total:progress.total===null?'?':progress.total.toLocaleString('en-US')};
}
