import { reactive } from 'vue';
import { getCrmClient } from './crmClient';

export interface Permissions {
  Notifications: boolean; Missions: boolean; EditMissions: boolean; Payments: boolean;
  Clients: boolean; EditClients: boolean; Events: boolean; EditEvents: boolean;
  Reports: boolean; Finance: boolean; Messages: boolean; AssignClients: boolean; IsAdmin: boolean;
}
export interface Option { Id: number; Name: string; Active?: boolean }
export interface Lookups {
  Managers: Option[]; Adsources: Option[]; EventTypes: Option[]; EventStatuses: Option[];
  Services: (Option & { PriceRub: number; DurationMon: number; DurationDays: number })[];
}
export interface Me {
  ManagerId: number; CompanyId: number; Name: string; Permissions: Permissions;
}
export interface ClientRecord {
  Id: number; Name: string; Firstname: string; Lastname: string; Patronymic: string;
  Phone: string | null; Email: string | null; Telegram: string | null; TelegramId: number | null;
  ManagerId: number; AdsourceId: number; ClientTypeId: number; Comments: string | null;
  Created: string; SubscribedTill: string | null; RttmBotActive: boolean; AshfxproBotActive: boolean;
  Revision: string;
}
export interface EventRecord {
  Id: number; ClientId: number; ManagerId: number; CreatorId: number;
  EventTypeId: number; EventStatusId: number; ServiceId: number | null;
  Planned: string; ExpiryDate: string | null; Comments: string | null;
  IncomeRub: number | null; DurationMin: number; Revision: string;
}
export interface EventListRow { Event: EventRecord; ClientName: string }
export interface Page<T> { Items: T[]; Total: number; Page: number }

export const workspace = reactive<{ me: Me | null; lookups: Lookups | null }>({ me: null, lookups: null });

export async function api<T>(action: string, body: unknown = {}): Promise<T> {
  try {
    const { data } = await getCrmClient().post<T & { Success: boolean; ErrMsg?: string }>(`/MiniApp/${action}`, body);
    if (!data.Success)
      throw new Error(data.ErrMsg || 'Не удалось выполнить операцию.');
    return data;
  }
  catch (error) {
    if (error instanceof Error && error.message === 'Network Error')
      throw new Error('Нет соединения с CRM. Проверьте интернет и повторите попытку.');
    throw error;
  }
}

export async function loadWorkspace() {
  const me = await api<Me>('Me');
  const lookups = await api<Lookups>('Lookups');
  workspace.me = me;
  workspace.lookups = lookups;
}

export function label(options: Option[] | undefined, id: number | null | undefined): string {
  return options?.find(x => x.Id === id)?.Name || (id ? `№${id}` : 'Не указан');
}
export function dateText(value?: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(+date) ? value : date.toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
}
export function errorText(error: unknown): string { return error instanceof Error ? error.message : String(error); }
export function localDate(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}
export function localTime(date = new Date()): string {
  return `${localDate(date)}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Save forms retain this value across retries; the CRM stores it with the new record. */
export function requestId(): string { return crypto.randomUUID(); }
