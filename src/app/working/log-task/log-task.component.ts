import { Component, OnInit } from '@angular/core';
import { TaskService, Task } from '../services/task.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-log-task',
  templateUrl: './log-task.component.html',
  styleUrls: ['./log-task.component.css']
})
export class LogTaskComponent implements OnInit {
  tasks: Task[] = [];
  task: Task = {
    subject: '',
    workType: '',
    hours: 0,
    date: '',
    description: ''
  };

  totalHours: number = 0;
  workTypeTotals: { [key: string]: number } = {};
  subjectTotals: { [key: string]: number } = {};
  filter = {
    search: '',
    subject: '',
    workType: '',
    fromDate: '',
    toDate: ''
  };

  constructor(
    private taskService: TaskService,
    private location: Location,
    private router: Router
  ) {
    console.log('LogTaskComponent initialized');
  }
  
  // Go back to previous page
  goBack(): void {
    // Navigate to dashboard instead of using location.back()
    // to avoid authentication issues
    this.router.navigate(['/dashboard']);
  }

  ngOnInit(): void {
    console.log('LogTaskComponent: ngOnInit');
    // Try to load filter preferences from localStorage
    this.loadFilterPreferences();
    
    this.taskService.getTasks().subscribe(tasks => {
      console.log(`LogTaskComponent: Received ${tasks.length} tasks from service`);
      this.tasks = tasks;
      this.calculateSummaries();
    });
  }
  
  private loadFilterPreferences(): void {
    console.log('Loading filter preferences from localStorage');
    const savedFilter = localStorage.getItem('workfolio_task_filter');
    if (savedFilter) {
      try {
        this.filter = JSON.parse(savedFilter);
        console.log('Loaded filter preferences:', this.filter);
      } catch (e) {
        console.error('Error loading filter preferences:', e);
      }
    }
  }
  
  private saveFilterPreferences(): void {
    console.log('Saving filter preferences to localStorage');
    localStorage.setItem('workfolio_task_filter', JSON.stringify(this.filter));
  }

  addTask(): void {
    console.log('Adding task:', this.task);
    if (!this.task.subject || !this.task.workType || !this.task.hours || !this.task.date) {
      console.warn('Cannot add task: Missing required fields');
      return;
    }

    this.taskService.addTask({ ...this.task });
    console.log('Task added successfully');
    
    // Save last used subject and work type to localStorage for convenience
    localStorage.setItem('workfolio_last_subject', this.task.subject);
    localStorage.setItem('workfolio_last_workType', this.task.workType);
    
    // Reset form
    this.task = {
      subject: '',
      workType: '',
      hours: 0,
      date: '',
      description: ''
    };
  }

  calculateSummaries(): void {
    console.log('Calculating task summaries');
    this.totalHours = 0;
    this.workTypeTotals = {};
    this.subjectTotals = {};

    for (const task of this.tasks) {
      this.totalHours += task.hours;

      if (!this.workTypeTotals[task.workType]) {
        this.workTypeTotals[task.workType] = 0;
      }
      this.workTypeTotals[task.workType] += task.hours;

      if (!this.subjectTotals[task.subject]) {
        this.subjectTotals[task.subject] = 0;
      }
      this.subjectTotals[task.subject] += task.hours;
    }
    
    console.log('Summary calculated:', {
      totalHours: this.totalHours,
      workTypeTotals: this.workTypeTotals,
      subjectTotals: this.subjectTotals
    });
    
    // Save summaries to localStorage for quick access
    localStorage.setItem('workfolio_task_summary', JSON.stringify({
      totalHours: this.totalHours,
      workTypeTotals: this.workTypeTotals,
      subjectTotals: this.subjectTotals
    }));
  }

  objectKeys(obj: any): string[] {
    return Object.keys(obj);
  }
  
  applyFilter(): void {
    console.log('Applying filter:', this.filter);
    this.saveFilterPreferences();
    // Filter logic would go here if implemented
  }
  
  clearFilter(): void {
    console.log('Clearing filter');
    this.filter = {
      search: '',
      subject: '',
      workType: '',
      fromDate: '',
      toDate: ''
    };
    this.saveFilterPreferences();
  }
}
