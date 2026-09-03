/**
 * Database types for NEXORA.
 * Generated / maintained alongside migrations.
 * §11.1: UUID PKs, workspace_id on every tenant row, timestamps, soft deletes.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/* ============ ENUMS ============ */

export type WorkspaceRole = 'owner' | 'admin' | 'manager' | 'member' | 'viewer' | 'guest';

export type StatusCategory = 'todo' | 'in_progress' | 'done' | 'cancelled';

export type DependencyType = 'blocks' | 'relates_to' | 'duplicates';

export type CustomFieldType = 'text' | 'number' | 'date' | 'select' | 'multi_select' | 'checkbox' | 'url' | 'user';

export type ProjectMode = 'simple' | 'advanced';

/* ============ ROW TYPES ============ */

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  is_personal: boolean;
  owner_id: string;
  plan: string;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type WorkspaceMember = {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  invited_by: string | null;
  joined_at: string;
};

export type Team = {
  id: string;
  workspace_id: string;
  name: string;
  key: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type TeamMember = {
  id: string;
  team_id: string;
  user_id: string;
  workspace_id: string;
  role: WorkspaceRole;
};

export type Project = {
  id: string;
  workspace_id: string;
  team_id: string | null;
  name: string;
  key: string;
  description: string | null;
  mode: ProjectMode;
  is_personal: boolean;
  item_counter: number;
  archived_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type ProjectMember = {
  id: string;
  project_id: string;
  user_id: string;
  workspace_id: string;
  role: WorkspaceRole;
};

export type WorkItemType = {
  id: string;
  workspace_id: string;
  name: string;
  icon: string | null;
  color: string | null;
  is_system: boolean;
  created_at: string;
};

export type Status = {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  category: StatusCategory;
  position: number;
  color: string;
  created_at: string;
};

export type WorkItem = {
  id: string;
  workspace_id: string;
  project_id: string;
  team_id: string | null;
  parent_id: string | null;
  type_id: string;
  status_id: string;
  sequence: number;
  title: string;
  description: Record<string, unknown> | null;
  priority: number;
  creator_id: string;
  start_date: string | null;
  due_date: string | null;
  estimate: number | null;
  position: number;
  sprint_id: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type WorkItemAssignee = {
  work_item_id: string;
  user_id: string;
  workspace_id: string;
  assigned_at: string;
};

export type WorkItemWatcher = {
  work_item_id: string;
  user_id: string;
  workspace_id: string;
};

export type WorkItemDependency = {
  id: string;
  workspace_id: string;
  from_item_id: string;
  to_item_id: string;
  type: DependencyType;
};

export type CustomFieldDefinition = {
  id: string;
  workspace_id: string;
  name: string;
  field_type: CustomFieldType;
  options: Record<string, unknown> | null;
  created_by: string;
  created_at: string;
};

export type CustomFieldValue = {
  work_item_id: string;
  field_id: string;
  workspace_id: string;
  value: unknown;
};

export type Comment = {
  id: string;
  workspace_id: string;
  work_item_id: string | null;
  document_id: string | null;
  author_id: string;
  body: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Attachment = {
  id: string;
  workspace_id: string;
  work_item_id: string | null;
  storage_path: string;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  uploaded_by: string;
  created_at: string;
};

export type ActivityEvent = {
  id: string;
  workspace_id: string;
  entity_type: string;
  entity_id: string;
  actor_id: string | null;
  action: string;
  changes: Record<string, unknown> | null;
  created_at: string;
};

export type Label = {
  id: string;
  workspace_id: string;
  name: string;
  color: string;
  created_at: string;
};

export type WorkItemLabel = {
  work_item_id: string;
  label_id: string;
  workspace_id: string;
};

export type Sprint = {
  id: string;
  workspace_id: string;
  project_id: string;
  name: string;
  goal: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'planned' | 'active' | 'completed';
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  workspace_id: string;
  project_id: string | null;
  title: string;
  content: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Goal = {
  id: string;
  workspace_id: string;
  title: string;
  description: string | null;
  owner_id: string;
  scope: 'personal' | 'team' | 'project';
  scope_id: string | null;
  target_date: string | null;
  status: 'active' | 'completed' | 'cancelled';
  progress: number;
  progress_mode: 'auto' | 'manual' | 'numeric';
  target_value: number | null;
  current_value: number | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

export type Notification = {
  id: string;
  workspace_id: string;
  user_id: string;
  type: string;
  title: string;
  body: string;
  entity_type: string | null;
  entity_id: string | null;
  actor_id: string | null;
  read_at: string | null;
  created_at: string;
};

export type TimeEntry = {
  id: string;
  workspace_id: string;
  work_item_id: string;
  user_id: string;
  duration_minutes: number;
  description: string | null;
  logged_date: string;
  created_at: string;
  updated_at: string;
};

/* ============ DATABASE TYPE (Supabase GenericSchema compatible) ============ */

export interface Database {
  public: {
    Tables: {
      workspaces: {
        Row: Workspace;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          is_personal?: boolean;
          owner_id: string;
          plan?: string;
          settings?: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<{
          name: string;
          slug: string;
          is_personal: boolean;
          owner_id: string;
          plan: string;
          settings: Record<string, unknown>;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        }>;
        Relationships: [];
      };
      workspace_members: {
        Row: WorkspaceMember;
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          role?: WorkspaceRole;
          invited_by?: string | null;
          joined_at?: string;
        };
        Update: Partial<{
          workspace_id: string;
          user_id: string;
          role: WorkspaceRole;
          invited_by: string | null;
          joined_at: string;
        }>;
        Relationships: [];
      };
      teams: {
        Row: Team;
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          key: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<{
          workspace_id: string;
          name: string;
          key: string;
          description: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        }>;
        Relationships: [];
      };
      team_members: {
        Row: TeamMember;
        Insert: {
          id?: string;
          team_id: string;
          user_id: string;
          workspace_id: string;
          role?: WorkspaceRole;
        };
        Update: Partial<{
          team_id: string;
          user_id: string;
          workspace_id: string;
          role: WorkspaceRole;
        }>;
        Relationships: [];
      };
      projects: {
        Row: Project;
        Insert: {
          id?: string;
          workspace_id: string;
          team_id?: string | null;
          name: string;
          key: string;
          description?: string | null;
          mode?: ProjectMode;
          is_personal?: boolean;
          item_counter?: number;
          archived_at?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<{
          workspace_id: string;
          team_id: string | null;
          name: string;
          key: string;
          description: string | null;
          mode: ProjectMode;
          is_personal: boolean;
          item_counter: number;
          archived_at: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        }>;
        Relationships: [];
      };
      project_members: {
        Row: ProjectMember;
        Insert: {
          id?: string;
          project_id: string;
          user_id: string;
          workspace_id: string;
          role?: WorkspaceRole;
        };
        Update: Partial<{
          project_id: string;
          user_id: string;
          workspace_id: string;
          role: WorkspaceRole;
        }>;
        Relationships: [];
      };
      work_items: {
        Row: WorkItem;
        Insert: {
          id?: string;
          workspace_id: string;
          project_id: string;
          team_id?: string | null;
          parent_id?: string | null;
          type_id: string;
          status_id: string;
          sequence?: number;
          title: string;
          description?: Record<string, unknown> | null;
          priority?: number;
          creator_id: string;
          start_date?: string | null;
          due_date?: string | null;
          estimate?: number | null;
          position?: number;
          sprint_id?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<{
          workspace_id: string;
          project_id: string;
          team_id: string | null;
          parent_id: string | null;
          type_id: string;
          status_id: string;
          sequence: number;
          title: string;
          description: Record<string, unknown> | null;
          priority: number;
          creator_id: string;
          start_date: string | null;
          due_date: string | null;
          estimate: number | null;
          position: number;
          sprint_id: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        }>;
        Relationships: [];
      };
      work_item_assignees: {
        Row: WorkItemAssignee;
        Insert: {
          work_item_id: string;
          user_id: string;
          workspace_id: string;
          assigned_at?: string;
        };
        Update: Partial<{
          work_item_id: string;
          user_id: string;
          workspace_id: string;
          assigned_at: string;
        }>;
        Relationships: [];
      };
      work_item_watchers: {
        Row: WorkItemWatcher;
        Insert: {
          work_item_id: string;
          user_id: string;
          workspace_id: string;
        };
        Update: Partial<{
          work_item_id: string;
          user_id: string;
          workspace_id: string;
        }>;
        Relationships: [];
      };
      work_item_labels: {
        Row: WorkItemLabel;
        Insert: {
          work_item_id: string;
          label_id: string;
          workspace_id: string;
        };
        Update: Partial<{
          work_item_id: string;
          label_id: string;
          workspace_id: string;
        }>;
        Relationships: [];
      };
      work_item_dependencies: {
        Row: WorkItemDependency;
        Insert: {
          id?: string;
          workspace_id: string;
          from_item_id: string;
          to_item_id: string;
          type: DependencyType;
        };
        Update: Partial<{
          workspace_id: string;
          from_item_id: string;
          to_item_id: string;
          type: DependencyType;
        }>;
        Relationships: [];
      };
      custom_field_definitions: {
        Row: CustomFieldDefinition;
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          field_type: CustomFieldType;
          options?: Record<string, unknown> | null;
          created_by: string;
          created_at?: string;
        };
        Update: Partial<{
          workspace_id: string;
          name: string;
          field_type: CustomFieldType;
          options: Record<string, unknown> | null;
          created_by: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      custom_field_values: {
        Row: CustomFieldValue;
        Insert: {
          work_item_id: string;
          field_id: string;
          workspace_id: string;
          value?: unknown;
        };
        Update: Partial<{
          work_item_id: string;
          field_id: string;
          workspace_id: string;
          value: unknown;
        }>;
        Relationships: [];
      };
      work_item_types: {
        Row: WorkItemType;
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          icon?: string | null;
          color?: string | null;
          is_system?: boolean;
          created_at?: string;
        };
        Update: Partial<{
          workspace_id: string;
          name: string;
          icon: string | null;
          color: string | null;
          is_system: boolean;
          created_at: string;
        }>;
        Relationships: [];
      };
      statuses: {
        Row: Status;
        Insert: {
          id?: string;
          workspace_id: string;
          project_id: string;
          name: string;
          category: StatusCategory;
          position: number;
          color?: string;
          created_at?: string;
        };
        Update: Partial<{
          workspace_id: string;
          project_id: string;
          name: string;
          category: StatusCategory;
          position: number;
          color: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      comments: {
        Row: Comment;
        Insert: {
          id?: string;
          workspace_id: string;
          work_item_id?: string | null;
          document_id?: string | null;
          author_id: string;
          body: Record<string, unknown>;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<{
          workspace_id: string;
          work_item_id: string | null;
          document_id: string | null;
          author_id: string;
          body: Record<string, unknown>;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        }>;
        Relationships: [];
      };
      attachments: {
        Row: Attachment;
        Insert: {
          id?: string;
          workspace_id: string;
          work_item_id?: string | null;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          uploaded_by: string;
          created_at?: string;
        };
        Update: Partial<{
          workspace_id: string;
          work_item_id: string | null;
          storage_path: string;
          file_name: string;
          mime_type: string;
          size_bytes: number;
          uploaded_by: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      labels: {
        Row: Label;
        Insert: {
          id?: string;
          workspace_id: string;
          name: string;
          color?: string;
          created_at?: string;
        };
        Update: Partial<{
          workspace_id: string;
          name: string;
          color: string;
          created_at: string;
        }>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: {
          id?: string;
          workspace_id: string;
          user_id: string;
          type: string;
          title: string;
          body?: string;
          entity_type?: string | null;
          entity_id?: string | null;
          actor_id?: string | null;
          read_at?: string | null;
          created_at?: string;
        };
        Update: Partial<{
          workspace_id: string;
          user_id: string;
          type: string;
          title: string;
          body: string;
          entity_type: string | null;
          entity_id: string | null;
          actor_id: string | null;
          read_at: string | null;
          created_at: string;
        }>;
        Relationships: [];
      };
      activity_events: {
        Row: ActivityEvent;
        Insert: {
          id?: string;
          workspace_id: string;
          entity_type: string;
          entity_id: string;
          actor_id?: string | null;
          action: string;
          changes?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: Partial<{
          workspace_id: string;
          entity_type: string;
          entity_id: string;
          actor_id: string | null;
          action: string;
          changes: Record<string, unknown> | null;
          created_at: string;
        }>;
        Relationships: [];
      };
      sprints: {
        Row: Sprint;
        Insert: {
          id?: string;
          workspace_id: string;
          project_id: string;
          name: string;
          goal?: string | null;
          start_date?: string | null;
          end_date?: string | null;
          status?: 'planned' | 'active' | 'completed';
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          workspace_id: string;
          project_id: string;
          name: string;
          goal: string | null;
          start_date: string | null;
          end_date: string | null;
          status: 'planned' | 'active' | 'completed';
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
      documents: {
        Row: Document;
        Insert: {
          id?: string;
          workspace_id: string;
          project_id?: string | null;
          title: string;
          content?: Record<string, unknown>;
          created_by: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<{
          workspace_id: string;
          project_id: string | null;
          title: string;
          content: Record<string, unknown>;
          created_by: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        }>;
        Relationships: [];
      };
      goals: {
        Row: Goal;
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          description?: string | null;
          owner_id: string;
          scope: 'personal' | 'team' | 'project';
          scope_id?: string | null;
          target_date?: string | null;
          status?: 'active' | 'completed' | 'cancelled';
          progress?: number;
          progress_mode?: 'auto' | 'manual' | 'numeric';
          target_value?: number | null;
          current_value?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: Partial<{
          workspace_id: string;
          title: string;
          description: string | null;
          owner_id: string;
          scope: 'personal' | 'team' | 'project';
          scope_id: string | null;
          target_date: string | null;
          status: 'active' | 'completed' | 'cancelled';
          progress: number;
          progress_mode: 'auto' | 'manual' | 'numeric';
          target_value: number | null;
          current_value: number | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        }>;
        Relationships: [];
      };
      time_entries: {
        Row: TimeEntry;
        Insert: {
          id?: string;
          workspace_id: string;
          work_item_id: string;
          user_id: string;
          duration_minutes: number;
          description?: string | null;
          logged_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<{
          workspace_id: string;
          work_item_id: string;
          user_id: string;
          duration_minutes: number;
          description: string | null;
          logged_date: string;
          created_at: string;
          updated_at: string;
        }>;
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      next_work_item_sequence: {
        Args: { p_project_id: string };
        Returns: number;
      };
      auth_workspace_ids: {
        Args: Record<PropertyKey, never>;
        Returns: string[];
      };
      has_workspace_role: {
        Args: { ws: string; min_role: WorkspaceRole };
        Returns: boolean;
      };
      get_workspace_role: {
        Args: { ws: string };
        Returns: WorkspaceRole;
      };
    };
    Enums: {
      workspace_role: WorkspaceRole;
      status_category: StatusCategory;
      dependency_type: DependencyType;
      custom_field_type: CustomFieldType;
      project_mode: ProjectMode;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
