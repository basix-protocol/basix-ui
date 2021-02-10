import { Component, OnInit } from '@angular/core';
import { ethers } from 'ethers';
import { WalletService } from '../services/wallet.service';
const BasxAbi = require('../../assets/abis/BASX.json');
const SaleAbi = require('../../assets/abis/Sale.json');

@Component({
  selector: 'app-sale',
  templateUrl: './sale.component.html',
  styleUrls: ['./sale.component.scss'],
})
export class SaleComponent implements OnInit {
  isMetaMaskInstalled = true;
  account: string = null;
  canClaim = false;
  buyError = false;

  sale = '0xcd7d29ad7540ad7d1fab8e7d7109d35c526a70e2';
  token = '0x9b4af0c86d46338b7234dd14c385639b40f01bf8';

  ethBalance = '0';
  estimatedBasx = '0';
  basxBalance = '0';
  estimatedEth = '0';
  unclaimedSale = '0';

  ethInputValue = 0;
  basxInputValue = 0;

  provider;
  signer;

  constructor(private readonly walletService: WalletService) {}

  ngOnInit(): void {
    this.initEth();
  }

  async login(): Promise<void> {
    if (await this.walletService.connect()) {
      this.account = this.walletService.wallet.getAddress();
      this.initEth();
    }
  }

  private async initEth(): Promise<void> {
    // tslint:disable-next-line: no-string-literal
    this.isMetaMaskInstalled = typeof window['ethereum'] !== 'undefined';
    // tslint:disable-next-line: no-string-literal
    this.provider = new ethers.providers.Web3Provider(window['ethereum']);
    this.signer = this.provider.getSigner();

    this.walletService.init(this.signer, this.provider);

    const tokenInstance = new ethers.Contract(this.token, BasxAbi, this.signer);

    const saleInstance = new ethers.Contract(this.sale, SaleAbi, this.signer);

    if (this.account) {

      saleInstance.canClaim().then((data) => {
        this.canClaim = data;
      });
      this.provider.getBalance(this.account).then((data) => {
        this.ethBalance = parseFloat(ethers.utils.formatEther(data)).toFixed(4);
        this.estimatedBasx = (
          parseFloat(ethers.utils.formatEther(data)) * 2000
        ).toFixed(2);

        tokenInstance.balanceOf(this.account).then((balance) => {
          saleInstance.getClaimableTokens(this.account).then((unclaimed) => {
            this.unclaimedSale = ethers.utils.formatEther(unclaimed);
            const basxBalance =
              parseInt(ethers.utils.formatEther(balance), undefined) +
              parseInt(this.unclaimedSale, undefined);
            this.estimatedEth = (basxBalance / 1600).toFixed(4);
            this.basxBalance = basxBalance.toString();
          });
        });
      });
    }
  }

  buy(): void {
    this.buyError = false;
    if (this.account) {
      this.signer
        .sendTransaction({
          to: this.sale,
          value: ethers.utils.parseEther(this.ethInputValue.toString()),
        })
        .catch((e) => {
          console.error(e);
          this.buyError = true;
        });
    } else {
      this.buyError = true;
    }
  }

  claimSaleAll(): void {
    const saleInstance = new ethers.Contract(this.sale, SaleAbi, this.signer);

    saleInstance.claim().then((data) => {
      this.unclaimedSale = '0';
    });
  }

  onEthInputChange(ethAmount: number): void {
    this.ethInputValue = ethAmount;
    this.basxInputValue = ethAmount * 2000;
  }

  onBasxInputChange(basxAmount: number): void {
    this.basxInputValue = basxAmount;
    this.ethInputValue = basxAmount / 2000;
  }
}
