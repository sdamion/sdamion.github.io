// Dictionary encoding shares field names, hashes and addresses within each block.
export function stringDictionary(){
  const strings:string[]=[],indices=new Map<string,number>();
  return {strings,index(value:string){let id=indices.get(value);if(id===undefined){id=strings.length;indices.set(value,id);strings.push(value);}return id;}};
}
export function compactBlock(value:unknown){
  const {strings,index}=stringDictionary();
  function encode(value:any):any{
    if(typeof value==='string')return {s:index(value)};
    if(Array.isArray(value))return {a:value.map(item=>encode(item??null))};
    if(value&&typeof value==='object')return {o:Object.entries(value).filter(([,item])=>item!==undefined).map(([key,item])=>[index(key),encode(item)])};
    return value;
  }
  const content=encode(value);
  return {compactVersion:1,strings,content};
}
export function expandBlock(value:any):any{
  if(value?.compactVersion!==1)return value;
  if(!Array.isArray(value.strings)||!value.strings.every((item:unknown)=>typeof item==='string'))throw new Error('Invalid compact Portfolio cache.');
  const string=(id:number)=>{if(!Number.isSafeInteger(id)||id<0||id>=value.strings.length)throw new Error('Invalid compact Portfolio cache.');return value.strings[id];};
  function decode(item:any):any{
    if(item===null||typeof item!=='object')return item;
    if(Object.keys(item).length!==1)throw new Error('Invalid compact Portfolio cache.');
    if(Object.hasOwn(item,'s'))return string(item.s);
    if(Array.isArray(item.a))return item.a.map(decode);
    if(Array.isArray(item.o)){
      const result:Record<string,unknown>={};
      for(const entry of item.o){
        if(!Array.isArray(entry)||entry.length!==2)throw new Error('Invalid compact Portfolio cache.');
        const key=string(entry[0]);
        if(Object.hasOwn(result,key))throw new Error('Invalid compact Portfolio cache.');
        Object.defineProperty(result,key,{value:decode(entry[1]),enumerable:true,writable:true,configurable:true});
      }
      return result;
    }
    throw new Error('Invalid compact Portfolio cache.');
  }
  return decode(value.content);
}
export const CACHE_RECORDS_PER_PART=10000;
