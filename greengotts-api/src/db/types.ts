export interface User {
  id: string;
  email: string;
  display_name?: string;
  status: 'active' | 'inactive';
  created_at: Date;
}

export interface Role {
  id: number;
  code: 'ADMIN' | 'MANAGER' | 'CONTRIBUTOR' | 'FINANCE';
}

export interface UserRole {
  user_id: string;
  role_id: number;
  team_id?: string;
}

export interface AccessAllowlist {
  email: string;
  invited_by?: string;
  invited_at: Date;
  status: 'pending' | 'approved' | 'revoked';
}

export interface Team {
  id: string;
  name: string;
  owner_user_id: string;
  cost_center_default_id?: string;
  created_at: Date;
}

export interface CostCenter {
  id: string;
  team_id: string;
  code: string;
  name: string;
  active: boolean;
}

export interface Budget {
  id: string;
  team_id: string;
  title: string;
  description?: string;
  fiscal_year: number;
  base_currency: string;
  status: 'draft' | 'active' | 'closed';
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
}

export interface BudgetSection {
  id: string;
  budget_id: string;
  title: string;
  description?: string;
  sort_order: number;
}

export interface FxRate {
  id: string;
  as_of_date: Date;
  from_ccy: string;
  to_ccy: string;
  rate: number;
  source_note?: string;
  created_by: string;
  created_at: Date;
}

export interface BudgetItem {
  id: string;
  budget_id: string;
  section_id?: string;
  cost_center_id: string;
  owner_user_id: string;
  type: 'headcount' | 'marketing_expense' | 'software_tool' | 'client_care' | 'viatico';
  nature: 'one_time' | 'recurring' | 'provision';
  vendor_or_person?: string;
  description?: string;
  local_currency: string;
  local_amount: number;
  fx_rate_id_snapshot: string;
  usd_amount: number;
  allocations_json: number[];
  status: 'planned' | 'provision' | 'actualized';
  start_month?: Date;
  end_month?: Date;
  created_by: string;
  updated_by: string;
  created_at: Date;
  updated_at: Date;
  soft_deleted_at?: Date;
}

export interface Attachment {
  id: string;
  budget_item_id: string;
  file_name: string;
  mime: string;
  size_bytes: number;
  storage_path: string;
  uploaded_by: string;
  uploaded_at: Date;
}

export interface AuditLog {
  id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  actor_id?: string;
  before_json?: any;
  after_json?: any;
  at: Date;
}
