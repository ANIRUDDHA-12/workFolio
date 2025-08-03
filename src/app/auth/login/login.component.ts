import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../auth.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  returnUrl: string = '/dashboard';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private location: Location
  ) {
    console.log('LoginComponent initialized');
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
    
    // Try to load saved email from localStorage
    const savedEmail = localStorage.getItem('workfolio_last_email');
    if (savedEmail) {
      console.log(`Loading saved email: ${savedEmail}`);
      this.loginForm.patchValue({ email: savedEmail });
    }
  }

  ngOnInit() {
    console.log('LoginComponent: ngOnInit');
    // Get return url from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
    console.log(`Return URL set to: ${this.returnUrl}`);
    
    // Track login page visits
    const loginVisits = JSON.parse(localStorage.getItem('workfolio_login_visits') || '[]');
    loginVisits.push({
      timestamp: new Date().toISOString(),
      returnUrl: this.returnUrl
    });
    localStorage.setItem('workfolio_login_visits', JSON.stringify(loginVisits));
    console.log(`Login page visited ${loginVisits.length} times`);
  }

  onLogin() {
    console.log('Login attempt initiated');
    if (this.loginForm.invalid) {
      console.log('Login form is invalid, validation errors:', this.loginForm.errors);
      return;
    }

    const { email, password } = this.loginForm.value;
    console.log(`Attempting to login with email: ${email}`);
    
    // Save the email for future login attempts
    localStorage.setItem('workfolio_last_email', email);
    
    // Track login attempts
    const loginAttempts = JSON.parse(localStorage.getItem('workfolio_login_attempts') || '[]');
    loginAttempts.push({
      timestamp: new Date().toISOString(),
      email: email,
      success: false // Will update if successful
    });
    
    // First, try login via AuthService
    console.log('Trying login via AuthService');
    const loginSuccess = this.authService.login(email, password);

    if (loginSuccess) {
      console.log('Login successful via AuthService');
      // Update login attempt record
      loginAttempts[loginAttempts.length - 1].success = true;
      localStorage.setItem('workfolio_login_attempts', JSON.stringify(loginAttempts));
      
      // Save successful login timestamp
      localStorage.setItem('workfolio_last_successful_login', new Date().toISOString());
      
      console.log(`Navigating to return URL: ${this.returnUrl}`);
      this.router.navigateByUrl(this.returnUrl);
      return;
    }

    // Fallback: Try localStorage check
    console.log('AuthService login failed, trying localStorage fallback');
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        console.log('Found user in localStorage, checking credentials');
        if (user.email === email && user.password === password) {
          console.log('Login successful via localStorage fallback');
          // Update login attempt record
          loginAttempts[loginAttempts.length - 1].success = true;
          localStorage.setItem('workfolio_login_attempts', JSON.stringify(loginAttempts));
          
          alert('Login successful!');
          localStorage.setItem('loggedInUsername', user.name);
          localStorage.setItem('workfolio_last_successful_login', new Date().toISOString());
          
          console.log('Navigating to landing page');
          this.router.navigate(['/landing']);
          return;
        } else {
          console.log('Credentials do not match stored user');
        }
      } catch (e) {
        console.error('Error parsing user from localStorage:', e);
      }
    } else {
      console.log('No user found in localStorage');
    }

    // Save failed login attempt
    localStorage.setItem('workfolio_login_attempts', JSON.stringify(loginAttempts));
    
    // Login failed
    console.log('Login failed: Invalid credentials or no user found');
    this.errorMessage = 'Invalid email or password or no user found. Please register first.';
    
    // Track failed login attempts separately
    const failedAttempts = JSON.parse(localStorage.getItem('workfolio_failed_logins') || '[]');
    failedAttempts.push({
      timestamp: new Date().toISOString(),
      email: email
    });
    localStorage.setItem('workfolio_failed_logins', JSON.stringify(failedAttempts));
    console.log(`Total failed login attempts: ${failedAttempts.length}`);
  }

  goToRegister() {
    console.log('Navigating to register page');
    // Track register page navigation
    localStorage.setItem('workfolio_register_navigation', new Date().toISOString());
    this.router.navigate(['/register']);
  }

  forgotPassword() {
    console.log('Forgot password clicked');
    // Track forgot password clicks
    const forgotPasswordClicks = JSON.parse(localStorage.getItem('workfolio_forgot_password_clicks') || '[]');
    forgotPasswordClicks.push({
      timestamp: new Date().toISOString(),
      email: this.loginForm.get('email')?.value || ''
    });
    localStorage.setItem('workfolio_forgot_password_clicks', JSON.stringify(forgotPasswordClicks));
    
    alert('Forgot password functionality not implemented.');
  }
  
  goBack(): void {
    console.log('Going back to landing page');
    // Navigate to landing page instead of using location.back()
    // to avoid authentication issues
    this.router.navigate(['/']);
  }
}
