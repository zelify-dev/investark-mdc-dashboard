import { DashboardData, RecentActivity, Task, Indicator, FavoriteView } from '../types/dashboard.types';

export const dashboardService = {
  getDashboardData: async (): Promise<DashboardData> => {
    // Simulated delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const activities: RecentActivity[] = Array.from({ length: 50 }).map((_, i) => ({
      id: `act-${i}`,
      type: i % 3 === 0 ? 'system' : 'action',
      description: i % 3 === 0 
        ? `System update completed: Version 1.${i}.0` 
        : `User ${i % 5 === 0 ? 'Admin' : 'Operator'} performed action #${i + 100}`,
      timestamp: new Date(Date.now() - i * 3600000).toISOString(),
      user: i % 3 !== 0 ? `User ${i % 5 + 1}` : undefined,
    }));

    const tasks: Task[] = Array.from({ length: 15 }).map((_, i) => ({
      id: `task-${i}`,
      title: `Task #${i + 1}: ${i % 2 === 0 ? 'Review document' : 'Contact client'}`,
      dueDate: new Date(Date.now() + i * 86400000).toISOString(),
      status: i % 5 === 0 ? 'completed' : i % 3 === 0 ? 'in_progress' : 'pending',
      priority: i % 4 === 0 ? 'high' : i % 2 === 0 ? 'medium' : 'low',
    }));

    const favorites: FavoriteView[] = [
      { id: '1', title: 'Active Clients', path: '/customers?status=active' },
      { id: '2', title: 'Pending Transfers', path: '/transactions/transfers?status=pending' },
      { id: '3', title: 'System Logs', path: '/settings/logs' },
      { id: '4', title: 'Monthly Reports', path: '/reports/monthly' },
    ];

    const indicators: Indicator[] = [
      { id: '1', label: 'Active Users', value: '12,450', change: 12.5, trend: 'up' },
      { id: '2', label: 'Total Volume', value: '$1.2M', change: -2.3, trend: 'down' },
      { id: '3', label: 'System Health', value: '99.9%', change: 0.1, trend: 'up' },
      { id: '4', label: 'Pending KYC', value: '45', change: 5.0, trend: 'neutral' },
    ];

    return {
      activities,
      tasks,
      favorites,
      indicators,
    };
  },
};
