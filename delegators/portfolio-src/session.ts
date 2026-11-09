export function acceptRenewedSession(storage:Pick<Storage,'getItem'|'setItem'>,sentToken:string,renewedToken:string|null){
  if(!sentToken||!renewedToken)return;
  // Logout and newer logins/renewals win over a late response.
  for(const key of ['tdsp-portfolio-session','tdsp-raffle-session-delegator','tdsp-raffle-session-admin']){
    if(storage.getItem(key)===sentToken)storage.setItem(key,renewedToken);
  }
}
