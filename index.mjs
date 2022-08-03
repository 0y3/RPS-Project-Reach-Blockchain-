import { loadStdlib } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';


(async () =>{
    
    const stdlib = await loadStdlib(process.env);
    const appBalance = stdlib.parseCurrency(10);

    const accAkin = await stdlib.newTestAccount(appBalance);    // Allocate User Account Balance 
    const accPopo = await stdlib.newTestAccount(appBalance);

    const fmt = (e) => stdlib.formatCurrency(e, 4); // formate Balace to 4 dec
    const getBalance = async (who) => fmt(await stdlib.balanceOf(who));
    const beforeAkin = await getBalance(accAkin);   // get User Account Balance 
    const beforePopo = await getBalance(accPopo);

    const ctcAkin = accAkin.contract(backend);  // User Start Contract Tp Start Deal
    const ctcPopo = accPopo.contract(backend, ctcAkin.getInfo());   // User 2 Accept Deal


    const HAND = ['Rock', 'Paper', 'Scissors']; // Deal Values
    const OUTCOME = ['Popo wins', 'Draw', 'Akin wins']; // Deal Result

    const Player = (playerName) => ({
        ...stdlib.hasRandom,
        getHand : async () => {
                        const handVar = Math.floor(Math.random() * 3);
                        console.log(`${playerName} played ${HAND[handVar]}`);
                        if ( Math.random() <= 0.5 ) {
                            for ( let i = 0; i < 10; i++ ) {
                              console.log(`  ${playerName} takes too much time sending it back...`);
                              await stdlib.wait(1);
                            }
                        }
                        return handVar;
                    },
        seeOutcome : (outcome) => {
                        console.log(`${playerName} saw outcome ${OUTCOME[outcome]}`);
                    },
        timeoutAlart : () => {
                        console.log(`${playerName} observed a timeout`);
                    },
    });


    // conect to backend functions
    await Promise.all([
        ctcAkin.p.Akin({    // backend.Akin(ctcAkin,{
            ...Player('Akin'),
            wager: stdlib.parseCurrency(5),
            deadline: 10,
        }),
        ctcPopo.p.Popo({ 
            ...Player('Popo'),
            acceptWager: (amt) => {
                console.log(`Popo accepts the wager of ${fmt(amt)}.`);
            },
        })
    ]);

    const afterAkin = await getBalance(accAkin);
    const afterPopo = await getBalance(accPopo);

    console.log(`Akin went from ${beforeAkin} to ${afterAkin}.`);
    console.log(`Popo went from ${beforePopo} to ${afterPopo}.`);


})();