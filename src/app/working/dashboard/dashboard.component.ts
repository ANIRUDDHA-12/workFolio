import { Component, OnInit } from '@angular/core';
import { TaskService, Task } from '../services/task.service';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { DatePipe } from '@angular/common';
import { Location } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
  providers: [DatePipe]
})
export class DashboardComponent implements OnInit {
  totalTasks: number = 0;
  totalHours: number = 0.0;
  activeSubjects: number = 0;
  userName: string = '';
  userProfileImage: string | null = null;
  recentTasks: Task[] = [];
  isSharing: boolean = false;
  isGeneratingPDF: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private taskService: TaskService,
    private datePipe: DatePipe,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.loadDashboardFromStorage();
    const user = this.authService.currentUserValue;

    if (user) {
      this.userName = user.name || user.email?.split('@')[0] || localStorage.getItem('loggedInUsername') || 'User';
      this.userProfileImage = user.profileImage || null;
      this.saveUserPreferences();
    }

    this.taskService.getTasks().subscribe(() => {
      const stats = this.taskService.getTaskStats();
      this.totalTasks = stats.totalTasks;
      this.totalHours = stats.totalHours;
      this.activeSubjects = stats.activeSubjects;
      this.recentTasks = stats.recentTasks;
      this.saveDashboardToStorage();
    });
  }

  private loadDashboardFromStorage(): void {
    const savedDashboard = localStorage.getItem('workfolio_dashboard_data');
    if (savedDashboard) {
      try {
        const data = JSON.parse(savedDashboard);
        this.totalTasks = data.totalTasks || 0;
        this.totalHours = data.totalHours || 0;
        this.activeSubjects = data.activeSubjects || 0;
        this.recentTasks = data.recentTasks || [];
      } catch (e) {
        console.error('Error loading dashboard data:', e);
      }
    }
  }

  private saveDashboardToStorage(): void {
    const dashboardData = {
      totalTasks: this.totalTasks,
      totalHours: this.totalHours,
      activeSubjects: this.activeSubjects,
      recentTasks: this.recentTasks,
      lastUpdated: new Date().toISOString()
    };
    localStorage.setItem('workfolio_dashboard_data', JSON.stringify(dashboardData));
  }

  private saveUserPreferences(): void {
    const userPrefs = {
      userName: this.userName,
      userProfileImage: this.userProfileImage,
      lastLogin: new Date().toISOString()
    };
    localStorage.setItem('workfolio_user_prefs', JSON.stringify(userPrefs));
  }

  logFirstTask(): void {
    localStorage.setItem('workfolio_first_task', 'true');
    this.router.navigate(['/log-task']);
  }

  navigateToTab(tab: string): void {
    localStorage.setItem('workfolio_last_tab', tab);
    this.router.navigate([tab]);
  }

  logout(): void {
    localStorage.setItem('workfolio_last_logout', new Date().toISOString());
    this.authService.logout();
  }

  private formatTasksForSharing(todayOnly: boolean = true): string {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    let tasksToShare: Task[] = [];

    if (todayOnly) {
      const todaysTasks = this.recentTasks.filter(task => task.date.split('T')[0] === todayStr);
      tasksToShare = todaysTasks.length > 0 ? todaysTasks : this.recentTasks;
    } else {
      tasksToShare = this.recentTasks;
    }

    const dateFormatted = this.datePipe.transform(today, 'fullDate');
    let message = `📚 *WorkFolio Tasks Report* 📚\n\n`;
    message += `📅 *Date:* ${dateFormatted}\n`;
    message += `👤 *Faculty:* ${this.userName}\n`;
    message += `📊 *Total Tasks:* ${this.totalTasks}\n`;
    message += `⏱️ *Total Hours:* ${this.totalHours.toFixed(1)}h\n\n`;

    if (tasksToShare.length === 0) {
      message += `No tasks logged yet.\n`;
    } else {
      message += todayOnly ? `*Today's Tasks:*\n\n` : `*Recent Tasks:*\n\n`;
      tasksToShare.forEach((task, index) => {
        const taskDate = this.datePipe.transform(new Date(task.date), 'mediumDate');
        message += `*${index + 1}. ${task.subject}* (${task.workType})\n`;
        message += `   📅 ${taskDate} | ⏱️ ${task.hours}h\n`;
        if (task.description) {
          message += `   📝 ${task.description}\n`;
        }
        message += `\n`;
      });

      const totalHours = tasksToShare.reduce((sum, task) => sum + task.hours, 0);
      message += `*Displayed Tasks Hours:* ${totalHours.toFixed(1)}h\n`;
    }

    message += `\n📲 *Shared from WorkFolio App*\n`;
    this.trackSharing('formatted');
    return message;
  }

  shareViaWhatsApp(): void {
    this.isSharing = true;
    setTimeout(() => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const hasTodaysTasks = this.recentTasks.some(task => task.date.split('T')[0] === todayStr);
      const message = this.formatTasksForSharing(hasTodaysTasks);
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      this.trackSharing('whatsapp');
      window.open(whatsappUrl, '_blank');
      this.isSharing = false;
    }, 300);
  }

  shareViaEmail(): void {
    this.isSharing = true;
    setTimeout(() => {
      const subject = encodeURIComponent(`WorkFolio Tasks Report - ${this.datePipe.transform(new Date(), 'mediumDate')}`);
      let message = this.formatTasksForSharing(false).replace(/\*/g, '');
      const encodedMessage = encodeURIComponent(message);
      const mailtoUrl = `mailto:?subject=${subject}&body=${encodedMessage}`;
      this.trackSharing('email');
      window.location.href = mailtoUrl;
      this.isSharing = false;
    }, 300);
  }

  private trackSharing(method: string): void {
    const sharingHistory = JSON.parse(localStorage.getItem('workfolio_sharing_history') || '[]');
    sharingHistory.push({
      timestamp: new Date().toISOString(),
      method,
      taskCount: this.recentTasks.length
    });
    localStorage.setItem('workfolio_sharing_history', JSON.stringify(sharingHistory));
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  generateWeeklyReport(): void {
    this.isGeneratingPDF = true;
    Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]).then(([jsPDFModule, html2canvasModule]) => {
      const jsPDF = jsPDFModule.default;
      const html2canvas = html2canvasModule.default;

      // ... (keep the same report generation logic here as in your original)

      // After PDF generation:
      this.trackActivity('pdf_generated');
      this.isGeneratingPDF = false;
    }).catch(error => {
      console.error('Error loading PDF libraries:', error);
      this.isGeneratingPDF = false;
    });
  }

  private trackActivity(activity: string): void {
    const activityHistory = JSON.parse(localStorage.getItem('workfolio_activity_history') || '[]');
    activityHistory.push({
      timestamp: new Date().toISOString(),
      activity,
      user: this.userName
    });
    localStorage.setItem('workfolio_activity_history', JSON.stringify(activityHistory));
  }
}
