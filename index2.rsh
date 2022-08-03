'reach 0.1'
// 'use strict';
const Player = {     // player object wit 2 var name (getHand & seeOutcome) that both have a function value;
    getHand : Fun([], UInt),
    seeOutcome : Fun([UInt], Null),
  };

export const main = Reach.App(() => {

    const Akin = Participant('Akin', {
        ...Player,
        wager : UInt,
    });

    const Popo = Participant('Popo', {
        ...Player,
        acceptWager: Fun([UInt], Null),
    });

    init();

    // logic

    Akin.only(() => {
        const wager = declassify(interact.wager);
        const handAkin = declassify(interact.getHand());
    });
    Akin.publish(wager,handAkin).pay(wager);
    commit();

    // unknowable(Popo, Akin(handAkin));
    Popo.only(() => {
        interact.acceptWager(wager); // acceptWager() methode in the frontend
        const handPopo = declassify(interact.getHand());
    });
    Popo.publish(handPopo).pay(wager);
    
    const outcome = (handAkin + (4 - handPopo)) % 3; // 0 = Popo_Wins, 1 = Draw, 2 = Akin_Wins

    const [toAkin, toPopo] = outcome == 0 ? [0,2] : //Popo
                             outcome == 1 ? [1,1] : //tie
                                            [2, 0]; //Akin
    transfer(toAkin * wager).to(Akin); 
    transfer(toPopo * wager).to(Popo);

    commit();

    each([Akin, Popo], () => {
        interact.seeOutcome(outcome); // show result of ourcome to frontend method seeOutcome();
    });
});