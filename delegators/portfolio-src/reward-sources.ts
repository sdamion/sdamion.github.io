export type RewardSource={address:string;miner?:boolean};
export const rewardSourceTitle='Mining / Services Sources';
export const rewardSourceLabel='Mining / services source: {name}';
export const rewardSourceHelp='Receipts from this address have zero purchase cost and are not CEX purchases or sales. Own-wallet transfers are excluded.';

// Adapters supply chain-correct addresses; never lowercase case-sensitive chains.
export function isRewardSource(address:string,sources:RewardSource[]):boolean{
  return sources.some(source=>source.address===address&&source.miner===true);
}
export function isRewardReceipt(inputs:{address:string;stakeAddress?:string|null}[],sources:RewardSource[]):boolean{
  return inputs.length>0&&inputs.every(input=>isRewardSource(input.address,sources)||!!input.stakeAddress&&isRewardSource(input.stakeAddress,sources));
}
