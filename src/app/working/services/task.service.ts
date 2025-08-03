import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

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
export class TaskService {
  private tasks: Task[] = [];
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  
  constructor() {
    // Try to load tasks from localStorage on service initialization
    this.loadTasksFromStorage();
    console.log('TaskService initialized');
  }

  private loadTasksFromStorage(): void {
    console.log('Loading tasks from localStorage');
    const storedTasks = localStorage.getItem('workfolio_tasks');
    if (storedTasks) {
      try {
        this.tasks = JSON.parse(storedTasks);
        this.tasksSubject.next([...this.tasks]);
        console.log(`Loaded ${this.tasks.length} tasks from localStorage`);
      } catch (e) {
        console.error('Error loading tasks from storage:', e);
        // Initialize empty tasks array on error
        this.tasks = [];
        this.tasksSubject.next([]);
      }
    } else {
      console.log('No tasks found in localStorage');
    }
  }

  private saveTasksToStorage(): void {
    console.log(`Saving ${this.tasks.length} tasks to localStorage`);
    localStorage.setItem('workfolio_tasks', JSON.stringify(this.tasks));
    // Also save task statistics for quick access
    const stats = this.calculateTaskStats();
    localStorage.setItem('workfolio_task_stats', JSON.stringify(stats));
  }

  getTasks(): Observable<Task[]> {
    return this.tasksSubject.asObservable().pipe(
      tap(tasks => console.log(`Retrieved ${tasks.length} tasks`))
    );
  }

  addTask(task: Task): void {
    console.log('Adding new task:', task);
    this.tasks.push({...task});
    this.tasksSubject.next([...this.tasks]);
    this.saveTasksToStorage();
  }

  private calculateTaskStats() {
    const totalTasks = this.tasks.length;
    const totalHours = this.tasks.reduce((sum, task) => sum + task.hours, 0);
    
    // Get unique subjects
    const uniqueSubjects = new Set(this.tasks.map(task => task.subject));
    const activeSubjects = uniqueSubjects.size;
    
    // Get work type distribution
    const workTypeDistribution = this.tasks.reduce((acc, task) => {
      acc[task.workType] = (acc[task.workType] || 0) + task.hours;
      return acc;
    }, {} as Record<string, number>);
    
    // Get subject distribution
    const subjectDistribution = this.tasks.reduce((acc, task) => {
      acc[task.subject] = (acc[task.subject] || 0) + task.hours;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalTasks,
      totalHours,
      activeSubjects,
      workTypeDistribution,
      subjectDistribution,
      recentTasks: this.tasks.slice(-5).reverse() // Get 5 most recent tasks
    };
  }

  getTaskStats() {
    console.log('Getting task statistics');
    // Try to get cached stats from localStorage first
    const cachedStats = localStorage.getItem('workfolio_task_stats');
    if (cachedStats && this.tasks.length > 0) {
      try {
        const stats = JSON.parse(cachedStats);
        console.log('Retrieved cached task statistics from localStorage');
        return stats;
      } catch (e) {
        console.error('Error parsing cached task statistics:', e);
      }
    }
    
    // Calculate fresh stats if cache not available
    const stats = this.calculateTaskStats();
    console.log('Calculated fresh task statistics');
    return stats;
  }

  clearTasks(): void {
    console.log('Clearing all tasks');
    this.tasks = [];
    this.tasksSubject.next([]);
    this.saveTasksToStorage();
    // Also clear stats
    localStorage.removeItem('workfolio_task_stats');
  }

  getTaskCountBySubject(subject: string): number {
    const count = this.tasks.filter(task => task.subject === subject).length;
    console.log(`Count for subject ${subject}: ${count} tasks`);
    return count;
  }
}