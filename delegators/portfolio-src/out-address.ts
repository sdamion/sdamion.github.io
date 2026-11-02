export type OutAddress={out?:boolean;miner?:boolean};

// Missing flags retain the role of previously saved counterparties.
export const isOutAddress=(address:OutAddress)=>address.out!==false&&address.miner!==true;
