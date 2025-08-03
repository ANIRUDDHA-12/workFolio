import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { TaskService, Task } from '../services/task.service';
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

  constructor(
    private authService: AuthService,
    private router: Router,
    private taskService: TaskService,
    private datePipe: DatePipe,
    private location: Location
  ) {
    console.log('DashboardComponent initialized');
  }

  ngOnInit(): void {
    console.log('DashboardComponent: ngOnInit');
    
    // Try to load dashboard data from localStorage first for immediate display
    this.loadDashboardFromStorage();
    
    // Get user data
    const user = this.authService.currentUserValue;
    console.log('Current user:', user);

    if (user) {
      if (user.name) {
        this.userName = user.name;
      } else if (user.email) {
        this.userName = user.email.split('@')[0];
      } else {
        this.userName = localStorage.getItem('loggedInUsername') || 'User';
      }
      console.log(`User name set to: ${this.userName}`);

      if (user.profileImage) {
        this.userProfileImage = user.profileImage;
        console.log('User profile image loaded');
      }
      
      // Save user preferences to localStorage
      this.saveUserPreferences();
    }

    // Subscribe to task updates
    this.taskService.getTasks().subscribe(() => {
      console.log('DashboardComponent: Tasks updated, refreshing dashboard');
      const stats = this.taskService.getTaskStats();
      this.totalTasks = stats.totalTasks;
      this.totalHours = stats.totalHours;
      this.activeSubjects = stats.activeSubjects;
      this.recentTasks = stats.recentTasks;
      
      // Save updated dashboard data
      this.saveDashboardToStorage();
    });
  }
  
  private loadDashboardFromStorage(): void {
    console.log('Loading dashboard data from localStorage');
    const savedDashboard = localStorage.getItem('workfolio_dashboard_data');
    if (savedDashboard) {
      try {
        const data = JSON.parse(savedDashboard);
        console.log('Loaded dashboard data from localStorage');
        
        // Update component properties with saved data
        this.totalTasks = data.totalTasks || 0;
        this.totalHours = data.totalHours || 0;
        this.activeSubjects = data.activeSubjects || 0;
        if (data.recentTasks) {
          this.recentTasks = data.recentTasks;
        }
      } catch (e) {
        console.error('Error loading dashboard data:', e);
      }
    } else {
      console.log('No saved dashboard data found');
    }
  }
  
  private saveDashboardToStorage(): void {
    console.log('Saving dashboard data to localStorage');
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
    console.log('Saving user preferences to localStorage');
    const userPrefs = {
      userName: this.userName,
      userProfileImage: this.userProfileImage,
      lastLogin: new Date().toISOString()
    };
    
    localStorage.setItem('workfolio_user_prefs', JSON.stringify(userPrefs));
  }

  logFirstTask(): void {
    console.log('Navigating to log first task');
    localStorage.setItem('workfolio_first_task', 'true');
    this.router.navigate(['/log-task']);
  }

  navigateToTab(tab: string): void {
    console.log(`Navigating to tab: ${tab}`);
    localStorage.setItem('workfolio_last_tab', tab);
    this.router.navigate([tab]);
  }

  logout(): void {
    console.log('User logging out');
    // Save session data before logout
    localStorage.setItem('workfolio_last_logout', new Date().toISOString());
    this.authService.logout();
  }

  // Format tasks for sharing
  private formatTasksForSharing(todayOnly: boolean = true): string {
    console.log('Formatting tasks for sharing, todayOnly:', todayOnly);
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    let tasksToShare: Task[] = [];
    
    if (todayOnly) {
      // Filter tasks for today
      const todaysTasks = this.recentTasks.filter(task => {
        return task.date.split('T')[0] === todayStr;
      });
      
      // If no tasks for today, include recent tasks
      tasksToShare = todaysTasks.length > 0 ? todaysTasks : this.recentTasks;
    } else {
      // Use all tasks
      tasksToShare = this.recentTasks;
    }
    
    // Format the date for display
    const dateFormatted = this.datePipe.transform(today, 'fullDate');
    
    // Create the message
    let message = `📚 *WorkFolio Tasks Report* 📚\n\n`;
    message += `📅 *Date:* ${dateFormatted}\n`;
    message += `👤 *Faculty:* ${this.userName}\n`;
    message += `📊 *Total Tasks:* ${this.totalTasks}\n`;
    message += `⏱️ *Total Hours:* ${this.totalHours.toFixed(1)}h\n\n`;
    
    if (tasksToShare.length === 0) {
      message += `No tasks logged yet.\n`;
    } else {
      if (todayOnly && tasksToShare.some(task => task.date.split('T')[0] === todayStr)) {
        message += `*Today's Tasks:*\n\n`;
      } else {
        message += `*Recent Tasks:*\n\n`;
      }
      
      tasksToShare.forEach((task, index) => {
        const taskDate = this.datePipe.transform(new Date(task.date), 'mediumDate');
        message += `*${index + 1}. ${task.subject}* (${task.workType})\n`;
        message += `   📅 ${taskDate} | ⏱️ ${task.hours}h\n`;
        if (task.description) {
          message += `   📝 ${task.description}\n`;
        }
        message += `\n`;
      });
      
      // Add summary statistics for displayed tasks
      const totalHours = tasksToShare.reduce((sum, task) => sum + task.hours, 0);
      message += `*Displayed Tasks Hours:* ${totalHours.toFixed(1)}h\n`;
    }
    
    // Add footer
    message += `\n📲 *Shared from WorkFolio App*\n`;
    
    // Track sharing in localStorage
    this.trackSharing('formatted');
    
    return message;
  }
  
  // Share via WhatsApp
  shareViaWhatsApp(): void {
    console.log('Sharing via WhatsApp');
    this.isSharing = true;
    
    setTimeout(() => {
      // Determine if we should share today's tasks only or all tasks
      // Get today's date in YYYY-MM-DD format
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      // Check if there are any tasks from today
      const hasTodaysTasks = this.recentTasks.some(task => task.date.split('T')[0] === todayStr);
      
      // If there are tasks from today, share only today's tasks, otherwise share all recent tasks
      const message = this.formatTasksForSharing(hasTodaysTasks);
      const encodedMessage = encodeURIComponent(message);
      const whatsappUrl = `https://wa.me/?text=${encodedMessage}`;
      
      // Track sharing in localStorage
      this.trackSharing('whatsapp');
      
      window.open(whatsappUrl, '_blank');
      this.isSharing = false;
    }, 300); // Small delay to show loading indicator
  }
  
  // Share via Email
  shareViaEmail(): void {
    console.log('Sharing via Email');
    this.isSharing = true;
    
    setTimeout(() => {
      // For email, always include all tasks for a more comprehensive report
      const subject = encodeURIComponent(`WorkFolio Tasks Report - ${this.datePipe.transform(new Date(), 'mediumDate')}`);
      
      // Format message for email (convert WhatsApp formatting to plain text)
      let message = this.formatTasksForSharing(false); // false means include all tasks, not just today's
      message = message.replace(/\*/g, ''); // Remove asterisks used for bold in WhatsApp
      const encodedMessage = encodeURIComponent(message);
      
      const mailtoUrl = `mailto:?subject=${subject}&body=${encodedMessage}`;
      
      // Track sharing in localStorage
      this.trackSharing('email');
      
      window.location.href = mailtoUrl;
      this.isSharing = false;
    }, 300); // Small delay to show loading indicator
  }
  
  // Track sharing activity in localStorage
  private trackSharing(method: string): void {
    const sharingHistory = JSON.parse(localStorage.getItem('workfolio_sharing_history') || '[]');
    sharingHistory.push({
      timestamp: new Date().toISOString(),
      method: method,
      taskCount: this.recentTasks.length
    });
    localStorage.setItem('workfolio_sharing_history', JSON.stringify(sharingHistory));
  }

  // Go back to previous page
  goBack(): void {
    // Navigate to landing page instead of using location.back()
    // to avoid authentication issues
    this.router.navigate(['/']);
  }

  // Generate PDF report
  isGeneratingPDF: boolean = false;

  generateWeeklyReport(): void {
    console.log('Generating weekly report PDF');
    this.isGeneratingPDF = true;

    // Use dynamic import to load jsPDF and html2canvas only when needed
    Promise.all([
      import('jspdf'),
      import('html2canvas')
    ]).then(([jsPDFModule, html2canvasModule]) => {
      const jsPDF = jsPDFModule.default;
      const html2canvas = html2canvasModule.default;

      // Get the current date for the report title
      const today = new Date();
      const dateStr = this.datePipe.transform(today, 'yyyy-MM-dd');

      // Get the tasks for the current week
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // Start of week (Sunday)
      weekStart.setHours(0, 0, 0, 0);

      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // End of week (Saturday)
      weekEnd.setHours(23, 59, 59, 999);

      // Filter tasks for the current week
      const weeklyTasks = this.recentTasks.filter(task => {
        const taskDate = new Date(task.date);
        return taskDate >= weekStart && taskDate <= weekEnd;
      });

      // Create a temporary div to render the report content
      const reportElement = document.createElement('div');
      reportElement.style.padding = '20px';
      reportElement.style.fontFamily = 'Arial, sans-serif';
      reportElement.style.position = 'absolute';
      reportElement.style.left = '-9999px';
      reportElement.style.top = '-9999px';
      reportElement.style.width = '210mm'; // A4 width

      // Create report content
      reportElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #3b82f6; margin-bottom: 5px;">WorkFolio Weekly Report</h1>
          <h2 style="color: #64748b; font-weight: normal; margin-top: 0;">${this.datePipe.transform(weekStart, 'MMM d')} - ${this.datePipe.transform(weekEnd, 'MMM d, yyyy')}</h2>
          <p style="color: #64748b;">Faculty: ${this.userName}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #3b82f6; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Summary</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0; width: 50%;">Total Tasks</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0; width: 50%;">${this.totalTasks}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">Total Hours</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${this.totalHours.toFixed(1)}h</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">Active Subjects</td>
              <td style="padding: 8px; border: 1px solid #e2e8f0;">${this.activeSubjects}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #3b82f6; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Weekly Tasks (${weeklyTasks.length})</h3>
          ${weeklyTasks.length > 0 ? `
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Subject</th>
                  <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Work Type</th>
                  <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Date</th>
                  <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Hours</th>
                  <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Description</th>
                </tr>
              </thead>
              <tbody>
                ${weeklyTasks.map(task => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${task.subject}</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${task.workType}</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${this.datePipe.transform(new Date(task.date), 'MMM d, yyyy')}</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${task.hours}h</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${task.description || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="color: #64748b;">No tasks recorded for this week.</p>'}
        </div>

        <div style="margin-bottom: 20px;">
          <h3 style="color: #3b82f6; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">Recent Tasks</h3>
          ${this.recentTasks.length > 0 ? `
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Subject</th>
                  <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Work Type</th>
                  <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Date</th>
                  <th style="padding: 8px; border: 1px solid #e2e8f0; text-align: left;">Hours</th>
                </tr>
              </thead>
              <tbody>
                ${this.recentTasks.map(task => `
                  <tr>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${task.subject}</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${task.workType}</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${this.datePipe.transform(new Date(task.date), 'MMM d, yyyy')}</td>
                    <td style="padding: 8px; border: 1px solid #e2e8f0;">${task.hours}h</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          ` : '<p style="color: #64748b;">No recent tasks available.</p>'}
        </div>

        <div style="text-align: center; margin-top: 30px; color: #64748b; font-size: 12px;">
          <p>Generated on ${this.datePipe.transform(new Date(), 'MMMM d, yyyy, h:mm a')} | WorkFolio App</p>
        </div>
      `;

      // Add the element to the document
      document.body.appendChild(reportElement);

      // Use html2canvas to capture the content
      html2canvas(reportElement, {
        scale: 2, // Higher scale for better quality
        logging: false,
        useCORS: true
      }).then(canvas => {
        // Remove the temporary element
        document.body.removeChild(reportElement);

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height in mm
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add new pages if the content is longer than one page
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }

        // Save the PDF
        pdf.save(`WorkFolio_Weekly_Report_${dateStr}.pdf`);
        
        // Track PDF generation in localStorage
        this.trackActivity('pdf_generated');
        
        this.isGeneratingPDF = false;
      }).catch(error => {
        console.error('Error generating PDF:', error);
        this.isGeneratingPDF = false;
      });
    }).catch(error => {
      console.error('Error loading PDF libraries:', error);
      this.isGeneratingPDF = false;
    });
  }

  // Track activity in localStorage
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
