'reach 0.1';

const [ isHand, ROCK, PAPER, SCISSORS ] = makeEnum(3);
const [ isOutcome, Popo_Wins, DRAW, Akin_Wins ] = makeEnum(3);

const winner = (handAkin, handPopo) => ((handAkin + (4 - handPopo)) % 3);

assert(winner(ROCK, PAPER) == Popo_Wins);
assert(winner(PAPER, ROCK) == Akin_Wins);
assert(winner(ROCK, ROCK) == DRAW);

forall(UInt, handAkin =>
    forall(UInt, handPopo =>
        assert(isOutcome(winner(handAkin, handPopo))) )
);

forall(UInt, (hand) =>
  assert(winner(hand, hand) == DRAW)
);

const Player = {
    ...hasRandom,
    getHand: Fun([], UInt),
    seeOutcome: Fun([UInt], Null),
    timeoutAlart: Fun([], Null),
};

export const main = Reach.App(() => {

    const Akin = Participant('Akin', {
        ...Player,
        wager : UInt,   // amount
        deadline: UInt, // time delta (blocks/rounds)
    });

    const Popo = Participant('Popo', {
        ...Player,
        acceptWager: Fun([UInt], Null),
    });

    const informTimeout = () => {
        each([Akin, Popo], () => {
          interact.timeoutAlart();
        });
    };

    init();

    // logic
    Akin.only(() => {
        const wager = declassify(interact.wager);
        const deadline = declassify(interact.deadline);
    });
    Akin.publish(wager,deadline).pay(wager);
    commit();


    Popo.only(() => {
        interact.acceptWager(wager); // acceptWager() methode in the frontend
    });
    Popo.pay(wager)
        .timeout(relativeTime(deadline), () => closeTo(Akin, informTimeout));

    var outcome = DRAW;
    invariant( (balance() == 2 * wager) && (isOutcome(outcome)) );

    while ( outcome == DRAW ) {
        commit();

        Akin.only(() => {
            const _handAkin = interact.getHand();
            const [_commitAkin, _saltAkin] = makeCommitment(interact, _handAkin); //encrypt Akins hand value 
            const commitHandAkin = declassify(_commitAkin);
        });
        Akin.publish(commitHandAkin)
            .timeout(relativeTime(deadline), () => closeTo(Popo, informTimeout));
        commit();

        unknowable(Popo, Akin(_handAkin, _saltAkin)); //protect from Akins hand Value  using Akin salt fro popo
        Popo.only(() => {
            const handPopo = declassify(interact.getHand());
        });
        Popo.publish(handPopo)
            .timeout(relativeTime(deadline), () => closeTo(Akin, informTimeout));
        commit();

        Akin.only(() => {
            const saltAkin = declassify(_saltAkin);
            const handAkin = declassify(_handAkin);
        });
        Akin.publish(saltAkin, handAkin)
            .timeout(relativeTime(deadline), () => closeTo(Popo, informTimeout));;
        checkCommitment(commitHandAkin, saltAkin, handAkin);    // decrypt akins value wit the salt key

        outcome = winner(handAkin, handPopo);
        continue;
    }
    
    // const outcome = (handAkin + (4 - handPopo)) % 3; // 0 = Popo_Wins, 1 = Draw, 2 = Akin_Wins

    assert(outcome == Akin_Wins || outcome == Popo_Wins);
    transfer(2 * wager).to(outcome == Akin_Wins ? Akin : Popo);
    commit();

    // const [toAkin, toPopo] = outcome == 0 ? [0,2] : //Popo
    //                          outcome == 1 ? [1,1] : //tie
    //                                         [2, 0]; //Akin
    // transfer(toAkin * wager).to(Akin); 
    // transfer(toPopo * wager).to(Popo);
    // commit();

    each([Akin, Popo], () => {
        interact.seeOutcome(outcome); // show result of ourcome to frontend method seeOutcome();
    });
});