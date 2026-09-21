import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const i18n=read('shared/i18n.js');
const translate=i18n.slice(i18n.indexOf('    function translateAutoElement('),i18n.indexOf('    function translatePlaceholderElement('));

test('Portfolio metrics update their translation source with every value and label',()=>{
    const app=read('delegators/portfolio-src/App.tsx');
    const metric=app.slice(app.indexOf('function Metric('),app.indexOf('function Transaction('));
    assert.match(metric, /<strong data-i18n-auto-original=\{value\}/);
    assert.match(metric, /className="governance-card-detail" data-i18n-auto-original=\{label\}/);
});

test('completed metrics survive repeated translation passes in every language',()=>{
    class Element {
        children=[];
        attrs={};
        textContent='';
        hasAttribute(name){return Object.hasOwn(this.attrs,name);}
        setAttribute(name,value){this.attrs[name]=value;}
        getAttribute(name){return this.attrs[name]??null;}
    }
    for(const language of ['en','nl','ja','es']){
        const context=vm.createContext({HTMLElement:Element,TRANSLATION_ATTR:'data-i18n',AUTO_TRANSLATION_ORIGINAL_ATTR:'data-i18n-auto-original',activeLanguage:language,DEFAULT_LANGUAGE:'en',getAutoTranslationValue:()=>''});
        vm.runInContext(translate,context);
        for(const value of ['+$4,892.12','56.2 ₳','-$8,203.45']){
            const node=new Element();
            node.textContent='Waiting for transaction details';
            context.translateAutoElement(node);
            node.textContent=value;
            node.setAttribute('data-i18n-auto-original',value);
            for(let pass=0;pass<3;pass++)context.translateAutoElement(node);
            assert.equal(node.textContent,value);
        }
    }
});
