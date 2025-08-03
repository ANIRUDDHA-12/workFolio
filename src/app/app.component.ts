import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'workFolio';
  
  constructor() {
    console.log('AppComponent initialized');
  }
  
  ngOnInit(): void {
    console.log('AppComponent: ngOnInit');
    
    // Track application starts
    const appStarts = JSON.parse(localStorage.getItem('workfolio_app_starts') || '[]');
    const startInfo = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      screenWidth: window.innerWidth,
      screenHeight: window.innerHeight,
      language: navigator.language
    };
    appStarts.push(startInfo);
    localStorage.setItem('workfolio_app_starts', JSON.stringify(appStarts));
    console.log(`Application started ${appStarts.length} times`);
    
    // Save app version and last start time
    const appVersion = '1.0.0'; // Replace with actual version
    localStorage.setItem('workfolio_app_version', appVersion);
    localStorage.setItem('workfolio_last_start', new Date().toISOString());
    
    // Check if this is first time use
    const isFirstTimeUse = !localStorage.getItem('workfolio_first_use_completed');
    if (isFirstTimeUse) {
      console.log('First time application use detected');
      localStorage.setItem('workfolio_first_use_completed', 'true');
      localStorage.setItem('workfolio_first_use_timestamp', new Date().toISOString());
    }
    
    // Track session information
    const sessionId = this.generateSessionId();
    localStorage.setItem('workfolio_current_session_id', sessionId);
    
    const sessions = JSON.parse(localStorage.getItem('workfolio_sessions') || '[]');
    sessions.push({
      sessionId: sessionId,
      startTime: new Date().toISOString(),
      userAgent: navigator.userAgent
    });
    localStorage.setItem('workfolio_sessions', JSON.stringify(sessions));
    
    // Listen for window unload to track session end
    window.addEventListener('beforeunload', () => this.trackSessionEnd(sessionId));
  }
  
  /**
   * Generates a unique session ID
   */
  private generateSessionId(): string {
    return 'session_' + new Date().getTime() + '_' + Math.random().toString(36).substring(2, 15);
  }
  
  /**
   * Tracks the end of a session
   */
  private trackSessionEnd(sessionId: string): void {
    console.log('Tracking session end');
    
    const sessionEnds = JSON.parse(localStorage.getItem('workfolio_session_ends') || '[]');
    sessionEnds.push({
      sessionId: sessionId,
      endTime: new Date().toISOString(),
      duration: this.calculateSessionDuration(sessionId)
    });
    localStorage.setItem('workfolio_session_ends', JSON.stringify(sessionEnds));
  }
  
  /**
   * Calculates the duration of the current session
   */
  private calculateSessionDuration(sessionId: string): number {
    const sessions = JSON.parse(localStorage.getItem('workfolio_sessions') || '[]');
    const session = sessions.find((s: any) => s.sessionId === sessionId);
    
    if (session) {
      const startTime = new Date(session.startTime).getTime();
      const endTime = new Date().getTime();
      return Math.floor((endTime - startTime) / 1000); // Duration in seconds
    }
    
    return 0;
  }
}
