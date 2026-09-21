export function acceptRenewedSession(storage:Pick<Storage,'getItem'|'setItem'>,sentToken:string,renewedToken:string|null){
  if(!sentToken||!renewedToken)return;
  // Logout and newer logins/renewals win over a late response.
  for(const role of ['delegator','admin']){
    const key='tdsp-raffle-session-'+role;
    if(storage.getItem(key)===sentToken)storage.setItem(key,renewedToken);
  }
}
