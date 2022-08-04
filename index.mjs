// import { loadStdlib } from '@reach-sh/stdlib';
import { loadStdlib, ask } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';


(async () =>{
    
    const stdlib = await loadStdlib(process.env);
    const fmt = (e) => stdlib.formatCurrency(e, 4); // formate Balace to 4 dec
    let acc = null;
    let ctc = null;


    const isAkin = await ask.ask(`Are you Akin? {y/n}`,
                                ask.yesno
                            );
    const who = isAkin ? 'Akin' : 'Popo';
    console.log(`Starting Rock, Paper, Scissors! as ${who}`);


    // Delopy Player Account Reg
    const createAcc = await ask.ask(`Would you like to create an account? (only possible on devnet) {y/n}`,
                                    ask.yesno
                                );
    if (createAcc) {
        acc = await stdlib.newTestAccount(stdlib.parseCurrency(1000)); // create User Account  and Allocate 1000 Balance to new user
    } 
    else {
        const secret = await ask.ask(`What is your account secret?`,
                                    (x => x)
                                );
        acc = await stdlib.newAccountFromSecret(secret);
    }
    
    // Delopy Contract 
    const deployCtc = await ask.ask(`Do you want to deploy the Contract {y/n}`,
                                    ask.yesno);
    if (isAkin) {
        ctc = acc.contract(backend);
        ctc.getInfo().then((info) => {
            // parseInt(info.hex,16);//info.hex.toString(16);
        console.log(`The contract is deployed as = ${JSON.stringify(info)}`);
        });
    }
    else {
        const info = await ask.ask(`Please paste the contract information:`,
                                    JSON.parse
                                );
        ctc = acc.contract(backend, info);
    }


    const getBalance = async () => fmt(await stdlib.balanceOf(acc));
    const before = await getBalance();
    console.log(`Your balance is ${before}`);

    const interact = { ...stdlib.hasRandom };
    
    interact.timeoutAlart = () => {
        console.log(`There was a timeout.`);
        process.exit(1);
    };

    if (isAkin) {
        const amt = await ask.ask(`How much do you want to wager?`,
                                stdlib.parseCurrency
                            );
        interact.wager = amt;
        interact.deadline = { ETH: 100, ALGO: 100, CFX: 1000 }[stdlib.connector];
    }
    else{
        interact.acceptWager = async (amt) => {
                                            // const accepted = await ask.ask(`Do you accept the wager of ${fmt(amt)}?`,
                                            //                                 ask.yesno
                                            //                             );
                                            const accepted = await ask.yesno(`Do you accept the wager of ${fmt(amt)}?`);
                                            if (!accepted) {process.exit(0);}
                                        };
    }


    const OUTCOME = ['Popo wins', 'Draw', 'Akin wins']; // Deal Result
    const HAND = ['Rock', 'Paper', 'Scissors']; // Deal Values
    const HANDS = {
        'Rock': 0, 'R': 0, 'r': 0,
        'Paper': 1, 'P': 1, 'p': 1,
        'Scissors': 2, 'S': 2, 's': 2,
      };

    interact.getHand = async () => {
        const getHand = await ask.ask(`What hand will you play?`, 
                                    (getHandValue) => { const playerHandV = HANDS[getHandValue];
                                                        if ( playerHandV === undefined ) {
                                                            throw Error(`Not a valid hand ${playerHandV}`);
                                                        }
                                                    return playerHandV;
                                                    }
                                );
        console.log(`You played ${HAND[getHand]}`);
        return getHand;
    };

    interact.seeOutcome = async (outcome) => {
        console.log(`The outcome is: ${OUTCOME[outcome]}`);
    };

    // conect all Interact object to backend functions
    const part = isAkin ? ctc.p.Akin : ctc.p.Popo;
    await part(interact);

    const after = await getBalance();
    console.log(`Your balance is now ${after}`);

    ask.done();


})();