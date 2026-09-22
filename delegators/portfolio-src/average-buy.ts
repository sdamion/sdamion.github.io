export function averageBuy(cost:number|null,quantity:number|null){
  return cost!==null&&Number.isFinite(cost)&&quantity!==null&&Number.isFinite(quantity)&&quantity>0?cost/quantity:null;
}
