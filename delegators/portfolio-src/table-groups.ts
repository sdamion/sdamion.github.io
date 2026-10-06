export function tableGroups<T>(rows:T[],keyOf:(row:T)=>string|null,minSize=1):{key:string;rows:T[]}[]{
  const groups=new Map<string,T[]>();
  for(const row of rows){
    const key=keyOf(row);
    if(key===null)continue;
    const members=groups.get(key)||[];
    members.push(row);groups.set(key,members);
  }
  return [...groups].filter(([,members])=>members.length>=minSize).map(([key,rows])=>({key,rows}));
}
