export function assetImageUrl(value:unknown):string|null{
  const text=Array.isArray(value)&&value.every(part=>typeof part==='string')?value.join(''):typeof value==='string'?value:'';
  const source=text.trim();
  if(!source)return null;
  if(source.startsWith('ipfs://')){
    const path=source.slice(7).replace(/^ipfs\//,'');
    if(!/^[a-zA-Z0-9]+(?:\/[^?#]*)?$/.test(path))return null;
    return `https://ipfs.io/ipfs/${path}`;
  }
  try{const url=new URL(source);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
