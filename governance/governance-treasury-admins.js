(function () {
    const recipientAdministrators = Object.freeze({
        stake17xzc8pt7fgf0lc0x7eq6z7z6puhsxmzktna7dluahrj6g6ghh5qjr: 'Intersect Treasury Reserve Smart Contract',
        stake1784sdxt6jjennmstphgdu7l7c2scf5d02a6cve2dgn5s2kq5u3j9v: 'Intersect Treasury Reserve Smart Contract',
        stake17x3n2krrld46qms4f4hzqqxzjgaf59u3fecvl6eh8scmaacjqmvjw: 'Harmonic Labs',
        stake1790c5a0h3qwkxquehkdg746ccaa3hdfzgp7ckx6wzdpp7lq6ysdg0: 'Blink Labs',
        stake17x2x5cv4nlwptph8kxvnyw93pp2sp54dk54dpfp2ax7fkggaj3ty4: 'UTxO Company / Siban Labs',
        stake1u99m2kxsvdwlulg4l6qwjrpvayzrzwk0fugnvu3uklfqtws257z0g: 'Orion Fund / Arouet Holdings',
        stake17xnev6rc25xwz8kg4qae8lq6dcg964z00py5gqgxd387pncv8fq8g: 'Amaru - Matthias Benkort',
        stake17xd74ehu0l4d5mx0sfz4fd0r5jvw4v2jqkkfyjxrlwvnkhccrqj9l: 'Amaru - Arnaud Bailly',
        stake17xrh74lqhhxgzelfsn0wq5kcm4e5dmluprlcpg5mq30p5yqhgk7k8: 'Amaru - Pi Lanningham',
        stake17xrqac8khkprtpp2jz90mpkujjwye8dt6a9sjewrvjudx9ggg4u5y: 'Amaru - Damien Czapla',
        stake178jztxzwynajcp4dva5gy9udmmnwg7ueffvf4c7hpjqhc7gtj5nzz: 'Amaru 2025 contingency multisig',
        stake1790mk0jjjhppr36ethwj8kewpgyrxyc7q6qucl4gqru96dqh6k4q9: 'Amaru core development - Matthias Benkort',
        stake179r8gmryz5wrwvlxm6g4s4u9ssdz656z95hwjnk9rgamedqpl4qd7: 'Amaru operations - Damien Czapla',
        stake17yezq8wpaqnssdjvd3p220uf7e6nzjae44w6yu625y965rg8en39a: 'Amaru network testing - Paolo Veronelli',
        stake178a5gxtm0ynzw80f80rsps3a5dwem43swsekpnctd0wuwxs0hc220: 'Amaru middleware - Pi Lanningham',
        stake178ndhlcfy30t38z0tql64fpg8ply93r37xrgvdagfpsz5nsttyvhp: 'Amaru 2026 contingency multisig',
        stake1u92flcyspwcp92lmgs0p47vdjrrek96l07cv3v6033wddfc8h620a: 'Tastenkunst GmbH'
    });

    window.TDSPTreasuryAdmins = Object.freeze({
        recipientAdministrators,
        getRecipientAdministrator(stakeAddress) {
            return recipientAdministrators[String(stakeAddress || '').trim()] || null;
        }
    });
}());
