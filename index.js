import React from 'react';
import AppViews from './view/AppViews';
import DeployerViews from './view/DeployerViews';
import AttacherViews from './view/AttacherViews';
import {renderDOM, renderView} from './view/render';
import './index.css';

import { loadStdlib, ask } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
const stdlib = loadStdlib(process.env);

const handToInt = {'ROCK': 0, 'PAPER': 1, 'SCISSORS': 2};
const OUTCOME = ['Popo wins', 'Draw', 'Akin wins']; // Deal Result
const {standardUnit} = stdlib;
const defaults = {defaultFundAmt: '10', defaultWager: '3', standardUnit};

class App extends React.Component {
    constructor(props) {
      super(props);
      this.state = {
                    view: 'ConnectAccount', 
                    ...defaults
                };
    }
    async componentDidMount() {

        const acc         = await stdlib.getDefaultAccount();
        const bal         = await stdlib.balanceOf(acc);
        const convertedBal= stdlib.formatCurrency(bal, 4);

        this.setState({acc, convertedBal});

        if (await stdlib.canFundFromFaucet()) {
            this.setState({view: 'FundAccount'});
        } 
        else {
            this.setState({view: 'DeployerOrAttacher'});
        }
    }
    async fundAccount(fundAmount) {
        await stdlib.fundFromFaucet(this.state.acc, stdlib.parseCurrency(fundAmount));
        this.setState({view: 'DeployerOrAttacher'});
    }
    async skipFundAccount() { this.setState({view: 'DeployerOrAttacher'}); }
    selectAttacher() { this.setState({view: 'Wrapper', ContentView: Attacher}); }
    selectDeployer() { this.setState({view: 'Wrapper', ContentView: Deployer}); }
    render() { return renderView(this, AppViews); }
}

class Player extends React.Component {
    random() { return stdlib.hasRandom.random(); }
    async getHand() { // Fun([], UInt)
        const hand = await new Promise(resolveHandP => {
            this.setState({view: 'GetHand', playable: true, resolveHandP});
        });
        this.setState({view: 'WaitingForResults', hand});
        return handToInt[hand];
    }
    seeOutcome(i) { this.setState({view: 'Done', outcome: intToOutcome[i]}); }
    informTimeout() { this.setState({view: 'Timeout'}); }
    playHand(hand) { this.state.resolveHandP(hand); }
}

class Deployer extends Player {
    constructor(props) {
      super(props);
      this.state = {view: 'SetWager'};
    }
    setWager(wager) { this.setState({view: 'Deploy', wager}); }
    async deploy() {
      const ctc = this.props.acc.contract(backend);
      this.setState({view: 'Deploying', ctc});
      this.wager = stdlib.parseCurrency(this.state.wager); // UInt
      this.deadline = {ETH: 10, ALGO: 100, CFX: 1000}[stdlib.connector]; // UInt
      backend.Akin(ctc, this);
      const ctcInfoStr = JSON.stringify(await ctc.getInfo(), null, 2);
      this.setState({view: 'WaitingForAttacher', ctcInfoStr});
    }
    render() { return renderView(this, DeployerViews); }
}

class Attacher extends Player {
    constructor(props) {
      super(props);
      this.state = {view: 'Attach'};
    }
    attach(ctcInfoStr) {
      const ctc = this.props.acc.contract(backend, JSON.parse(ctcInfoStr));
      this.setState({view: 'Attaching'});
      backend.Popo(ctc, this);
    }
    async acceptWager(wagerAtomic) { // Fun([UInt], Null)
      const wager = stdlib.formatCurrency(wagerAtomic, 4);
      return await new Promise(resolveAcceptedP => {
        this.setState({view: 'AcceptTerms', wager, resolveAcceptedP});
      });
    }
    termsAccepted() {
      this.state.resolveAcceptedP();
      this.setState({view: 'WaitingForTurn'});
    }
    render() { return renderView(this, AttacherViews); }
}

renderDOM(<App />);