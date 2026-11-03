import {assetIsFt,assetQuantity,type OwnedAsset} from './owned-assets.ts';

type AssetWithWallets=OwnedAsset&{wallets:string[];addresses:string[]};
type PriceSettings=Record<string,{price?:string;average?:string;excluded?:boolean}>;
const entered=(value?:string)=>{
  if(!value?.trim())return null;
  const number=Number(value);
  return Number.isFinite(number)&&number>=0?number:null;
};

export function externalFtHoldings(assets:AssetWithWallets[],settings:PriceSettings){
  return assets.filter(asset=>assetIsFt(asset)&&asset.standard!=='Native').map(asset=>{
    const quantity=assetQuantity(asset),amount=Number(quantity),price=entered(settings[asset.id]?.price),average=entered(settings[asset.id]?.average);
    const value=price!==null&&Number.isFinite(amount*price)?amount*price:null;
    const cost=average!==null&&Number.isFinite(amount*average)?amount*average:null;
    return {...asset,quantity,price,average,value,cost,pnl:value!==null&&cost!==null?value-cost:null,excluded:settings[asset.id]?.excluded===true};
  });
}
