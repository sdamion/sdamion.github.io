import assert from 'node:assert/strict';
import {loadPriceSettings} from './price-settings.ts';
const data=new Map<string,string>([
 ['tdsp-member-basis:member::old',JSON.stringify({token:{average:'12',price:'20'},other:{average:'5'}})],
 ['tdsp-member-basis:member::current',JSON.stringify({token:{average:'15'}})],
 ['tdsp-member-basis:someone-else::old',JSON.stringify({token:{average:'999'}})]
]);
const storage={getItem:(key:string)=>data.get(key)??null,setItem:(key:string,value:string)=>{data.set(key,value);},keys:()=>[...data.keys()]};
const migrated=loadPriceSettings(storage,'member','member::current');
assert.deepEqual(migrated,{token:{average:'15',price:'20'},other:{average:'5'}});
assert.deepEqual(loadPriceSettings(storage,'member','member::new-wallet'),migrated);
data.set('tdsp-member-basis:member',JSON.stringify({token:{average:'',price:'0'}}));
assert.deepEqual(loadPriceSettings(storage,'member','member::old'),{token:{average:'',price:'0'}},'cleared values and zero are not overwritten by legacy prices');
assert.ok(data.has('tdsp-member-basis:member::old'),'legacy values remain recoverable');
console.log('PASS: price settings survive wallet changes; migration, member isolation and explicit clearing');
