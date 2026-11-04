import {useState} from 'react';
import {Input,Table,TableBody,TableCell,TableHead,TableHeader,TableRow} from './ui';
import {usePortfolioText} from './use-portfolio-text';

export type AssetIssue={id:string;name:string;network:string;missingPrice:boolean;missingCost:boolean;missingDecimals:boolean;missingBalance?:boolean;editablePrice?:boolean;editableCost?:boolean;excluded:boolean;details:boolean};
type Setting='price'|'average'|'decimals';
type Action=Setting|'details'|'addresses'|'transactions'|'flows'|'include';

export function AssetIssues({issues,settings,scanIncomplete,scanErrors=[],missingTransfers,busy,onSetting,onDetails,onAddresses,onTransactions,onFlows,onInclude,onRefresh,onRefreshPurchases}:{
  issues:AssetIssue[];settings:Record<string,{price?:string;average?:string;decimals?:string}>;scanIncomplete:boolean;scanErrors?:{wallet:string;message:string}[];missingTransfers:number;busy:boolean;
  onSetting:(id:string,field:Setting,value:string)=>void;onDetails:(id:string)=>void;onAddresses:()=>void;onTransactions:()=>void;onFlows:()=>void;onInclude:(id:string)=>void;onRefresh:()=>void;onRefreshPurchases?:()=>void;
}){
  const t=usePortfolioText(),[actions,setActions]=useState<Record<string,Action|''>>({});
  return <section className="portfolio-section">
    <div className="section-heading"><button type="button" className="governance-vote-secondary" disabled={busy} onClick={onRefresh}>{t('Refresh owned assets')}</button>{onRefreshPurchases&&issues.some(issue=>issue.missingCost)&&<button type="button" className="governance-vote-secondary" disabled={busy} onClick={onRefreshPurchases}>{t('Refresh all purchase data')}</button>}</div>
    {scanIncomplete&&<p role="status" className="small muted">{t('Partial asset coverage. Refresh to check every saved wallet.')}</p>}
    {scanErrors.map((error,index)=><p key={error.wallet+':'+index} role="alert" className="small negative" translate="no">{error.wallet&&<strong>{error.wallet}: </strong>}{t(error.message)}</p>)}
    {missingTransfers>0&&<p role="status" className="small muted">{t('{count} transfers have no historical USD price.',{count:missingTransfers})}</p>}
    <p className="small muted">{t('IN/OUT is determined by saved address roles. Manual prices and costs are local estimates; blockchain amounts are unchanged.')}</p>
    {issues.length?<Table variant="standard"><TableHeader><TableRow><TableHead>{t('Asset')}</TableHead><TableHead>{t('Network')}</TableHead><TableHead>{t('Missing data')}</TableHead><TableHead>{t('Actions')}</TableHead></TableRow></TableHeader><TableBody>
      {issues.map(issue=>{
        const action=actions[issue.id]||'';
        return <TableRow key={issue.id} data-asset-issue={issue.id}>
          <TableCell translate="no">{issue.name}</TableCell><TableCell translate="no">{issue.network}</TableCell>
          <TableCell>{[issue.missingBalance&&t('Wallet balance'),issue.missingDecimals&&t('Token decimals'),issue.missingPrice&&t('Current price'),issue.missingCost&&t('Purchase cost'),issue.excluded&&t('Excluded')].filter(Boolean).join(' · ')}</TableCell>
          <TableCell><label>{t('Actions')}<select aria-label={t('Actions for {name}',{name:issue.name})} value={action} onChange={event=>{
            const next=event.target.value as Action;
            setActions(previous=>({...previous,[issue.id]:next==='price'||next==='average'||next==='decimals'?next:''}));
            if(next==='details')onDetails(issue.id);
            if(next==='addresses')onAddresses();
            if(next==='transactions')onTransactions();
            if(next==='flows')onFlows();
            if(next==='include')onInclude(issue.id);
          }}>
            <option value="">{t('Choose action')}</option>
            {issue.editablePrice!==false&&<option value="price">{t('Set current price')}</option>}
            {issue.editableCost!==false&&<option value="average">{t('Set average buy price')}</option>}
            {(issue.missingDecimals||issue.details&&issue.id!=='lovelace')&&<option value="decimals">{t('Set token decimals')}</option>}
            {issue.details&&<option value="details">{t('Open asset details')}</option>}
            <option value="addresses">{t('Review IN/OUT addresses')}</option>
            <option value="flows">{t('Review IN/OUT transactions')}</option>
            <option value="transactions">{t('Review transactions')}</option>
            {issue.excluded&&<option value="include">{t('Include in totals')}</option>}
          </select></label>
          {(action==='price'||action==='average'||action==='decimals')&&<Input aria-label={t(action==='price'?'Current USD price for {name}':action==='average'?'Average buy price in USD for {name}':'Token decimals for {name}',{name:issue.name})} type="number" min="0" max={action==='decimals'?'30':undefined} step={action==='decimals'?'1':'any'} value={settings[issue.id]?.[action]||''} onChange={event=>onSetting(issue.id,action,event.target.value)} placeholder={action==='decimals'?t('Required to calculate value'):undefined}/>}
          </TableCell>
        </TableRow>;
      })}
    </TableBody></Table>:<p className="empty">{t('No missing asset data in loaded wallets.')}</p>}
  </section>;
}
