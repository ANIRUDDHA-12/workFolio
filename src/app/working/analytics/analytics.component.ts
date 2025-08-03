import { Component, OnInit } from '@angular/core';
import { TaskService, Task } from '../services/task.service'; // Use consistent service
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-analytics',
  templateUrl: './analytics.component.html',
  styleUrls: ['./analytics.component.css']
})
export class AnalyticsComponent implements OnInit {
  // Summary cards
  totalTasks: number = 0;
  totalHours: number = 0;
  activeSubjects: number = 0;

  // Distribution
  workTypeDistribution: Record<string, number> = {};
  subjectDistribution: Record<string, number> = {};

  // Charts
  workTypeLabels: string[] = [];
  workTypeData: number[] = [];
  subjectLabels: string[] = [];
  subjectData: number[] = [];

  // Weekly progress
  weeklyGoal: number = 40;
  weeklyProgress: number = 0;

  // Recent activities
  recentTasks: Task[] = [];

  // Subject analytics table
  subjects: { name: string; hours: number; taskCount: number }[] = [];

  constructor(
    private taskService: TaskService,
    private location: Location,
    private router: Router
  ) {
    console.log('AnalyticsComponent initialized');
    // Try to load weekly goal from localStorage
    this.loadWeeklyGoal();
  }
  
  // Go back to previous page
  goBack(): void {
    // Navigate to dashboard instead of using location.back()
    // to avoid authentication issues
    this.router.navigate(['/dashboard']);
  }
  
  private loadWeeklyGoal(): void {
    console.log('Loading weekly goal from localStorage');
    const savedGoal = localStorage.getItem('workfolio_weekly_goal');
    if (savedGoal) {
      try {
        this.weeklyGoal = JSON.parse(savedGoal);
        console.log(`Loaded weekly goal: ${this.weeklyGoal} hours`);
      } catch (e) {
        console.error('Error loading weekly goal:', e);
      }
    }
  }
  
  private saveWeeklyGoal(): void {
    console.log(`Saving weekly goal: ${this.weeklyGoal} hours`);
    localStorage.setItem('workfolio_weekly_goal', JSON.stringify(this.weeklyGoal));
  }

  ngOnInit(): void {
    console.log('AnalyticsComponent: ngOnInit');
    
    // Try to load analytics data from localStorage first for immediate display
    this.loadAnalyticsFromStorage();
    
    this.taskService.getTasks().subscribe(() => {
      console.log('AnalyticsComponent: Tasks updated, refreshing analytics');
      this.fetchAnalyticsData();
    });

    // Initial fetch
    this.fetchAnalyticsData();
  }
  
  private loadAnalyticsFromStorage(): void {
    console.log('Loading analytics data from localStorage');
    const savedAnalytics = localStorage.getItem('workfolio_analytics_data');
    if (savedAnalytics) {
      try {
        const data = JSON.parse(savedAnalytics);
        console.log('Loaded analytics data from localStorage');
        
        // Update component properties with saved data
        this.totalTasks = data.totalTasks || 0;
        this.totalHours = data.totalHours || 0;
        this.activeSubjects = data.activeSubjects || 0;
        this.workTypeDistribution = data.workTypeDistribution || {};
        this.subjectDistribution = data.subjectDistribution || {};
        this.weeklyProgress = data.weeklyProgress || 0;
        
        // Prepare chart data from loaded data
        this.prepareChartData();
      } catch (e) {
        console.error('Error loading analytics data:', e);
      }
    } else {
      console.log('No saved analytics data found');
    }
  }

  fetchAnalyticsData(): void {
    console.log('Fetching analytics data');
    const stats = this.taskService.getTaskStats();

    this.totalTasks = stats.totalTasks;
    this.totalHours = stats.totalHours;
    this.activeSubjects = stats.activeSubjects;
    this.workTypeDistribution = stats.workTypeDistribution;
    this.subjectDistribution = stats.subjectDistribution;
    this.recentTasks = stats.recentTasks;

    this.weeklyProgress = (this.totalHours / this.weeklyGoal) * 100;
    console.log(`Weekly progress: ${this.weeklyProgress.toFixed(2)}% (${this.totalHours}/${this.weeklyGoal} hours)`);
    
    this.prepareChartData();
    this.prepareSubjectTable();
    
    // Save analytics data to localStorage
    this.saveAnalyticsToStorage();
  }
  
  private saveAnalyticsToStorage(): void {
    console.log('Saving analytics data to localStorage');
    const analyticsData = {
      totalTasks: this.totalTasks,
      totalHours: this.totalHours,
      activeSubjects: this.activeSubjects,
      workTypeDistribution: this.workTypeDistribution,
      subjectDistribution: this.subjectDistribution,
      weeklyProgress: this.weeklyProgress,
      lastUpdated: new Date().toISOString()
    };
    
    localStorage.setItem('workfolio_analytics_data', JSON.stringify(analyticsData));
  }

  prepareChartData(): void {
    console.log('Preparing chart data');
    this.workTypeLabels = Object.keys(this.workTypeDistribution);
    this.workTypeData = this.workTypeLabels.map(label => this.workTypeDistribution[label]);

    this.subjectLabels = Object.keys(this.subjectDistribution);
    this.subjectData = this.subjectLabels.map(label => this.subjectDistribution[label]);
    
    console.log('Chart data prepared:', {
      workTypeLabels: this.workTypeLabels,
      workTypeData: this.workTypeData,
      subjectLabels: this.subjectLabels,
      subjectData: this.subjectData
    });
  }

  prepareSubjectTable(): void {
    console.log('Preparing subject table');
    this.subjects = this.subjectLabels.map((name, i) => ({
      name,
      hours: this.subjectDistribution[name],
      taskCount: this.taskService.getTaskCountBySubject(name)
    }));
    
    console.log('Subject table prepared:', this.subjects);
    
    // Save subject table data to localStorage
    localStorage.setItem('workfolio_subject_table', JSON.stringify(this.subjects));
  }

  getProgressColor(): string {
    if (this.weeklyProgress < 30) return '#ef4444'; // Red
    if (this.weeklyProgress < 70) return '#f59e0b'; // Amber
    return '#10b981'; // Green
  }
  
  updateWeeklyGoal(newGoal: number): void {
    console.log(`Updating weekly goal from ${this.weeklyGoal} to ${newGoal} hours`);
    this.weeklyGoal = newGoal;
    this.saveWeeklyGoal();
    
    // Recalculate progress with new goal
    this.weeklyProgress = (this.totalHours / this.weeklyGoal) * 100;
    console.log(`Updated weekly progress: ${this.weeklyProgress.toFixed(2)}%`);
    
    // Update localStorage
    this.saveAnalyticsToStorage();
  }
}
