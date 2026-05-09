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

export interface EventProgressReportRow {
  ManagerName: string;
  CountTotal: number;
  CountReg: number;
  CountMeeting: number;
  CountLection: number;
  CountPraktik: number;
  CountBill: number;
  CountPhone: number;
  CountServis: number;
  CountSms: number;
  MeetingPercent: number;
  LectionPercent: number;
  PraktikPercent: number;
  BillPercent: number;
}

export interface MiniAppReportResponse {
  Success: boolean;
  ErrMsg?: string;
  Items?: EventProgressReportRow[];
}
