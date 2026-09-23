export type UploadProgress={phase:'idle'|'preparing'|'uploading'|'confirming'|'saved'|'error';loaded:number;total:number;saved:number;transactions:number;message:string};
let current:UploadProgress={phase:'idle',loaded:0,total:0,saved:0,transactions:0,message:''};
export const getUploadProgress=()=>current;
export function setUploadProgress(next:Partial<UploadProgress>){current={...current,...next};window.dispatchEvent(new Event('tdsp:portfolio-upload-progress'));}
export function resetUploadProgress(){setUploadProgress({phase:'idle',loaded:0,total:0,saved:0,transactions:0,message:''});}
