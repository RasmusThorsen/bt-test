import { Component } from '@angular/core';
import { BleService } from './ble.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'bt-test';


  constructor(public bleService: BleService) {}

  async connect() {
    const b = await this.bleService.connect();
  }

  async read() {
    const a = await this.bleService.readConfiguration();
  }

  async writeVerification() {
    this.bleService.sendVerificationCode('abc').subscribe(() => {
      console.log('test');
    }, () => {}, () => {
      console.log('verification-complete');
    });
  }

  async writeWifiCreds() {
    this.bleService.sendWifiCreds('NianLiv', 'NiceKode').subscribe(() => {
      console.log('ok');
    }, () => {}, () => {
      console.log('wifi-completed');
    });
  }
}
