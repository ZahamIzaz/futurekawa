export interface Country {
  code: string;
  name: string;
}

export type LotStatus = 'COMPLIANT' | 'ALERT' | 'EXPIRED';

export interface Lot {
  id:          string;
  warehouseId: string;
  countryCode: string;
  storageDate: string;
  status:      LotStatus;
  createdAt:   string;
}

export interface Measurement {
  temperature: number;
  humidity:    number;
  timestamp:   string;
}

export type AlertType = 'TEMPERATURE' | 'HUMIDITY' | 'LOT_EXPIRED';

export interface Alert {
  id:            string;
  warehouseId:   string;
  countryCode:   string;
  type:          AlertType;
  message:       string;
  measuredValue: number;
  minAllowed:    number;
  maxAllowed:    number;
  createdAt:     string;
  resolvedAt:    string | null;
  lotId:         string | null;
}
