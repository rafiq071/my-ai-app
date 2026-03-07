export interface ProjectFile {
  id: string;
  project_id: string;
  path: string;
  content: string;
  type: string;
  created_at?: string;
  updated_at?: string;
}

export interface Project {
  id: string;
  name: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}
