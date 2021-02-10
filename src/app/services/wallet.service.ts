import { TransactionResponse } from '@ethersproject/abstract-provider';
import { Injectable } from '@angular/core';
import { ethers } from 'ethers';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  signer: any;
  provider: any;
  wallet: Wallet;
  tokens = new Map<string, Token>();

  constructor() {}

  init(signer, provider): void {
    this.signer = signer;
    this.provider = provider;
    this.wallet = new Wallet(this.signer, this.provider);
  }

  async connect(): Promise<boolean> {
    // tslint:disable-next-line: no-string-literal
    await window['ethereum'].enable();
    if (await this.wallet.connect()) {
      return true;
    }
  }

  async isConnected(): Promise<boolean> {
    return await this.wallet.isConnected();
  }

  async initToken(address, abi): Promise<string> {
    const token = new Token(address, abi, this.signer);
    await token.init();
    this.tokens.set(token.name, token);
    return token.name;
  }

  async getTransactions(): Promise<Array<TransactionResponse>> {
    const provider = new ethers.providers.EtherscanProvider(
      await this.provider.getNetwork()
    );
    return await provider.getHistory(this.wallet.address);
  }
}

class Wallet {
  signer: any;
  provider: any;
  address: string;

  constructor(signer, provider) {
    this.signer = signer;
    this.provider = provider;
  }

  async connect(): Promise<boolean> {
    try {
      this.address = await this.signer.getAddress();
      return this.isConnected();
    } catch (error) {
      return false;
    }
  }

  async isConnected(): Promise<boolean> {
    return this.address ? true : false;
  }

  getAddress(): string {
    return this.address;
  }

  async getBalance(): Promise<string> {
    return ethers.utils.formatEther(
      await this.provider.getBalance(this.address)
    );
  }
}

class Token {
  address: string;
  signer: any;
  contract: any;
  name: string;
  symbol: string;
  decimals: string;

  constructor(address, abi, signer) {
    this.address = address;
    this.signer = signer;
    this.contract = new ethers.Contract(this.address, abi, this.signer);
  }

  async init(): Promise<void> {
    this.name = await this.contract.name();
    this.symbol = await this.contract.symbol();
    this.decimals = await this.contract.decimals();
  }

  async getBalance(): Promise<string> {
    return await this.contract.balanceOf(await this.signer.getAddress());
  }
}
