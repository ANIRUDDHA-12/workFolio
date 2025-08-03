import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-sign-in',
  templateUrl: './admin-sign-in.component.html',
  styleUrls: ['./admin-sign-in.component.css']
})
export class AdminSignInComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    console.log('AdminSignInComponent initialized');
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required]
    });
    
    // Try to load saved username from localStorage
    const savedUsername = localStorage.getItem('workfolio_admin_last_username');
    if (savedUsername) {
      console.log(`Loading saved admin username: ${savedUsername}`);
      this.loginForm.patchValue({ username: savedUsername });
    }
  }
  
  ngOnInit(): void {
    console.log('AdminSignInComponent: ngOnInit');
    
    // Track admin login page visits
    const adminLoginVisits = JSON.parse(localStorage.getItem('workfolio_admin_login_visits') || '[]');
    adminLoginVisits.push({
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('workfolio_admin_login_visits', JSON.stringify(adminLoginVisits));
    console.log(`Admin login page visited ${adminLoginVisits.length} times`);
  }

  onLogin() {
    console.log('Admin login attempt initiated');
    if (this.loginForm.invalid) {
      console.log('Admin login form is invalid, validation errors:', this.loginForm.errors);
      return;
    }
    
    const { username, password } = this.loginForm.value;
    console.log(`Attempting admin login with username: ${username}`);
    
    // Save the username for future login attempts
    localStorage.setItem('workfolio_admin_last_username', username);
    
    // Track admin login attempts
    const adminLoginAttempts = JSON.parse(localStorage.getItem('workfolio_admin_login_attempts') || '[]');
    adminLoginAttempts.push({
      timestamp: new Date().toISOString(),
      username: username,
      success: false // Will update if successful
    });

    // Approach 1: Validate using external JSON file
    console.log('Validating admin credentials using external JSON file');
    this.http.get<any>('assets/admin.json').subscribe(
      admin => {
        if (username === admin.username && password === admin.password) {
          console.log('Admin login successful');
          
          // Update login attempt record as successful
          adminLoginAttempts[adminLoginAttempts.length - 1].success = true;
          localStorage.setItem('workfolio_admin_login_attempts', JSON.stringify(adminLoginAttempts));
          
          // Save successful login timestamp
          localStorage.setItem('workfolio_admin_last_successful_login', new Date().toISOString());
          
          // Save admin session data
          localStorage.setItem('workfolio_admin_session', JSON.stringify({
            username: username,
            loginTime: new Date().toISOString(),
            isActive: true
          }));
          
          alert('Admin login successful!');
          console.log('Navigating to admin dashboard');
          this.router.navigate(['/admin']);
        } else {
          console.log('Admin login failed: Invalid credentials');
          this.errorMessage = 'Invalid admin credentials.';
          
          // Save failed login attempt
          localStorage.setItem('workfolio_admin_login_attempts', JSON.stringify(adminLoginAttempts));
          
          // Track failed admin login attempts separately
          const failedAdminAttempts = JSON.parse(localStorage.getItem('workfolio_admin_failed_logins') || '[]');
          failedAdminAttempts.push({
            timestamp: new Date().toISOString(),
            username: username
          });
          localStorage.setItem('workfolio_admin_failed_logins', JSON.stringify(failedAdminAttempts));
          console.log(`Total failed admin login attempts: ${failedAdminAttempts.length}`);
        }
      },
      error => {
        console.error('Error fetching admin.json:', error);
        this.errorMessage = 'Error loading admin credentials.';
        
        // Save failed login attempt due to error
        localStorage.setItem('workfolio_admin_login_attempts', JSON.stringify(adminLoginAttempts));
        
        // Track admin login errors
        const adminLoginErrors = JSON.parse(localStorage.getItem('workfolio_admin_login_errors') || '[]');
        adminLoginErrors.push({
          timestamp: new Date().toISOString(),
          username: username,
          error: error.message || 'Unknown error'
        });
        localStorage.setItem('workfolio_admin_login_errors', JSON.stringify(adminLoginErrors));
      }
    );

    // Optional fallback (if needed, comment out above block to use this)
    /*
    if (username === 'admin' && password === 'admin1234') {
      alert('Admin login successful!');
      this.router.navigate(['/admin']);
    } else {
      this.errorMessage = 'Invalid admin credentials.';
    }
    */
  }
}
