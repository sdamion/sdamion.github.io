import {rewardSourceHelp,rewardSourceLabel} from './reward-sources';
import {usePortfolioText} from './use-portfolio-text';

export function RewardSourceCheckbox({name,checked,onChange}:{name:string;checked:boolean;onChange:(checked:boolean)=>void}){
  const t=usePortfolioText();
  return <input type="checkbox" checked={checked} aria-label={t(rewardSourceLabel,{name})} title={t(rewardSourceHelp)} onChange={event=>onChange(event.target.checked)}/>;
}
