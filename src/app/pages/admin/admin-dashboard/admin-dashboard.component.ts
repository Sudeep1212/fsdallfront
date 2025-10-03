import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { DashboardService, DashboardCounts, MonthlyRegistration } from '../../../services/dashboard.service';

interface EntityCount {
  name: string;
  count: number;
  icon: string;
  color: string;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface RecentActivity {
  id: number;
  action: string;
  entity: string;
  timestamp: Date;
  user: string;
  details: string;
}

interface ChartData {
  month: string;
  count: number;
  height: number;
  label: string;
}

interface ChartPoint {
  x: number;
  y: number;
  value: number;
  month: string;
  label: string;
}

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss']
})
export class AdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);

  entityCounts: EntityCount[] = [];
  recentActivities: RecentActivity[] = [];
  monthlyChartData: ChartData[] = [];
  chartPoints: ChartPoint[] = [];
  chartPath: string = '';
  chartLinePath: string = '';
  yAxisMax: number = 100;
  yAxisLabel1: number = 25;
  yAxisLabel2: number = 50;
  yAxisLabel3: number = 75;
  loading = false; // Start with false - no lazy loading
  error = '';

  // Mock API base URL - replace with actual backend endpoints
  private apiUrl = 'http://localhost:8080/api';

  ngOnInit(): void {
    this.loadDashboardData();
  }

  async loadDashboardData(): Promise<void> {
    try {
      // Load data silently in background - no loading spinner
      await Promise.all([
        this.loadEntityCounts(),
        this.loadRecentActivities(),
        this.loadMonthlyRegistrations()
      ]);
      
      // Force change detection to update UI immediately
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Silent failure - load mock data as fallback
      this.loadMockData();
      this.cdr.detectChanges();
    }
  }

  private async loadEntityCounts(): Promise<void> {
    try {
      const apiCounts = await this.dashboardService.getDashboardCounts().toPromise();
      
      if (!apiCounts) {
        throw new Error('No data received from API');
      }

      // Map API data to display format with icons and colors
      this.entityCounts = [
        { name: 'Events', count: apiCounts.events, icon: 'calendar', color: '#3A72EC' },
        { name: 'Clubs', count: apiCounts.clubs, icon: 'users', color: '#10B981' },
        { name: 'Participants', count: apiCounts.participants, icon: 'user-check', color: '#F59E0B' },
        { name: 'Registrations', count: apiCounts.registrations, icon: 'clipboard', color: '#8B5CF6' },
        { name: 'Sponsors', count: apiCounts.sponsors, icon: 'star', color: '#EF4444' },
        { name: 'Venues', count: apiCounts.venues, icon: 'map-pin', color: '#06B6D4' },
        { name: 'Volunteers', count: apiCounts.volunteers, icon: 'heart', color: '#EC4899' },
        { name: 'Budgets', count: apiCounts.budgets, icon: 'dollar-sign', color: '#84CC16' },
        { name: 'Departments', count: apiCounts.departments, icon: 'home', color: '#F97316' },
        { name: 'Results', count: apiCounts.results, icon: 'award', color: '#6366F1' },
        { name: 'Judges', count: apiCounts.judges, icon: 'scale', color: '#14B8A6' },
        { name: 'Feedback', count: apiCounts.feedback, icon: 'message-circle', color: '#F43F5E' },
      ];
    } catch (error) {
      console.error('Error loading entity counts from API:', error);
      // Fallback to mock data if API fails
      await this.loadMockEntityCounts();
    }
  }

  private async loadMockEntityCounts(): Promise<void> {
    // Fallback mock data
    const mockCounts = [
      { name: 'Events', count: 156, icon: 'calendar', color: '#3A72EC', change: '+12%', trend: 'up' as const },
      { name: 'Clubs', count: 24, icon: 'users', color: '#10B981', change: '+5%', trend: 'up' as const },
      { name: 'Participants', count: 2847, icon: 'user-check', color: '#F59E0B', change: '+18%', trend: 'up' as const },
      { name: 'Registrations', count: 1923, icon: 'clipboard', color: '#8B5CF6', change: '+8%', trend: 'up' as const },
      { name: 'Sponsors', count: 43, icon: 'star', color: '#EF4444', change: '+2%', trend: 'up' as const },
      { name: 'Venues', count: 18, icon: 'map-pin', color: '#06B6D4', change: '0%', trend: 'neutral' as const },
      { name: 'Volunteers', count: 287, icon: 'heart', color: '#EC4899', change: '+15%', trend: 'up' as const },
      { name: 'Budgets', count: 89, icon: 'dollar-sign', color: '#84CC16', change: '+7%', trend: 'up' as const },
      { name: 'Departments', count: 12, icon: 'home', color: '#F97316', change: '0%', trend: 'neutral' as const },
      { name: 'Results', count: 134, icon: 'award', color: '#6366F1', change: '+22%', trend: 'up' as const },
      { name: 'Judges', count: 56, icon: 'scale', color: '#14B8A6', change: '+4%', trend: 'up' as const },
      { name: 'Feedback', count: 892, icon: 'message-circle', color: '#F43F5E', change: '+31%', trend: 'up' as const },
    ];

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    this.entityCounts = mockCounts;
  }

  private async loadMonthlyRegistrations(): Promise<void> {
    try {
      const apiData = await this.dashboardService.getMonthlyRegistrations().toPromise();
      
      if (!apiData || apiData.length === 0) {
        this.loadMockMonthlyData();
        return;
      }

      // Filter for last 6 months (5 months ago + current month)
      const currentDate = new Date();
      const sixMonthsAgo = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);
      
      const filteredData = apiData.filter(item => {
        const [year, month] = item.month.split('-');
        const itemDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        return itemDate >= sixMonthsAgo && itemDate <= currentDate;
      });
      
      // Sort by date
      filteredData.sort((a, b) => a.month.localeCompare(b.month));
      
      // Ensure we have 6 months of data (fill missing months with 0)
      const completeData = this.fillMissingMonths(filteredData, sixMonthsAgo, currentDate);
      
      this.monthlyChartData = completeData;
      this.generateChartPaths(completeData);
      
    } catch (error) {
      console.error('Error loading monthly registrations:', error);
      this.loadMockMonthlyData();
    }
  }
  
  private fillMissingMonths(data: MonthlyRegistration[], startDate: Date, endDate: Date): ChartData[] {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const result: ChartData[] = [];
    
    const current = new Date(startDate);
    while (current <= endDate) {
      const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`;
      const existingData = data.find(d => d.month === monthKey);
      const count = existingData ? existingData.count : 0;
      
      result.push({
        month: monthKey,
        count: count,
        height: 0, // Will be calculated in generateChartPaths
        label: monthNames[current.getMonth()]
      });
      
      current.setMonth(current.getMonth() + 1);
    }
    
    return result;
  }
  
  private generateChartPaths(data: ChartData[]): void {
    if (data.length === 0) return;
    
    // Calculate max value for scaling
    const maxCount = Math.max(...data.map(d => d.count), 1);
    this.yAxisMax = Math.ceil(maxCount * 1.1); // Add 10% padding
    this.yAxisLabel1 = Math.round(this.yAxisMax * 0.25);
    this.yAxisLabel2 = Math.round(this.yAxisMax * 0.5);
    this.yAxisLabel3 = Math.round(this.yAxisMax * 0.75);
    
    // Chart dimensions
    const chartWidth = 700;
    const chartHeight = 200;
    const paddingLeft = 60;
    const paddingTop = 30;
    const spacing = chartWidth / (data.length - 1 || 1);
    
    // Generate points
    this.chartPoints = data.map((item, index) => {
      const x = paddingLeft + (index * spacing);
      const normalizedHeight = (item.count / this.yAxisMax) * chartHeight;
      const y = paddingTop + chartHeight - normalizedHeight;
      
      return {
        x,
        y,
        value: item.count,
        month: item.month,
        label: item.label
      };
    });
    
    // Generate line path (smooth curve using bezier)
    if (this.chartPoints.length > 0) {
      let linePath = `M ${this.chartPoints[0].x} ${this.chartPoints[0].y}`;
      
      for (let i = 1; i < this.chartPoints.length; i++) {
        const prev = this.chartPoints[i - 1];
        const curr = this.chartPoints[i];
        
        // Calculate control points for smooth curve
        const cp1x = prev.x + (curr.x - prev.x) / 3;
        const cp1y = prev.y;
        const cp2x = curr.x - (curr.x - prev.x) / 3;
        const cp2y = curr.y;
        
        linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${curr.x} ${curr.y}`;
      }
      
      this.chartLinePath = linePath;
      
      // Generate area path (same as line but closed to bottom)
      const areaPath = linePath + 
        ` L ${this.chartPoints[this.chartPoints.length - 1].x} ${paddingTop + chartHeight}` +
        ` L ${this.chartPoints[0].x} ${paddingTop + chartHeight} Z`;
      
      this.chartPath = areaPath;
    }
  }

  private loadMockMonthlyData(): void {
    // Fallback mock data for chart (last 6 months)
    const mockData = [
      { month: '2025-05', count: 45, height: 60, label: 'May' },
      { month: '2025-06', count: 62, height: 80, label: 'Jun' },
      { month: '2025-07', count: 38, height: 45, label: 'Jul' },
      { month: '2025-08', count: 78, height: 90, label: 'Aug' },
      { month: '2025-09', count: 56, height: 70, label: 'Sep' },
      { month: '2025-10', count: 69, height: 85, label: 'Oct' }
    ];
    
    this.monthlyChartData = mockData;
    this.generateChartPaths(mockData);
  }

  private async loadRecentActivities(): Promise<void> {
    // TODO: Replace with actual API endpoint
    const mockActivities: RecentActivity[] = [
      {
        id: 1,
        action: 'Created',
        entity: 'Event',
        timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
        user: 'Admin User',
        details: 'Tech Symposium 2025'
      },
      {
        id: 2,
        action: 'Updated',
        entity: 'Club',
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
        user: 'Admin User',
        details: 'Computer Science Club - Updated description'
      },
      {
        id: 3,
        action: 'Deleted',
        entity: 'Venue',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        user: 'Admin User',
        details: 'Old Auditorium - No longer available'
      },
      {
        id: 4,
        action: 'Created',
        entity: 'User',
        timestamp: new Date(Date.now() - 45 * 60 * 1000), // 45 minutes ago
        user: 'System',
        details: 'New student registration'
      },
      {
        id: 5,
        action: 'Updated',
        entity: 'Budget',
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        user: 'Admin User',
        details: 'Annual Tech Fest - Budget approved'
      }
    ];

    await new Promise(resolve => setTimeout(resolve, 600));
    this.recentActivities = mockActivities;
  }

  private loadMockData(): void {
    // Fallback mock data
    this.entityCounts = [
      { name: 'Events', count: 156, icon: 'calendar', color: '#3A72EC' },
      { name: 'Clubs', count: 24, icon: 'users', color: '#10B981' },
      { name: 'Participants', count: 2847, icon: 'user-check', color: '#F59E0B' },
      { name: 'Users', count: 3245, icon: 'users', color: '#059669' }
    ];
    
    this.recentActivities = [
      {
        id: 1,
        action: 'Created',
        entity: 'Event',
        timestamp: new Date(),
        user: 'Admin',
        details: 'Sample Event'
      }
    ];
    
    this.loading = false;
  }

  getIconSvg(iconName: string): string {
    const icons: { [key: string]: string } = {
      calendar: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" stroke="currentColor" stroke-width="2"/><line x1="16" y1="2" x2="16" y2="6" stroke="currentColor" stroke-width="2"/><line x1="8" y1="2" x2="8" y2="6" stroke="currentColor" stroke-width="2"/><line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" stroke-width="2"/></svg>`,
      
      users: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/><path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" stroke-width="2"/></svg>`,
      
      'user-check': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" stroke="currentColor" stroke-width="2"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2"/><polyline points="17,11 19,13 23,9" stroke="currentColor" stroke-width="2"/></svg>`,
      
      clipboard: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" stroke-width="2"/><polyline points="14,2 14,8 20,8" stroke="currentColor" stroke-width="2"/><line x1="16" y1="13" x2="8" y2="13" stroke="currentColor" stroke-width="2"/><line x1="16" y1="17" x2="8" y2="17" stroke="currentColor" stroke-width="2"/></svg>`,
      
      star: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke="currentColor" stroke-width="2" fill="none"/></svg>`,
      
      'map-pin': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="3" stroke="currentColor" stroke-width="2"/></svg>`,
      
      heart: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" stroke-width="2"/></svg>`,
      
      'dollar-sign': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><line x1="12" y1="1" x2="12" y2="23" stroke="currentColor" stroke-width="2"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" stroke="currentColor" stroke-width="2"/></svg>`,
      
      home: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" stroke="currentColor" stroke-width="2"/><polyline points="9,22 9,12 15,12 15,22" stroke="currentColor" stroke-width="2"/></svg>`,
      
      award: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="8" r="7" stroke="currentColor" stroke-width="2"/><polyline points="8.21,13.89 7,23 12,20 17,23 15.79,13.88" stroke="currentColor" stroke-width="2"/></svg>`,
      
      scale: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M16 11c0 2.21-1.79 4-4 4s-4-1.79-4-4 1.79-4 4-4 4 1.79 4 4z" stroke="currentColor" stroke-width="2"/><path d="M12 2v7" stroke="currentColor" stroke-width="2"/></svg>`,
      
      'message-circle': `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" stroke="currentColor" stroke-width="2"/></svg>`
    };
    
    return icons[iconName] || icons['users'];
  }

  refreshData(): void {
    this.loadDashboardData();
  }

  formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  }

  trackByEntityName(index: number, entity: EntityCount): string {
    return entity.name;
  }

  trackByActivityId(index: number, activity: RecentActivity): number {
    return activity.id;
  }

  getEntityDescription(entityName: string): string {
    const descriptions: { [key: string]: string } = {
      'Events': 'Active events this semester',
      'Clubs': 'Registered student clubs',
      'Participants': 'Total registered participants',
      'Registrations': 'Event registrations this month',
      'Sponsors': 'Active event sponsors',
      'Venues': 'Available event venues',
      'Volunteers': 'Active volunteers helping',
      'Budgets': 'Approved event budgets',
      'Departments': 'Participating departments',
      'Results': 'Published event results',
      'Judges': 'Available event judges',
      'Feedback': 'Collected feedback responses'
    };
    return descriptions[entityName] || 'Entity information';
  }
}