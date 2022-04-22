type Routes = 'comm' | 'orbit';
type Dests = 'iobcfm' | 'unibapfm';
type Radios = 'RXS' | 'TXS' | 'UHF' | 'Simplex' | 'Net' | 'All';

export interface SimpleOptions {
  btnLabel: String;
  route: Routes;
  dest: Dests;
  cmdID: Number;
  radioOut: Radios;
}
