import type {AddressInfo,Fact,Market,Tx} from './core';
import {cachedSnapshot,cacheSnapshot,latestMemberSnapshot} from './vault';
export type Snapshot={infos:AddressInfo[];txs:Tx[];facts:Record<string,Fact>;markets:Record<string,Market>;adaUsd:number|null;history:Record<string,number>;updated:string;complete:boolean;priceAt:string|null;groups?:Record<string,string[]>;pendingOwnershipAddresses?:string[]};
export async function readCache(key:string):Promise<Snapshot|null>{return cachedSnapshot(key);}
export async function readRefreshCache(key:string):Promise<Snapshot|null>{return latestMemberSnapshot(key);}
export async function saveCache(key:string,data:Snapshot){await cacheSnapshot(key,data);}
