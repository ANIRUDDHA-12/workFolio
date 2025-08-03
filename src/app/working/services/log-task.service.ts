import { Injectable } from '@angular/core';

export interface Task {
  subject: string;
  workType: string;
  hours: number;
  date: string;
  description?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LogTaskService {
  private storageKey = 'userTasks';

  getTasks(): Task[] {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : [];
  }

  setTasks(tasks: Task[]): void {
    localStorage.setItem(this.storageKey, JSON.stringify(tasks));
  }

  addTask(task: Task): void {
    const tasks = this.getTasks();
    tasks.push(task);
    this.setTasks(tasks);
  }
}
