export interface Mission {
  Id: number; Name: string; Descr: string; ManagerId: number; CreatorId: number;
  StatusId: number; TypeId: number; Priority: number; Closed: boolean;
  Planned: string; Created: string; Revision: string;
}
export interface MissionComment { Id: number; Descr: string; ManagerName: string; Created: string; FileName: string }
