export type OutAddress={out?:boolean;in?:boolean;miner?:boolean};

// Missing flags retain the role of previously saved counterparties.
export const isOutAddress=(address:OutAddress)=>address.out!==false&&address.miner!==true;
export const isInAddress=(address:OutAddress)=>address.in!==false&&address.miner!==true;
