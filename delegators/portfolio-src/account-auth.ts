import {apiBase} from './transport';
export const ACCOUNT_SESSION_KEY='tdsp-portfolio-session';
export {isAccountOwner} from './identity';
const text=new TextEncoder();
const encode=(value:ArrayBuffer|Uint8Array)=>btoa(String.fromCharCode(...new Uint8Array(value instanceof Uint8Array?value.buffer.slice(value.byteOffset,value.byteOffset+value.byteLength):value))).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');
const decode=(value:string)=>Uint8Array.from(atob(value.replaceAll('-','+').replaceAll('_','/')),char=>char.charCodeAt(0));
const prfSalt=text.encode('TDSP Portfolio passkey encryption v1');
let unlocked:{member:string;key:CryptoKey;credential:string}|null=null;
let generation=0;
export function clearAccountKey(){generation++;unlocked=null;}
export function hasAccountKey(member?:string){return !!unlocked&&(!member||unlocked.member===member);}
export function accountKey(member:string){if(unlocked?.member!==member)throw new Error('Approve your passkey to unlock Portfolio.');return unlocked.key;}
export async function authRequest(path:string,body?:unknown,token=sessionStorage.getItem(ACCOUNT_SESSION_KEY)||'',signal?:AbortSignal){
  const response=await fetch(`${apiBase}/auth/${path}`,{method:body===undefined?'GET':'POST',cache:'no-store',headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:signal?AbortSignal.any([signal,AbortSignal.timeout(30000)]):AbortSignal.timeout(30000)});
  const data=await response.json();if(!response.ok)throw Object.assign(new Error(data.error||'Portfolio sign-in failed.'),{status:response.status});return data;
}
function supported(){if(!window.isSecureContext||!window.PublicKeyCredential||!navigator.credentials)throw new Error('Use an HTTPS browser with passkey support. Wallet login remains available.');}
function serialise(credential:PublicKeyCredential){
  const response=credential.response as AuthenticatorAssertionResponse&AuthenticatorAttestationResponse;
  // PRF output is private encryption material: never send getClientExtensionResults() to the server.
  return {id:credential.id,rawId:encode(credential.rawId),type:credential.type,authenticatorAttachment:credential.authenticatorAttachment,clientExtensionResults:{},response:{clientDataJSON:encode(response.clientDataJSON),...(response.attestationObject?{attestationObject:encode(response.attestationObject),transports:response.getTransports?.()||[]}:{}),...(response.authenticatorData?{authenticatorData:encode(response.authenticatorData),signature:encode(response.signature),userHandle:response.userHandle?encode(response.userHandle):null}:{})}};
}
export async function registerPasskey(token='',signal?:AbortSignal){
  supported();const request=await authRequest('passkeys/register/options',{},token,signal),options=request.options;
  const credential=await navigator.credentials.create({publicKey:{...options,challenge:decode(options.challenge),user:{...options.user,id:decode(options.user.id)},excludeCredentials:options.excludeCredentials?.map((row:any)=>({...row,id:decode(row.id)})),extensions:{prf:{}}},signal} as CredentialCreationOptions) as PublicKeyCredential|null;
  if(!credential)throw new Error('Passkey creation cancelled.');
  const extensions=credential.getClientExtensionResults() as {prf?:{enabled?:boolean}};
  if(!extensions.prf?.enabled)throw new Error('This passkey cannot encrypt Portfolio data. Choose a passkey provider with PRF support, or use wallet login.');
  const enrollment=await authRequest('passkeys/register/verify',{id:request.id,response:serialise(credential)},token,signal);
  return {credentialID:credential.id,token:enrollment.token||token};
}
export async function authenticatePasskey(token='',credentialID?:string,signal?:AbortSignal,{save=true}={}){
  supported();const attempt=generation;
  const request=await authRequest('passkeys/login/options',{credential_id:credentialID},token,signal),options=request.options;
  const credential=await navigator.credentials.get({publicKey:{...options,challenge:decode(options.challenge),allowCredentials:options.allowCredentials?.map((row:any)=>({...row,id:decode(row.id)})),extensions:{prf:{eval:{first:prfSalt}}}},signal} as CredentialRequestOptions) as PublicKeyCredential|null;
  if(!credential)throw new Error('Passkey sign-in cancelled.');
  const extensions=credential.getClientExtensionResults() as {prf?:{results?:{first?:ArrayBuffer}}};
  const raw=extensions.prf?.results?.first;
  if(!raw||raw.byteLength!==32)throw new Error('This passkey cannot unlock encrypted Portfolio data. Use the original synced passkey or wallet login.');
  try{
    const material=await crypto.subtle.importKey('raw',raw,'HKDF',false,['deriveKey']);
    const session=await authRequest('passkeys/login/verify',{id:request.id,response:serialise(credential)},token,signal);
    const key=await crypto.subtle.deriveKey({name:'HKDF',hash:'SHA-256',salt:prfSalt,info:text.encode(session.member_id)},material,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
    if(attempt!==generation||signal?.aborted)throw new Error('Portfolio sign-in cancelled.');
    if(save){sessionStorage.setItem(ACCOUNT_SESSION_KEY,session.token);unlocked={member:session.member_id,key,credential:credential.id};}
    return {...session,key};
  }finally{new Uint8Array(raw).fill(0);}
}
export async function signOutAccount(){
  const token=sessionStorage.getItem(ACCOUNT_SESSION_KEY)||'';
  clearAccountKey();sessionStorage.removeItem(ACCOUNT_SESSION_KEY);
  window.dispatchEvent(new Event('tdsp:portfolio-session-expired'));
  if(token)await authRequest('logout',{},token);
}
