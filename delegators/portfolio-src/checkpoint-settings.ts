export const SETTING_CHUNK_THRESHOLD=256*1024;
const PART_CHARACTERS=4*1024*1024;

// Split opaque settings, regardless of chain or token; encryption stays in the vault.
export function chunkSettings(settings:Record<string,string>){
  const small:Record<string,string>={},parts:Record<string,string[]>={},chunks=new Map<string,string>();
  for(const [key,value] of Object.entries(settings)){
    if(value.length<=SETTING_CHUNK_THRESHOLD){small[key]=value;continue;}
    parts[key]=[];
    for(let offset=0;offset<value.length;offset+=PART_CHARACTERS){
      const bucket=`setting:${key}:${offset/PART_CHARACTERS}`;
      parts[key].push(bucket);chunks.set(bucket,value.slice(offset,offset+PART_CHARACTERS));
    }
  }
  return {settings:small,parts,chunks};
}

export function restoreSettings(settings:Record<string,string>,parts:Record<string,string[]>,chunks:Map<string,string>){
  const restored={...settings},used=new Set<string>();
  for(const [key,buckets] of Object.entries(parts)){
    if(Object.hasOwn(restored,key)||!Array.isArray(buckets)||!buckets.length)throw new Error('Portfolio checkpoint integrity check failed.');
    const values=buckets.map(bucket=>{
      if(typeof bucket!=='string'||used.has(bucket)||!chunks.has(bucket))throw new Error('Portfolio checkpoint integrity check failed.');
      used.add(bucket);return chunks.get(bucket)!;
    });
    Object.defineProperty(restored,key,{value:values.join(''),enumerable:true,writable:true,configurable:true});
  }
  if(used.size!==chunks.size)throw new Error('Portfolio checkpoint integrity check failed.');
  return restored;
}
