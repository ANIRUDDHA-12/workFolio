import { Component, OnInit } from '@angular/core';
import { TaskService, Task } from '../services/task.service';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-log-task',
  templateUrl: './log-task.component.html',
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
  ) {}

  ngOnInit(): void {
    this.loadFilterPreferences();

    this.taskService.getTasks().subscribe(tasks => {
      this.tasks = tasks;
      this.calculateSummaries();
    });
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  private loadFilterPreferences(): void {
    const savedFilter = localStorage.getItem('workfolio_task_filter');
    if (savedFilter) {
      try {
        this.filter = JSON.parse(savedFilter);
      } catch (e) {
        console.error('Error loading filter preferences:', e);
      }
    }
  }

  private saveFilterPreferences(): void {
    localStorage.setItem('workfolio_task_filter', JSON.stringify(this.filter));
  }

  addTask(): void {
    if (!this.task.subject || !this.task.workType || !this.task.hours || !this.task.date) {
      return;
    }

    this.taskService.addTask({ ...this.task });

    localStorage.setItem('workfolio_last_subject', this.task.subject);
    localStorage.setItem('workfolio_last_workType', this.task.workType);

    this.task = {
      subject: '',
      workType: '',
      hours: 0,
      date: '',
      description: ''
    };
  }

  calculateSummaries(): void {
    this.totalHours = 0;
    this.workTypeTotals = {};
    this.subjectTotals = {};

    for (const task of this.tasks) {
      this.totalHours += task.hours;

      this.workTypeTotals[task.workType] = (this.workTypeTotals[task.workType] || 0) + task.hours;
      this.subjectTotals[task.subject] = (this.subjectTotals[task.subject] || 0) + task.hours;
    }

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
    this.saveFilterPreferences();
    // Optional: implement filtering logic here
  }

  clearFilter(): void {
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
