import { Component, OnInit } from '@angular/core';
import { LogTaskService, Task } from '../services/log-task.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  userName = 'User'; // Replace or fetch from auth
  tasks: Task[] = [];

  constructor(private logTaskService: LogTaskService, private router: Router) {}

  ngOnInit(): void {
    this.tasks = this.logTaskService.getTasks();
  }

  get totalTasks(): number {
    return this.tasks.length;
  }

  get totalHours(): number {
    return this.tasks.reduce((sum, task) => sum + task.hours, 0);
  }

  get activeSubjects(): number {
    return new Set(this.tasks.map(task => task.subject)).size;
  }

  logFirstTask() {
    this.router.navigate(['/log-task']);
  }

  logout() {
    // Implement logout logic (e.g., clear token, redirect)
    this.router.navigate(['/login']);
  }
}
