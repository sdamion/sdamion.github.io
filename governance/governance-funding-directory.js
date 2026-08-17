(function () {
    function createFundingDirectory() {
        const TREASURY_BUSINESS_ALIASES = Object.freeze({
            'abailly <arnaud@pankzsoft.com>': 'Amaru',
            ktorz: 'Amaru',
            'yoram ben-zvi (elk gmbh)': '5 AM Earth Foundation',
            'arouet holdings, director n.m.': 'Draper Dragon',
            'chris gianelloni': 'Blink Labs',
            'aurora gaffney': 'Blink Labs',
            dingo: 'Blink Labs',
            'ryan jones': 'NEWM',
            damon: 'CHARLI3',
            'patrick tobler': 'NMKR',
            'kristian.portz': 'NMKR',
            'federico weill': 'TxPipe',
            'vladimir sinyakov': 'zkFold',
            'dan gonzalez': 'SundaeSwap',
            'artem wright': 'SundaeSwap',
            'evan fischer': 'Rare Network',
            'ethan | optim': 'Optim',
            'seira yun': 'Socious.io',
            'seira yun socious.io': 'Socious.io',
            'socious team': 'Socious.io',
            'darlington wleh': 'Lido Nation',
            'donbosco otunga': 'Lido Nation',
            '$conrad': 'ADA Handle',
            '$conrad ada handle': 'ADA Handle',
            'chris joannou': 'Draper Dragon',
            'michele nuzzi': 'Harmonic Labs',
            hlabs: 'Harmonic Labs',
            'glen jordan': 'Empowa',
            strica: 'Cardanoscan',
            'robert hever': 'CHARLI3',
            'wes parkinson': 'Rare Network',
            'matteo coppola': 'FluidTokens',
            christian: 'Orcfax',
            'janis aguilar': 'CV Labs',
            'sheldon hunt': 'Sundial',
            'philip disarro': 'Anastasia Labs',
            philipdisarro: 'Anastasia Labs',
            'pritesh gosai': 'Kaizen Crypto',
            'matthew plomin': 'Mehen (Matthew Plomin)',
            'teo petricevic': 'Emurgo',
            cardano2vn: 'Atala Prism',
            'sebastian pabon': 'Gimbalabs',
            'maarten menheere': 'GameChanger',
            'gamechanger finance - adriano fiorenza': 'GameChanger Finance',
            'catalyst rider': 'WingRiders',
            'drip dropz': 'Drip Dropz',
            dripdropz: 'Drip Dropz',
            'adam dean': 'Drip Dropz',
            'adam dean - drip dropz': 'Drip Dropz',
            josef: 'Cexplorer',
            'marcel - eternl.io': 'Eternl',
            andrewwestberg: 'NEWM',
            'newm foundation': 'NEWM',
            'gimbalabs team': 'Gimbalabs',
            'gimbalabs hk': 'Gimbalabs',
            'gimbalabs official': 'Gimbalabs',
            'muesliswap team': 'MuesliSwap',
            'michal.petro': 'NuFi',
            'maestro team': 'Maestro',
            'otavio (cardano feed)': 'Cardano Feed',
            taptools: 'Taptools',
            taptool: 'Taptools',
            cexplorer: 'Cexplorer',
            eryx: 'Eryx',
            intersect: 'Intersect Treasury Reserve Smart Contract',
            builderdao: 'Builder Dao',
            cardanofoundation: 'Cardano Foundation',
            'catalyst team': 'Catalyst Team',
            anzens: 'Anzens - USDA',
            dcspark: 'dcSpark',
            'snek foundation': 'Snek Foundation',
            'snek labs': 'Snek Foundation',
            'iagon team': 'Iagon',
            'atrium lab inc': 'Atrium Lab Inc',
            'atrium lab inc.': 'Atrium Lab Inc',
            'blocktrust (atala prism)': 'Atala Prism',
            'björn sandmann': 'Atala Prism',
            jschreiner22: 'Snapbrillia',
            'chadle (bbhmm)': 'zenGate Global',
            'emily martins': 'Liqwid Labs',
            'michal porubsky': 'Vacuumlabs',
            'michael yagi': 'MLabs',
            'opshinlanguage lang': 'Opshin',
            'piotr godzinski': 'Techstars',
            'shay gamer': 'Hash Point - Shay Gammer',
            'cody butz': 'Indigo Labs',
            'alke gijrath': 'Empowa Project',
            'alex sierkov': 'Daedalus Turbo - Alex Sierkov',
            'adrian minswap': 'Minswap Labs',
            'ahmed amer': 'EMURGO',
            'rahul konudula': 'Trivolve Tech',
            'ashish cardanoscan': 'Cardanoscan',
            'gabriela guerra': 'Wolfram Blockchain Labs',
            'clark alesna': 'SAIB Inc',
            'dj bodden': 'STORM Partners',
            'andré vanyi-robin': 'Nozama Tech',
            'alex chalmers': 'Stadia Ventures',
            'dor garbash': 'Catalyst Team',
            'alexander nemish': 'Scalus',
            'nils helset': 'DigiFarm',
            darrello: 'zenGate Global',
            'daniel.friedman': 'zenGate Global',
            'rosen bridge': 'zenGate Global'
        });

        const CATALYST_TEAM_MEMBER_DISPLAY_ALIASES = Object.freeze({
            'abrahamkakooza': 'Abraham Kakooza',
            'abezawodni': 'Abezaw Odni',
            'afrocharts': 'Afro Charts',
            'alexander.cimpeanu': 'Alexander Cimpeanu',
            'allisonfromm': 'Allison Fromm',
            'altimario': 'Alti Mario',
            'attstar-jh': 'Att Star-JH',
            'attstar-jp': 'Att Star-JP',
            'berkatalay': 'Berk Atalay',
            'bezawitshewarega': 'Bezawit Shewarega',
            'bigirishlion': 'Big Irish Lion',
            'chrisasia': 'Chris Asia',
            'christinemohan': 'Christine Mohan',
            'daniel.friedman': 'Daniel Friedman',
            'elraulito': 'El Raulito',
            'frankalbanese': 'Frank Albanese',
            'gurcancitil': 'Gurcan Citil',
            'henrik.metsamaki': 'Henrik Metsamaki',
            'itsdave_ada': 'Its Dave_ADA',
            'jamesarthur': 'James Arthur',
            'jonas.weinberger': 'Jonas Weinberger',
            'juanitajaramillorivillas': 'Juanita Jaramillo Rivillas',
            'lloydduhon': 'Lloyd Duhon',
            'lovegrovegeorge': 'Lovegrove George',
            'makotoharada': 'Makoto Harada',
            'martinfalcone': 'Martin Falcone',
            'mearaftadewos': 'Mearaf Tadewos',
            'michal.petro': 'Michal Petro',
            'nadiahopkins': 'Nadia Hopkins',
            'nathansamson': 'Nathan Samson',
            'natdwamena': 'Nat Dwamena',
            'nicoarqueros': 'Nico Arqueros',
            'nikodemzegzda': 'Nikodem Zegzda',
            'petr.smelik': 'Petr Smelik',
            philipdisarro: 'Philip Disarro',
            'philip disarro': 'Philip Disarro',
            'rodolfo.miranda': 'Rodolfo Miranda',
            'sonia.marotta': 'Sonia Marotta',
            'thomas.ford': 'Thomas Ford',
            'viktor.rko': 'Viktor Rko'
        });

        function normalizeCatalystTeamMemberDisplayName(value) {
            const name = String(value || '').trim();
            if (!name) return '';
            return CATALYST_TEAM_MEMBER_DISPLAY_ALIASES[name.toLowerCase()] || name;
        }

        const TREASURY_BUSINESS_WEBSITES = Object.freeze({
            '5 AM Earth Foundation': 'https://5am.earth/',
            '3rd Eye Labs': 'https://www.3rdeyelabs.dev/',
            'ADA Handle': 'https://adahandle.com',
            'AdaStat.net': 'https://adastat.net',
            Amaru: 'https://amaru.global',
            'Anastasia Labs': 'https://anastasialabs.com',
            Anvil: 'https://ada-anvil.io',
            'Anvil Development Agency': 'https://ada-anvil.io',
            'Anzens - USDA': 'https://www.anzens.com/',
            'Andamio Team': 'https://www.andamio.io/',
            'Atrium Lab Inc': 'https://www.atriumlab.io',
            'Atala Prism': 'https://atalaprism.io',
            'Blink Labs': 'https://blinklabs.io',
            BloxBean: 'https://bloxbean.com',
            'Builder Dao': 'https://buildingoncardano.io',
            'Cardano Foundation': 'https://cardanofoundation.org/',
            'Cardano Feed': 'https://cardanofeed.com',
            'Cardano Pentad': [
                'https://intersectmbo.org/',
                'https://iohk.io/',
                'https://emurgo.io/',
                'https://cardanofoundation.org/',
                'https://midnight.network/'
            ],
            Cardanoscan: 'https://cardanoscan.io',
            'Catalyst Team': 'https://projectcatalyst.io/',
            CHARLI3: 'https://charli3.io',
            'Clarity Protocol': 'https://www.clarity.community/',
            Cexplorer: 'https://cexplorer.io',
            'CSWAP Systems': 'https://cswap.trade',
            'CV Labs': 'https://cvlabs.com',
            dcSpark: 'https://dcspark.io',
            DigiFarm: 'https://digifarm.io/',
            'Draper Dragon': 'https://draperdragon.com',
            'Drip Dropz': 'https://dripdropz.io',
            EMURGO: 'https://emurgo.io',
            Empowa: 'https://empowa.io',
            'Empowa Project': 'https://www.empowa.io/',
            Eryx: 'https://eryx.co/',
            Eternl: 'https://eternl.io',
            'Five Binaries': 'https://fivebinaries.com/',
            Flowdesk: 'https://flowdesk.co',
            FluidTokens: 'https://fluidtokens.com',
            GameChanger: 'https://gamechanger.finance',
            'GameChanger Finance': 'https://gamechanger.finance',
            'Genius Yield': 'https://app.geniusyield.co/',
            Gimbalabs: 'https://gimbalabs.com',
            'Harmonic Labs': 'https://hackmd.io/',
            'Indigo Labs': 'https://indigoprotocol.io/',
            'Input Output Global': 'https://iohk.io',
            Intersect: 'https://intersectmbo.org',
            IntersectMBO: 'https://intersectmbo.org',
            'Intersect Treasury Reserve Smart Contract': 'https://intersectmbo.org/',
            Iagon: 'https://iagon.com',
            'Kaizen Crypto': 'https://www.youtube.com/@KaizenCrypto',
            'Lido Nation': 'https://www.lidonation.com',
            'Liqwid Labs': 'https://liqwid.finance',
            Maestro: 'https://gomaestro.org',
            Mehen: 'https://mehen.io',
            'Mehen (Matthew Plomin)': 'https://mehen.io',
            'Minswap Labs': 'https://minswap.org/',
            MLabs: 'https://mlabs.city',
            MuesliSwap: 'https://muesliswap.com',
            NEWM: 'https://newm.io',
            NuFi: 'https://nu.fi',
            NMKR: 'https://www.nmkr.io',
            NFTCDN: 'https://nftcdn.io/',
            Nucast: 'https://www.nucast.io/',
            'Orion Fund / Arouet Holdings': 'https://draperdragon.com',
            'Mesh JS SDK': 'https://meshjs.dev/',
            Opshin: 'https://opshin.dev',
            Orcfax: 'https://orcfax.io',
            Optim: 'https://optim.finance',
            PyCardano: 'https://pycardano.readthedocs.io',
            PRAGMA: 'https://pragma.io/',
            'Rare Network': 'https://rareevo.io',
            'SAIB Inc': 'https://saib.dev',
            Scalus: 'https://scalus.org',
            'Snek Foundation': 'https://www.snek.foundation/',
            Socious: 'https://socious.io',
            'Socious.io': 'https://socious.io',
            'Stadia Ventures': 'https://stadiaventures.com',
            'STORM Partners': 'https://storm.partners/',
            Strica: 'https://strica.io',
            SundaeSwap: 'https://sundae.fi',
            Sundial: 'https://sundialprotocol.io',
            Taptools: 'https://www.taptools.io/',
            'Tastenkunst GmbH': 'https://tastenkunst.com/',
            Techstars: 'https://www.techstars.com/',
            Teragone: 'https://www.teragone-solutions.com',
            'Trivolve Tech': 'https://trivolvetech.com',
            'Wolfram Blockchain Labs': 'https://www.wolframblockchainlabs.com',
            TxPipe: 'https://txpipe.io',
            'Tweag by Modus': 'https://www.tweag.io',
            'UTxO Company / Siban Labs': 'https://sidan.io',
            Vacuumlabs: 'https://vacuumlabs.com',
            WingRiders: 'https://www.wingriders.com',
            Xerberus: 'https://xerberus.io/',
            zenGate: 'https://zengate.global',
            'zenGate Global': 'https://zengate.global',
            zkFold: 'https://zkfold.io'
        });

        const TREASURY_BUSINESS_LOGOS = Object.freeze({
            '5 AM Earth Foundation': 'https://5am.earth/logo.png',
            'Atrium Lab Inc': 'https://www.atriumlab.io/atriumlab-logo.png',
            'Cardano Foundation': 'cardano_logo_ico.webp?v=20260727-retina',
            'Five Binaries': 'https://fivebinaries.com/assets/img/logo.png',
            'Genius Yield': 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 128 128%22%3E%3Crect width=%22128%22 height=%22128%22 rx=%2228%22 fill=%22%23131b18%22/%3E%3Cpath d=%22M39 42c7-9 19-13 31-9 6 2 11 6 15 11l-12 9c-2-3-5-5-9-6-7-2-14 0-18 6-5 7-4 17 2 23 5 5 14 7 21 3 3-2 5-4 7-7H61V59h33c1 13-4 25-14 32-13 10-33 8-44-4-12-13-11-32 3-45Z%22 fill=%22%236fffe8%22/%3E%3Cpath d=%22M76 34h18l-23 36v24H55V70L32 34h19l12 21 13-21Z%22 fill=%22%23f3f8f5%22 fill-opacity=%22.9%22/%3E%3C/svg%3E',
            'Kaizen Crypto': 'kaizen-crypto-logo.jpg',
            Maestro: 'https://gomaestro.org/branding/maestro-institutional-dark.svg',
            'Orion Fund / Arouet Holdings': 'https://www.google.com/s2/favicons?domain=draperdragon.com&sz=96',
            PRAGMA: 'https://pragma.io/favicon.svg',
            'Snek Foundation': 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 207.46 196.86%22%3E%3Cpath fill=%22%2374f8d4%22 d=%22M192.79,83.38c-10.74-14.71-34.17-15.39-64.87-15.15-15.69.07-17.73.7-15.25-4.7.01-.03,4.36-9.64,6.59-14.29,3.7-7.7,7.2-14.98,8.84-20.16,2.25-7.12.55-13.95-4.54-18.27-6.2-5.26-15.92-5.56-25.31-.8-24.8,12.32-42.17,25.71-63.79,44.66-25.66,21.64-27.96,43.04-22.62,57.25,4.1,10.82,15.65,17.31,28.86,17.54,17.34-.05,34.41-.15,43.69-.22,4.56.23,6.52-.02,6.27,2.45-1.23,7.53-14.05,37.18-14.05,37.18-3.14,10.55,1.04,21.37,16.78,21.37,11.15.22,30.67-9.4,54.16-24.31,15.8-10.33,25.26-17.84,33.21-26.38,23.26-24.75,18.11-47.33,12.01-56.17ZM172.54,119.2c-10.67,13.78-31.91,27.22-62.61,41.49-5.01,2.26-4.93,1.39-3.82-1.23,5.19-12.01,13.97-33.41,14.4-41.07.37-12.56-4.4-16.37-25.44-17.54-6.55-.3-37.23.24-50.06.24-7.62-.02-12.07-3.06-13.79-7.62-.86-2.3-.8-5,.11-7.94,1.75-5.57,6.56-12.05,13.95-18.52,19.29-16.92,34.96-29.13,55.97-40.1,1.43-.76,6.22-3.15,6.99-3.46,4.18-1.71,7.43-1.87,4.56,4.36-1.63,3.81-13.5,25.62-18.2,37.87-5.95,14.61,4.15,17.1,26.26,16.55,34.3-.85,51.72,1.4,57.6,9.43,5.86,10.36-.68,20.74-5.94,27.53Z%22/%3E%3C/svg%3E',
            Taptools: 'https://www.taptools.io/images/logo_black.png'
        });

        const TREASURY_BUSINESS_LOGOS_BY_DOMAIN = Object.freeze({
            'cardanofoundation.org': 'cardano_logo_ico.webp?v=20260727-retina'
        });

        const TREASURY_BUSINESS_BY_STAKE_ADDRESS = Object.freeze({
            stake1784sdxt6jjennmstphgdu7l7c2scf5d02a6cve2dgn5s2kq5u3j9v: 'Intersect Treasury Reserve Smart Contract',
            stake17xzc8pt7fgf0lc0x7eq6z7z6puhsxmzktna7dluahrj6g6ghh5qjr: 'Intersect Treasury Reserve Smart Contract',
            stake17x2x5cv4nlwptph8kxvnyw93pp2sp54dk54dpfp2ax7fkggaj3ty4: 'UTxO Company / Siban Labs',
            stake1u92flcyspwcp92lmgs0p47vdjrrek96l07cv3v6033wddfc8h620a: 'Tastenkunst GmbH'
        });

        const TREASURY_BUSINESS_BY_ACTION_ID = Object.freeze({
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlqz6d98zp: 'Input Output Global',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlpwywvhcq: 'Input Output Global',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlzqhm6e8q: 'Input Output Global',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlqyxzxz7k: 'Input Output Global',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlpjq3z9u5: 'Rare Network',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlqudh2k4c: 'Tweag by Modus',
            gov_action1zljrlljt9cxlz7ra2nep43nxg0r54wcnrgexyuhuam9ah0ws607qq2vcg4x: 'Tweag by Modus',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlp5u7pqqr: 'Builder Dao',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlpsn5rx0e: 'Cardano Foundation',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlp730y0dn: 'Anzens - USDA',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlpcdq823y: 'Flowdesk',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlqqfgyy3v: 'Anastasia Labs',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlqwtnrdnx: 'zkFold',
            gov_action18u8lpkzge2csxe3plynn9lh4agwtv3nrqkyfwalwj4ykjv7l68jqqzmul9z: 'EMURGO',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlq77jt4x4: 'Eryx',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlpx66gmxa: 'NFTCDN',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlpvhtd5td: 'Input Output Global',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlpqx4t762: 'Eternl',
            gov_action18nefry4qacd80xzs2srjahxm2e4vz3c8wvrr03rrtk8mdqfuknysq66459t: 'MLabs',
            gov_action193leqzml768nz7nmpepzx822a5mzyanqhtewaxjtul5gp6uhwvfsqgl2qg0: 'BloxBean',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlzgf074ea: 'MLabs',
            gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8ssd0ztd8: 'TxPipe',
            gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8syhyg4hw: 'HWWallet Maintenance',
            gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8sztttste: 'TxPipe',
            gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8s5z9qdza: 'TxPipe',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlqvckzwqt: 'Anastasia Labs',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlpgcp0jyh: 'AdaStat.net',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlqsufvuyl: 'TxPipe',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlq2yeptuu: 'TxPipe',
            gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8sw64d667: 'TxPipe',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlqghuqg03: 'TxPipe',
            gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8svfsvefn: 'MLabs',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlq63cfnf0: 'MLabs',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlpyflfc4s: 'Cexplorer',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlqj0vdlhj: 'Vacuumlabs',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlp679xfzf: 'Supplyoneers (Pavilions)',
            gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8s24l0u4y: 'Teragone',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlpz4s2af8: 'Scalus',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlq5nrw6t9: 'Maestro',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlqczags6z: 'Harmonic Labs',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlzyc3clg6: 'PyCardano',
            gov_action1k02990lhw6wh74t7c6ufw3mqaek9ujtvyan99dj5qv5kvcs7pn8sj72rg72: 'TxPipe',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlqx488pdm: 'Vacuumlabs',
            gov_action1cp0w6zwgwpj98jtu3r2q838lgwmhs6j49l58zx4q05lx220lmzaqqztnljz: 'Cardano Pentad',
            gov_action13tfag48nf94rtjcdq7c06vhkslmxxw9h6c88sl7q5g5nnewcsvlzzy7m65d: 'Opshin'
        });

        function normalizeTreasuryBusinessName(value) {
            const name = String(value || '').trim();
            if (!name) return '';
            return TREASURY_BUSINESS_ALIASES[name.toLowerCase()] || name;
        }

        function resolveTreasuryBusinessText(value) {
            const name = normalizeTreasuryBusinessName(value);
            if (!name || /^unknown\b/i.test(name)) return '';
            return TREASURY_BUSINESS_BY_STAKE_ADDRESS[name] || (/^stake1/i.test(name) ? '' : name);
        }

        function resolveTreasuryAdministratorBusinessText(value) {
            const name = resolveTreasuryBusinessText(value);
            return /^Amaru\b/i.test(name) ? 'PRAGMA' : name;
        }

        function resolveCatalystBusinessName(value) {
            return resolveTreasuryBusinessText(value) || 'Unknown Catalyst proposer';
        }

        function getTreasuryBusinessName(withdrawal) {
            const stakeAddress = String(withdrawal?.stake_address || '').trim();
            return TREASURY_BUSINESS_BY_ACTION_ID[String(withdrawal?.action_id || '').trim()]
                || resolveTreasuryAdministratorBusinessText(withdrawal?.business)
                || TREASURY_BUSINESS_BY_STAKE_ADDRESS[stakeAddress]
                || resolveTreasuryAdministratorBusinessText(withdrawal?.proposer)
                || 'Unknown proposer';
        }

        return Object.freeze({
            businessAliases: TREASURY_BUSINESS_ALIASES,
            businessWebsites: TREASURY_BUSINESS_WEBSITES,
            businessLogos: TREASURY_BUSINESS_LOGOS,
            businessLogosByDomain: TREASURY_BUSINESS_LOGOS_BY_DOMAIN,
            normalizeTeamMemberDisplayName: normalizeCatalystTeamMemberDisplayName,
            normalizeBusinessName: normalizeTreasuryBusinessName,
            resolveBusinessText: resolveTreasuryBusinessText,
            resolveAdministratorBusinessText: resolveTreasuryAdministratorBusinessText,
            resolveCatalystBusinessName,
            getTreasuryBusinessName
        });
    }

    window.TDSPFundingDirectory = Object.freeze({
        create: createFundingDirectory
    });
}());

