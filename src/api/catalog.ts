export interface CatalogField { Name: string; Label: string; Type: string; Required: boolean; ReadOnly: boolean; MaxLength: number; Options: { Id: number; Name: string }[] | null }
export interface CatalogDefinition { Kind: string; Title: string; TitleField: string; DateField: string | null; ParentField: string | null; ChildKind: string | null; Global: boolean; CanEdit: boolean; CanCreate: boolean; CanDelete: boolean; Fields: CatalogField[] }
export type CatalogValue = string | number | boolean | null;
export interface CatalogRecord { Id: number; Revision: string | null; Values: Record<string, CatalogValue> }
export function catalogText(field: CatalogField, value: CatalogValue | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  if (field.Type === 'bool') return value ? 'Да' : 'Нет';
  if (field.Options) return field.Options.find(x => x.Id === Number(value))?.Name || String(value);
  if (field.Type === 'datetime-local' || field.Type === 'date') return new Date(String(value)).toLocaleString('ru-RU', field.Type === 'date' ? { dateStyle: 'short' } : { dateStyle: 'short', timeStyle: 'short' });
  return String(value);
}
