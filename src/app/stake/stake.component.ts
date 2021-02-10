import { Component, OnInit } from '@angular/core';
import { ethers } from 'ethers';
import { getMidPrice } from 'uniswap-price';
import { WalletService } from '../services/wallet.service';

@Component({
  selector: 'app-stake',
  templateUrl: './stake.component.html',
  styleUrls: ['./stake.component.scss'],
})
export class StakeComponent implements OnInit {
  MAX_INT = BigInt(
    '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'
  );
  CHAIN_ID = 42;
  INFURA_KEY = '';

  basixPoolAddress = '0xb8754acc0b4cb0c61578fc473d78421cbf56bbe4';
  basxAddress = '0x9b4af0c86d46338b7234dd14c385639b40f01bf8';
  susdAddress = '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51';
  orchestratorAddress = '0x98bd2274180e46d635fd7ae17c113c8f603c19d9';
  uniPairAddress = '';

  provider;
  signer;
  network;

  basxContract;
  basixPoolContract;
  orchestratorContract;
  uniPairContract;

  address;
  basxPrice = '0';
  susdPrice = '0';
  poolEarned = '0';
  basixPoolBalance = '0';
  uniPairBasxBalance = '0';
  canRebase = false;
  connectedToMetamask = false;
  allowedTranferFrom = false;

  openedTabs = {0: false, 1: false, 2: false};

  constructor(private readonly walletService: WalletService) {}

  async ngOnInit(): Promise<void> {
    // tslint:disable-next-line: no-string-literal
    if (typeof window['ethereum'] !== 'undefined') {
      console.log('MetaMask is installed!');
    }

    // tslint:disable-next-line: no-string-literal
    this.provider = new ethers.providers.Web3Provider(window['ethereum']);
    this.signer = this.provider.getSigner();
    this.network = await this.provider.getNetwork();

    // BASX Pool
    const basxAbi = require('../../assets/abis/BASX.json');
    this.basxContract = new ethers.Contract(
      this.basxAddress,
      basxAbi,
      this.signer
    );

    // UNIPair
    const uniPairAbi = require('../../assets/abis/UNIPair.json');
    this.uniPairContract = new ethers.Contract(
      this.uniPairAddress,
      uniPairAbi,
      this.signer
    );

    // Basix Pool
    const basixPoolAbi = require('../../assets/abis/BASIXPool.json');
    this.basixPoolContract = new ethers.Contract(
      this.basixPoolAddress,
      basixPoolAbi,
      this.signer
    );

    // Basix Pool
    const orchestratorAbi = require('../../assets/abis/Orchestrator.json');
    this.orchestratorContract = new ethers.Contract(
      this.orchestratorAddress,
      orchestratorAbi,
      this.signer
    );

    // Wallet Connection
    this.walletService.init(this.signer, this.provider);

    // Auto refresh
    setInterval(async () => {
      await this.updateData();
    }, 5000);
  }

  openTab(tab: number): void {
    if (!this.address) {
      alert('You must connect your wallet first.');
      return;
    }
    this.openedTabs[tab] = !this.openedTabs[tab];
  }

  async updateData(): Promise<void> {
    if (!(await this.walletService.isConnected())) {
      return;
    }

    this.uniPairBasxBalance = await this.getUniPairBasxBalance();

    this.basixPoolBalance = await this.getBasixPoolBalance();

    const uniPairPrices = await this.getUniPairPrices();
    this.basxPrice = uniPairPrices[0];
    this.susdPrice = uniPairPrices[1];

    this.allowedTranferFrom = await this.isBasxAllowed();

    this.poolEarned = await this.getPoolEarned();

    try {
      await this.orchestratorContract.callStatic.rebase();
      this.canRebase = true;
    } catch (error) {
      this.canRebase = false;
    }
  }

  async getUniPairBasxBalance(): Promise<string> {
    const uniPairAbi = require('../../assets/abis/UNIPair.json');
    const uniPairContract = new ethers.Contract(
      this.uniPairAddress,
      uniPairAbi,
      this.signer
    );
    const balances = await uniPairContract.getReserves();
    return (+ethers.utils.formatUnits(balances[1])).toFixed(6);
  }

  async getUniPairPrices(): Promise<object> {
    const prices = await getMidPrice(
      this.basxAddress,
      18,
      this.susdAddress,
      6,
      this.CHAIN_ID,
      this.INFURA_KEY
    );
    return [prices.base2quote, prices.quote2base];
  }

  async getBasixPoolBalance(): Promise<string> {
    return ethers.utils.formatUnits(await this.basixPoolContract.totalSupply());
  }

  async connectToMetamask(): Promise<void> {
    if (await this.walletService.connect()) {
      this.address = this.walletService.wallet.getAddress();
      this.connectedToMetamask = true;
      await this.updateData();
    }
  }

  async isBasxAllowed(): Promise<boolean> {
    const allowance = await this.uniPairContract.allowance(
      this.address,
      this.basixPoolAddress
    );
    // tslint:disable-next-line: triple-equals
    return allowance == this.MAX_INT;
  }

  async getPoolEarned(): Promise<string> {
    const earned = await this.basixPoolContract.earned(this.address);
    return (+ethers.utils.formatUnits(earned)).toFixed(6);
  }

  allowPoolTransferFromBasx(): void {
    this.uniPairContract
      .approve(this.basixPoolAddress, this.MAX_INT)
      .then((result) => {
        result.wait(1).then(() => {
          this.updateData();
        });
      });
  }

  poolStake(): void {
    this.basixPoolContract.stake('1000000000000000').then((result) => {
      result.wait(1).then(() => {
        this.updateData();
      });
    }, (error) => {
      alert('Not available at this moment.');
    });
  }

  poolWithdraw(): void {
    this.basixPoolContract.withdraw('1000000000000000').then((result) => {
      result.wait(1).then(() => {
        this.updateData();
      });
    }, (error) => {
      alert('Not available at this moment.');
    });
  }

  poolGetRewards(): void {
    this.basixPoolContract.getReward().then((result) => {
      result.wait(1).then(() => {
        this.updateData();
      });
    }, (error) => {
      alert('Not available at this moment.');
    });
  }

  poolRebase(): void {
    this.orchestratorContract.rebase().then((result) => {
      result.wait(1).then(() => {
        this.updateData();
      });
    }, (error) => {
      alert('Not available at this moment.');
    });
  }
}
