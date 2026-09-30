export function cardanoRequestContext(path:string,body:object,range?:string):string{
  const fields=body as Record<string,unknown>;
  const key=path==='tx_info'?'_tx_hashes':path==='account_addresses'?'_stake_addresses':'_addresses';
  const count=Array.isArray(fields[key])?fields[key].length:0;
  const unit=path==='tx_info'?'transactions':path==='account_addresses'?'stake addresses':'wallet addresses';
  return `/${path} (${count} ${unit}${range?`, rows ${range}`:''})`;
}
