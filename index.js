import React from 'react';
import AppViews from './view/AppViews';
import DeployerViews from './view/DeployerViews';
import AttacherViews from './view/AttacherViews';
import {renderDOM, renderView} from './view/render';
import './index.css';

import { loadStdlib, ask } from '@reach-sh/stdlib';
import * as backend from './build/index.main.mjs';
const stdlib = await loadStdlib(process.env);

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
    render() { return renderView(this, AppViews); }
}