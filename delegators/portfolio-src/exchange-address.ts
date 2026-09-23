import {validWalletAddress} from './member.ts';
import {validByronAddress} from './byron-address.ts';
export {validByronAddress} from './byron-address.ts';

export function normalizeExchangeAddress(value:string){
  const address=value.trim();
  return /^(addr1|stake1)/i.test(address)?address.toLowerCase():address;
}

export const validExchangeAddress=(address:string)=>validWalletAddress(address)||validByronAddress(address);
