export function assetImageCandidates(id:string,metadata:unknown[]=[]):string[]{
  const urls=metadata.map(assetImageUrl).filter((url):url is string=>url!==null).flatMap(url=>url.startsWith('https://ipfs.io/ipfs/')?[url,url.replace('https://ipfs.io/ipfs/','https://dweb.link/ipfs/')]:[url]);
  if(id==='lovelace')urls.push('/cardano_logo_ico.webp');
  else if(/^[a-f0-9]{56}(?:[a-f0-9]{2}){0,32}$/.test(id))urls.push(`https://asset-logos.minswap.org/${id}`);
  return [...new Set(urls)];
}

export function assetImageUrl(value:unknown):string|null{
  const text=Array.isArray(value)&&value.every(part=>typeof part==='string')?value.join(''):typeof value==='string'?value:'';
  const source=text.trim();
  if(!source)return null;
  if(/^\/api\/portfolio\/images\/[a-f0-9]{64}\.(png|jpg|gif|webp)$/.test(source))return `https://api.tdsp.online${source}`;
  if(source.startsWith('ipfs://')){
    const path=source.slice(7).replace(/^ipfs\//,'');
    if(!/^[a-zA-Z0-9]+(?:\/[^?#]*)?$/.test(path))return null;
    return `https://ipfs.io/ipfs/${path}`;
  }
  try{const url=new URL(source);return url.protocol==='https:'&&!url.username&&!url.password?url.href:null;}catch{return null;}
}
