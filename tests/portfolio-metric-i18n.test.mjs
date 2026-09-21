import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const i18n=read('shared/i18n.js');
const translate=i18n.slice(i18n.indexOf('    function translateAutoElement('),i18n.indexOf('    function translatePlaceholderElement('));

test('Portfolio live values are owned by React and labels update their translation source',()=>{
    const app=read('delegators/portfolio-src/App.tsx');
    const metric=app.slice(app.indexOf('function Metric('),app.indexOf('function Transaction('));
    assert.match(metric, /<strong translate="no"/);
    assert.match(metric, /className="governance-card-detail" data-i18n-auto-original=\{label\}/);
});

test('translator never replaces React-owned text nodes, even during the initial waiting state',()=>{
    class Element {
        children=[];
        textContent='Waiting for transaction details';
        closest(){return this;}
        hasAttribute(){return false;}
        setAttribute(){assert.fail('must not cache React-owned text');}
    }
    const context=vm.createContext({HTMLElement:Element});
    vm.runInContext(translate,context);
    const node=new Element();
    context.translateAutoElement(node);
    node.textContent='$4,892.12';
    context.translateAutoElement(node);
    assert.equal(node.textContent,'$4,892.12');
    assert.match(i18n,/parent\?\.closest\?\.\('\[translate="no"\]'\)/);
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
