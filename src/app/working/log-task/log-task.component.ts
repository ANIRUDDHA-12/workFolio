import { Component, OnInit } from '@angular/core';
import { LogTaskService, Task } from '../services/log-task.service';

@Component({
  selector: 'app-log-task',
  templateUrl: './log-task.component.html',
})
export class LogTaskComponent implements OnInit {
  tasks: Task[] = [];
  newTask: Task = {
    subject: '',
    workType: '',
    hours: 0,
    date: '',
    description: ''
  };

  constructor(private logTaskService: LogTaskService) {}

  ngOnInit(): void {
    this.tasks = this.logTaskService.getTasks();
  }

  submitTask() {
    this.logTaskService.addTask(this.newTask);
    this.tasks = this.logTaskService.getTasks(); // reload updated tasks
    this.newTask = { subject: '', workType: '', hours: 0, date: '', description: '' }; // clear form
  }
}
