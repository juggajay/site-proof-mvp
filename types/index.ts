// types/index.ts
export interface Project {
    id: string; created_at: string; name: string;
    project_number: string; location: string; organization_id: string;
}
export interface Itp {
    id: string; title: string; description: string | null;
}
export interface Lot {
    id: string; created_at: string; lot_number: string;
    description: string | null; status: 'IN_PROGRESS' | 'COMPLETED' | 'APPROVED';
    project_id: string; itp_id: string;
}
export interface ItpItem {
    id: string; itp_id: string; item_description: string;
    item_type: 'PASS_FAIL' | 'TEXT_INPUT' | 'NUMERIC'; order: number;
}
export interface ConformanceRecord {
    id: number; lot_id: string; itp_item_id: string;
    pass_fail_value: 'PASS' | 'FAIL' | 'N/A' | null;
    text_value: string | null; numeric_value: number | null;
    comment: string | null; completed_by: string | null; updated_at: string | null;
}
export interface Attachment { id: string; }
export interface LotWithItp extends Lot { itps: { title: string | null; } | null; }
export interface ItpWithItems extends Itp { itp_items: ItpItem[]; }
export type ConformanceRecordWithAttachments = ConformanceRecord & { attachments: Attachment[]; };
export type FullLotData = Lot & {
    projects: Pick<Project, 'id' | 'name' | 'project_number'>;
    itps: { title: string; itp_items: (ItpItem & { conformance_records: (ConformanceRecordWithAttachments)[] })[]; };
};