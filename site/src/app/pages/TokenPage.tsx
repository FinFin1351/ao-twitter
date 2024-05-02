import React from 'react';
import './TokenPage.css';
import {
  getTokenBalance, getDefaultProcess, getWalletAddress,
  numberWithCommas, transferToken,
  formatBalance
} from '../util/util';
import { CRED, AOT_TEST, TRUNK } from '../util/consts';
import { dryrun } from "@permaweb/aoconnect/browser";
import MessageModal from '../modals/MessageModal';
import { Server } from '../../server/server';
import Loading from '../elements/Loading';

declare var window: any;

interface TokenPageState {
  question: string;
  alert: string;
  message: string;
  loading: boolean;
  address: string;
  process: string;
  hasAOT: boolean;
  balOfCRED: number;
  balOfAOT: number;
  balOfTRUNK: number;
}

class TokenPage extends React.Component<{}, TokenPageState> {

  constructor(props: {}) {
    super(props);
    this.state = {
      question: '',
      alert: '',
      message: '',
      loading: true,
      address: '',
      process: '',
      hasAOT: true,
      balOfCRED: 0,
      balOfAOT: 0,
      balOfTRUNK: 0,
    };
  }

  componentDidMount() {
    this.start();
  }

  async start() {
    let address = await getWalletAddress();
    let process = await getDefaultProcess(address);
    this.setState({ address, process });

    let balOfCRED = await getTokenBalance(CRED, process);
    balOfCRED = formatBalance(balOfCRED, 3);

    let balOfTRUNK = await getTokenBalance(TRUNK, process);
    balOfTRUNK = formatBalance(balOfTRUNK, 3);

    this.setState({ balOfCRED, balOfTRUNK });
    this.displayAOT(process);
  }

  async displayAOT(address: string) {
    let balOfAOT = await getTokenBalance(AOT_TEST, address);
    Server.service.setBalanceOfAOT(balOfAOT);
    this.setState({ balOfAOT, loading: false });

    // You can only get token-test once
    let balances = await this.getBalances(AOT_TEST);
    if (balances.indexOf(address) != -1)
      this.setState({ hasAOT: true });
    else
      this.setState({ hasAOT: false });
  }

  async getBalances(process: string) {
    const result = await dryrun({
      process: process,
      tags: [
        { name: 'Action', value: 'Balances' },
      ],
    });

    // console.log("getBalances:", result)
    return result.Messages[0].Data;
  }

  async getAOT() {
    let address = this.state.process;
    this.setState({ message: 'Get AOT-Test...' });
    await transferToken(AOT_TEST, address, '10000');
    await this.displayAOT(address);
    this.setState({ message: '' });
  }

  renderTokens() {
    let tokens = ['AOCRED-Test', 'AOT-Test', 'TRUNK'];
    let icons = ['./logo-ao.png', './logo.png', './logo-trunk.png'];
    let bals = [this.state.balOfCRED, this.state.balOfAOT, this.state.balOfTRUNK];

    let divs = [];
    for (let i = 0; i < tokens.length; i++) {
      divs.push(
        <div key={i} className='token-page-card'>
          <img className={`token-page-icon ${i !== 2 && 'cred'}`} src={icons[i]} />
          <div>
            <div className='token-page-title'>{tokens[i]}</div>
            {this.state.loading
              ? <Loading marginTop='5px' />
              : <div className='token-page-text balance'>{numberWithCommas(bals[i])}</div>
            }
          </div>
        </div>
      )
    }

    return divs
  }

  render() {
    let process = this.state.process;
    if (!process) process = 'Try to disconnect and reconnect to the wallet on the Home page.';

    return (
      <div className='token-page'>
        <div className='token-page-card process'>
          <div className='token-page-title'>Your Process ID</div>
          {this.state.loading
            ? <Loading marginTop='5px' />
            : <div className='token-page-text'>{process}</div>
          }
        </div>

        <div className='token-page-token-row'>
          {this.renderTokens()}
        </div>

        {!this.state.hasAOT &&
          <div><button onClick={() => this.getAOT()}>Get 10,000 AOT-Test</button></div>
        }

        <MessageModal message={this.state.message} />
      </div>
    )
  }
}

export default TokenPage;