import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing',
  templateUrl: './landing.component.html',
  styleUrls: ['./landing.component.css']
})
export class LandingComponent implements OnInit {
  
  constructor(private router: Router) {
    console.log('LandingComponent initialized');
  }
  
  ngOnInit(): void {
    console.log('LandingComponent: ngOnInit');
    
    // Track landing page visits
    const landingVisits = JSON.parse(localStorage.getItem('workfolio_landing_visits') || '[]');
    landingVisits.push({
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct'
    });
    localStorage.setItem('workfolio_landing_visits', JSON.stringify(landingVisits));
    console.log(`Landing page visited ${landingVisits.length} times`);
    
    // Check if user is returning from a previous session
    const lastVisit = localStorage.getItem('workfolio_last_landing_visit');
    if (lastVisit) {
      const lastVisitDate = new Date(lastVisit);
      const now = new Date();
      const daysSinceLastVisit = Math.floor((now.getTime() - lastVisitDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`User returning after ${daysSinceLastVisit} days since last visit`);
    }
    
    // Save current visit timestamp
    localStorage.setItem('workfolio_last_landing_visit', new Date().toISOString());
  }

  navigateToLogin(): void {
    console.log('Navigating to login page');
    
    // Track navigation to login
    const loginNavigations = JSON.parse(localStorage.getItem('workfolio_login_navigations') || '[]');
    loginNavigations.push({
      timestamp: new Date().toISOString(),
      from: 'landing'
    });
    localStorage.setItem('workfolio_login_navigations', JSON.stringify(loginNavigations));
    
    this.router.navigate(['/login']);
  }

  navigateToRegister(): void {
    console.log('Navigating to register page');
    
    // Track navigation to register
    const registerNavigations = JSON.parse(localStorage.getItem('workfolio_register_navigations') || '[]');
    registerNavigations.push({
      timestamp: new Date().toISOString(),
      from: 'landing'
    });
    localStorage.setItem('workfolio_register_navigations', JSON.stringify(registerNavigations));
    
    this.router.navigate(['/register']);
  }

  navigateToAdminLogin(): void {
    console.log('Navigating to admin login page');
    
    // Track navigation to admin login
    const adminLoginNavigations = JSON.parse(localStorage.getItem('workfolio_admin_login_navigations') || '[]');
    adminLoginNavigations.push({
      timestamp: new Date().toISOString(),
      from: 'landing'
    });
    localStorage.setItem('workfolio_admin_login_navigations', JSON.stringify(adminLoginNavigations));
    
    this.router.navigate(['/admin-sign-in']);
  }

  navigateToDashboard(): void {
    console.log('Navigating to dashboard');
    
    // Track navigation to dashboard
    const dashboardNavigations = JSON.parse(localStorage.getItem('workfolio_dashboard_navigations') || '[]');
    dashboardNavigations.push({
      timestamp: new Date().toISOString(),
      from: 'landing'
    });
    localStorage.setItem('workfolio_dashboard_navigations', JSON.stringify(dashboardNavigations));
    
    this.router.navigate(['/dashboard']);
  }

  navigateToLogTask(): void {
    console.log('Navigating to log task');
    
    // Track navigation to log task
    const logTaskNavigations = JSON.parse(localStorage.getItem('workfolio_log_task_navigations') || '[]');
    logTaskNavigations.push({
      timestamp: new Date().toISOString(),
      from: 'landing'
    });
    localStorage.setItem('workfolio_log_task_navigations', JSON.stringify(logTaskNavigations));
    
    this.router.navigate(['/log-task']);
  }

  navigateToAnalytics(): void {
    console.log('Navigating to analytics');
    
    // Track navigation to analytics
    const analyticsNavigations = JSON.parse(localStorage.getItem('workfolio_analytics_navigations') || '[]');
    analyticsNavigations.push({
      timestamp: new Date().toISOString(),
      from: 'landing'
    });
    localStorage.setItem('workfolio_analytics_navigations', JSON.stringify(analyticsNavigations));
    
    this.router.navigate(['/analytics']);
  }

  // Generic navigation method that can be used for any feature
  navigateToFeature(feature: string): void {
    console.log(`Navigating to feature: ${feature}`);
    
    // Track feature navigation
    const featureNavigations = JSON.parse(localStorage.getItem('workfolio_feature_navigations') || '[]');
    featureNavigations.push({
      timestamp: new Date().toISOString(),
      feature: feature,
      from: 'landing'
    });
    localStorage.setItem('workfolio_feature_navigations', JSON.stringify(featureNavigations));
    
    switch(feature) {
      case 'timeTracking':
        this.navigateToLogTask();
        break;
      case 'analytics':
        this.navigateToAnalytics();
        break;
      case 'insights':
      case 'subjectManagement':
      default:
        this.navigateToDashboard();
        break;
    }
  }
}
