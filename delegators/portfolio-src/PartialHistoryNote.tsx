import {usePortfolioText} from './use-portfolio-text';

export function PartialHistoryNote({excluded=false}:{excluded?:boolean}){
  const t=usePortfolioText();
  return <div className="small muted" translate="no">{t('Partial history')}{excluded&&<> · {t('Excluded from calculations')}</>}</div>;
}
