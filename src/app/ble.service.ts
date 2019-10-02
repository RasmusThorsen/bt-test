import { Injectable } from '@angular/core';
import { Observable, from, Subject } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class BleService {
  // BLE uuids, can also be string/hex UUIDs.
  private readonly debug = false;
  private readonly serviceId = this.debug ? 0x180f : 0x9a12;
  private readonly characteristicId = this.debug ? 0x2a19 : 0x0d51;

  // The flow:
  // Forbind -> verificering -> internet -> oplysninger (api/createDevice) -> færdig

  private device: BluetoothDevice;
  private service: BluetoothRemoteGATTService;

  private ready$ = new Subject<boolean>();

  constructor() {
    this.handleValueChange = this.handleValueChange.bind(this);
  }

  async connect(): Promise<boolean> {
    // Open the dialog in chrome, resovles when user selects device.
    try {
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          {
            services: [this.serviceId]
          }
        ]
      });
      const server = await this.device.gatt.connect();
      this.service = await server.getPrimaryService(this.serviceId);

      const char = await this.service.getCharacteristic(this.characteristicId);

      const c = await char.startNotifications();
      c.addEventListener('characteristicvaluechanged', this.handleValueChange);
    } catch (e) {
      // Do nothing if user closes dialog.
      return false;
    }
    return true;
  }

  sendVerificationCode(code: string): Observable<boolean> {
    return from(this.writeValue(JSON.stringify({ code }))).pipe(
      tap(() => {
        console.log('hej');
      }),
      switchMap(_ => this.ready$),
      take(1)
    );
  }

  sendWifiCreds(ssid: string, password: string): Observable<boolean> {
    const json = {
      ssid,
      password
    };
    return from(this.writeValue(JSON.stringify(json))).pipe(
      switchMap(_ => this.ready$),
      take(1)
    );
  }

  sendInformation(info) {
    return from(this.writeValue(JSON.stringify(info))).pipe(
      switchMap(_ => this.ready$),
      take(1)
    );
  }

  async readConfiguration(): Promise<string | null> {
    return await this.readValue();
  }

  private async readValue(): Promise<string | null> {
    if (this.device === undefined) {
      return null;
    }
    try {
      const char = await this.service.getCharacteristic(this.characteristicId);
      const val = await char.readValue();

      // Array containing the ASCII values for the string received
      const values: number[] = [];

      for (let i = 0; i < val.byteLength; i++) {
        values.push(val.getInt8(i));
      }

      return String.fromCharCode(...values);
    } catch (e) {
      return null;
    }
  }

  private async writeValue(value: string): Promise<boolean> {
    if (this.device === undefined) {
      return false;
    }
    try {
      const char = await this.service.getCharacteristic(this.characteristicId);

      const ascii: number[] = [];

      for (let i = 0; i < value.length; i++) {
        ascii.push(value.charCodeAt(i));
      }

      const buf = Uint8Array.of(...ascii);
      await char.writeValue(buf);
    } catch (e) {
      return false;
    }

    return true;
  }

  private handleValueChange(event) {
    const val = event.target.value;

    // Array containing the ASCII values for the string received
    const values: number[] = [];

    for (let i = 0; i < val.byteLength; i++) {
      values.push(val.getInt8(i));
    }

    const text = String.fromCharCode(...values);
    console.log(text);
    if (text.toLowerCase() === 'ok') {
      this.ready$.next(true);
    }
  }
}
