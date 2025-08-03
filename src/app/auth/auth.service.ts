import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
  email: string;
  password?: string;
  name?: string;
  profileImage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private isAuthenticatedSubject: BehaviorSubject<boolean>;
  public isAuthenticated: Observable<boolean>;

  constructor(private router: Router) {
    console.log('AuthService initialized');
    const storedUser = localStorage.getItem('userData');
    
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        this.currentUserSubject = new BehaviorSubject<User | null>(user);
        console.log('User data loaded from localStorage:', { email: user.email, name: user.name });
      } catch (e) {
        console.error('Error parsing user data from localStorage:', e);
        this.currentUserSubject = new BehaviorSubject<User | null>(null);
      }
    } else {
      console.log('No user data found in localStorage');
      this.currentUserSubject = new BehaviorSubject<User | null>(null);
    }
    
    this.currentUser = this.currentUserSubject.asObservable();
    
    this.isAuthenticatedSubject = new BehaviorSubject<boolean>(!!storedUser);
    this.isAuthenticated = this.isAuthenticatedSubject.asObservable();
    console.log('Authentication state:', this.isAuthenticatedSubject.value ? 'Authenticated' : 'Not authenticated');
    
    // Track login session
    if (this.isAuthenticatedSubject.value) {
      localStorage.setItem('workfolio_last_login', new Date().toISOString());
    }
  }

  public get currentUserValue(): User | null {
    const user = this.currentUserSubject.value;
    console.log('Getting current user value:', user ? { email: user.email, name: user.name } : 'No user');
    return user;
  }

  public get isUserAuthenticated(): boolean {
    const isAuthenticated = this.isAuthenticatedSubject.value;
    console.log('Checking authentication status:', isAuthenticated ? 'Authenticated' : 'Not authenticated');
    return isAuthenticated;
  }

  login(email: string, password: string): boolean {
    console.log(`Attempting login for user: ${email}`);
    const storedUser = localStorage.getItem('userData');

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.email === email && user.password === password) {
          console.log('Login successful');
          this.currentUserSubject.next(user);
          this.isAuthenticatedSubject.next(true);
          
          // Track login session
          const loginTime = new Date().toISOString();
          localStorage.setItem('workfolio_last_login', loginTime);
          localStorage.setItem('workfolio_login_history', JSON.stringify([
            ...(JSON.parse(localStorage.getItem('workfolio_login_history') || '[]')),
            { email, timestamp: loginTime }
          ]));
          
          return true;
        } else {
          console.log('Login failed: Invalid credentials');
        }
      } catch (e) {
        console.error('Error parsing stored user data during login:', e);
      }
    } else {
      console.log('Login failed: No user data found');
    }
    return false;
  }

  logout(): void {
    console.log('Logging out user');
    
    // Track logout session
    const logoutTime = new Date().toISOString();
    localStorage.setItem('workfolio_last_logout', logoutTime);
    
    // Save session duration if we have login time
    const lastLogin = localStorage.getItem('workfolio_last_login');
    if (lastLogin) {
      const loginTime = new Date(lastLogin).getTime();
      const sessionDuration = new Date().getTime() - loginTime;
      console.log(`Session duration: ${Math.round(sessionDuration / 1000 / 60)} minutes`);
      
      // Save session history
      localStorage.setItem('workfolio_session_history', JSON.stringify([
        ...(JSON.parse(localStorage.getItem('workfolio_session_history') || '[]')),
        { 
          login: lastLogin, 
          logout: logoutTime, 
          duration: sessionDuration,
          user: this.currentUserSubject.value?.email
        }
      ]));
    }
    
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    this.router.navigate(['/login']);
  }

  register(user: User): void {
    console.log('Registering new user:', { email: user.email, name: user.name });
    
    // Save user data
    localStorage.setItem('userData', JSON.stringify(user));
    
    // Track registration
    const registrationTime = new Date().toISOString();
    localStorage.setItem('workfolio_registration_time', registrationTime);
    localStorage.setItem('workfolio_last_login', registrationTime);
    
    // Update user list if we're tracking multiple users
    localStorage.setItem('workfolio_registered_users', JSON.stringify([
      ...(JSON.parse(localStorage.getItem('workfolio_registered_users') || '[]')),
      { email: user.email, name: user.name, registeredAt: registrationTime }
    ]));
    
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
    console.log('User registered and authenticated successfully');
  }
}
