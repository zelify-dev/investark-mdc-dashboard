export interface RecentActivity {
  id: string;
  type: 'system' | 'action';
  description: string;
  timestamp: string;
  user?: string;
}

export interface Task {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'completed' | 'in_progress';
  priority: 'low' | 'medium' | 'high';
}

export interface FavoriteView {
  id: string;
  title: string;
  path: string;
  icon?: string;
}

export interface Indicator {
  id: string;
  label: string;
  value: string | number;
  change: number; // percentage change
  trend: 'up' | 'down' | 'neutral';
}

export interface DashboardData {
  activities: RecentActivity[];
  tasks: Task[];
  favorites: FavoriteView[];
  indicators: Indicator[];
}
