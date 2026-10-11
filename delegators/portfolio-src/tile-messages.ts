export type TileMessage={text:string;error?:boolean};

export function uniqueTileMessages(messages:TileMessage[]):TileMessage[]{
  const unique=new Map<string,TileMessage>();
  for(const message of messages){
    const text=message.text.trim();
    if(!text)continue;
    const previous=unique.get(text);
    unique.set(text,{text,error:previous?.error||message.error||false});
  }
  return [...unique.values()];
}
