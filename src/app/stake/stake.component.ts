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

  basixPoolAddress = '0x1846b51ea6ca58878bb6bfd3b0911098cee53b98';
  basxAddress = '0x23157662a9cb9be32d4d9bd019d9bcbaa040a62b';
  susdAddress = '0x57Ab1ec28D129707052df4dF418D58a2D46d5f51';
  orchestratorAddress = '0x3ba7ba7e017a38b8905c3589094587cb92e2f110';
  uniPairAddress = '0xcf69db37abbb43f9e84daf1f0622d4ce91e6d0da';

  provider;
  signer;
  network;

  basxContract;
  basixPoolContract;
  susdContract;
  orchestratorContract;
  uniPairContract;

  address;
  basxPrice = 0;
  susdPrice = 0;
  poolEarned = '0';
  basixPoolBalance = '0';
  uniPairBasxBalance = '0';
  canRebase = false;
  connectedToMetamask = false;
  allowedTranferFrom = false;

  openedTabs = { 0: false, 1: false, 2: false };

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

    // BASX
    const basxAbi = require('../../assets/abis/BASX.json');
    this.basxContract = new ethers.Contract(
      this.basxAddress,
      basxAbi,
      this.signer
    );

    // SUSD
    this.susdContract = new ethers.Contract(
      this.susdAddress,
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
    const basxAmount = await this.basxContract.balanceOf(this.uniPairAddress);
    const susdAmount = await this.susdContract.balanceOf(this.uniPairAddress);

    return [basxAmount, susdAmount];
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
    this.basixPoolContract.stake('1000000000000000').then(
      (result) => {
        result.wait(1).then(() => {
          this.updateData();
        });
      },
      (error) => {
        alert('Not available at this moment.');
      }
    );
  }

  poolWithdraw(): void {
    this.basixPoolContract.withdraw('1000000000000000').then(
      (result) => {
        result.wait(1).then(() => {
          this.updateData();
        });
      },
      (error) => {
        alert('Not available at this moment.');
      }
    );
  }

  poolGetRewards(): void {
    this.basixPoolContract.getReward().then(
      (result) => {
        result.wait(1).then(() => {
          this.updateData();
        });
      },
      (error) => {
        alert('Not available at this moment.');
      }
    );
  }

  poolRebase(): void {
    this.orchestratorContract.rebase().then(
      (result) => {
        result.wait(1).then(() => {
          this.updateData();
        });
      },
      (error) => {
        alert('Not available at this moment.');
      }
    );
  }
}
