export interface MiniAppMeResponse {
  Success: boolean;
  ErrMsg?: string;
  ManagerId?: number;
  Name?: string;
  MiniappUserLevel?: number;
  CompanyId?: number;
}

export interface MiniAppCalendarSlot {
  Id: number;
  Kind: string;
  Start: string;
  Title: string;
  Description: string;
  ManagerShort: string;
  EventStatusColor: string;
  ManagerColorHex: string;
}

export interface MiniAppTotals {
  IncomeRub: number;
  TotalIncomeRub: number;
  ExpensesRub: number;
  ExpensesCampaignRub: number;
  LoadPercent: number;
  RegCount: number;
  MeetingCount: number;
  BillCount: number;
  PraktikCount: number;
  CertCount: number;
  AshfxproBotUserCount: number;
  SummaryRow: string;
}

export interface MiniAppCalendarResponse {
  Success: boolean;
  ErrMsg?: string;
  datepickfrom?: string;
  datepickto?: string;
  CompanyCode?: string;
  Totals?: MiniAppTotals | null;
  Slots?: MiniAppCalendarSlot[];
}

/** Reports/TariffReport */
export interface TariffServiceOption {
  Id: number;
  Name: string;
}

export interface TariffTransitionStat {
  ServiceFrom: number;
  ServiceTo: number;
  ServiceFromSubsCount: number;
  ServiceToSubsCount: number;
  TransitionPersentage: number;
}

export interface TariffReportRow {
  ClientId: number;
  TelegramId: number;
  ServiceFromName: string;
  ServiceToName?: string;
  DateFirst: string;
  DateSecond?: string;
  DayDiff?: number;
  IncomeRub?: number;
  HexColorFrom?: string;
  HexColorTo?: string;
}

export interface TariffReportResponse {
  Success: boolean;
  ErrMsg?: string;
  Datepickfrom?: string;
  Datepickto?: string;
  Services?: TariffServiceOption[];
  TransitionStat?: TariffTransitionStat | null;
  TotalIncomeRub?: number;
  Items?: TariffReportRow[];
}
