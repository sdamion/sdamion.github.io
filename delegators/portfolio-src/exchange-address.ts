import {base58} from '@scure/base';
import {decode,Tagged} from 'cborg';
import CRC32 from 'crc-32';
import {validWalletAddress} from './member.ts';

export function normalizeExchangeAddress(value:string){
  const address=value.trim();
  return /^(addr1|stake1)/i.test(address)?address.toLowerCase():address;
}

export function validByronAddress(address:string):boolean{
  if(address.length<40||address.length>200||!/^[1-9A-HJ-NP-Za-km-z]+$/.test(address))return false;
  try{
    const outer=decode(base58.decode(address),{useMaps:true,tags:Tagged.preserve(24)});
    if(!Array.isArray(outer)||outer.length!==2||!(outer[0] instanceof Tagged)||outer[0].tag!==24)return false;
    const payload=outer[0].value;
    if(!(payload instanceof Uint8Array)||!Number.isInteger(outer[1])||(CRC32.buf(payload)>>>0)!==outer[1])return false;
    const body=decode(payload,{useMaps:true});
    if(!Array.isArray(body)||body.length!==3||!(body[0] instanceof Uint8Array)||body[0].length!==28||!(body[1] instanceof Map)||![0,2].includes(body[2]))return false;
    for(const [key,value] of body[1])if(!Number.isInteger(key)||key<0||key>255||!(value instanceof Uint8Array))return false;
    // Mainnet normally omits the network discriminant.
    return !body[1].has(2)||decode(body[1].get(2))===764824073;
  }catch{return false;}
}

export const validExchangeAddress=(address:string)=>validWalletAddress(address)||validByronAddress(address);
