import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage: string = '';
  profileImagePreview: string | null = null;
  profileImageFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private location: Location
  ) {
    console.log('RegisterComponent initialized');
    this.registerForm = this.fb.group({
      fname: ['', Validators.required],
      lname: ['', Validators.required],
      university: ['', Validators.required],
      department: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required],
    });
  }
  
  ngOnInit(): void {
    console.log('RegisterComponent: ngOnInit');
    
    // Track register page visits
    const registerVisits = JSON.parse(localStorage.getItem('workfolio_register_visits') || '[]');
    registerVisits.push({
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('workfolio_register_visits', JSON.stringify(registerVisits));
    console.log(`Register page visited ${registerVisits.length} times`);
    
    // Try to load saved email from login if available
    const savedEmail = localStorage.getItem('workfolio_last_email');
    if (savedEmail) {
      console.log(`Loading saved email from login: ${savedEmail}`);
      this.registerForm.patchValue({ email: savedEmail });
    }
  }

  onProfileImageSelected(event: Event) {
    console.log('Profile image selection initiated');
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.profileImageFile = input.files[0];
      console.log(`Profile image selected: ${this.profileImageFile.name}, size: ${this.profileImageFile.size} bytes`);
      
      // Create a preview of the selected image
      const reader = new FileReader();
      reader.onload = () => {
        this.profileImagePreview = reader.result as string;
        console.log('Profile image preview created');
        
        // Save image selection event to localStorage
        const imageSelections = JSON.parse(localStorage.getItem('workfolio_profile_image_selections') || '[]');
        imageSelections.push({
          timestamp: new Date().toISOString(),
          fileName: this.profileImageFile?.name,
          fileSize: this.profileImageFile?.size
        });
        localStorage.setItem('workfolio_profile_image_selections', JSON.stringify(imageSelections));
      };
      reader.readAsDataURL(this.profileImageFile);
    } else {
      console.log('No profile image selected');
    }
  }
  
  goBack(): void {
    console.log('Going back to landing page');
    // Navigate to landing page instead of using location.back()
    // to avoid authentication issues
    this.router.navigate(['/']);
  }

  onRegister() {
    console.log('Registration attempt initiated');
    
    // Track registration attempts
    const registrationAttempts = JSON.parse(localStorage.getItem('workfolio_registration_attempts') || '[]');
    registrationAttempts.push({
      timestamp: new Date().toISOString(),
      email: this.registerForm.value.email,
      success: false // Will update if successful
    });
    
    if (this.registerForm.valid) {
      console.log('Registration form is valid, proceeding with validation');
      const { password, confirmPassword } = this.registerForm.value;
      if (password !== confirmPassword) {
        console.log('Registration failed: Passwords do not match');
        this.errorMessage = "Passwords do not match!";
        
        // Save failed registration attempt
        localStorage.setItem('workfolio_registration_attempts', JSON.stringify(registrationAttempts));
        return;
      }

      // Save form data to localStorage for recovery in case of browser crash
      localStorage.setItem('workfolio_registration_form_data', JSON.stringify({
        fname: this.registerForm.value.fname,
        lname: this.registerForm.value.lname,
        university: this.registerForm.value.university,
        department: this.registerForm.value.department,
        email: this.registerForm.value.email,
        timestamp: new Date().toISOString()
      }));
      
      console.log('Registration form data saved to localStorage');

      // Convert image to base64 if available
      if (this.profileImageFile) {
        console.log('Processing profile image for registration');
        const reader = new FileReader();
        reader.onload = () => {
          const profileImageBase64 = reader.result as string;
          console.log('Profile image converted to base64');
          
          // Register user using the auth service
          const user = {
            name: `${this.registerForm.value.fname} ${this.registerForm.value.lname}`,
            email: this.registerForm.value.email,
            password: this.registerForm.value.password,
            profileImage: profileImageBase64
          };
          
          console.log('Registering user with profile image');
          this.authService.register(user);
          
          // Update registration attempt record as successful
          registrationAttempts[registrationAttempts.length - 1].success = true;
          localStorage.setItem('workfolio_registration_attempts', JSON.stringify(registrationAttempts));
          
          // Save additional user metadata
          this.saveUserMetadata();
          
          alert('Registration successful!');
          console.log('Navigating to dashboard after successful registration');
          this.router.navigate(['/dashboard']);
        };
        reader.readAsDataURL(this.profileImageFile);
      } else {
        // Register user without profile image
        console.log('Registering user without profile image');
        const user = {
          name: `${this.registerForm.value.fname} ${this.registerForm.value.lname}`,
          email: this.registerForm.value.email,
          password: this.registerForm.value.password
        };
        
        this.authService.register(user);
        
        // Update registration attempt record as successful
        registrationAttempts[registrationAttempts.length - 1].success = true;
        localStorage.setItem('workfolio_registration_attempts', JSON.stringify(registrationAttempts));
        
        // Save additional user metadata
        this.saveUserMetadata();
        
        alert('Registration successful!');
        console.log('Navigating to dashboard after successful registration');
        this.router.navigate(['/dashboard']);
      }
    } else {
      console.log('Registration form is invalid:', this.registerForm.errors);
      this.errorMessage = 'Please fill in all fields correctly.';
      
      // Save failed registration attempt
      localStorage.setItem('workfolio_registration_attempts', JSON.stringify(registrationAttempts));
      
      // Track validation errors
      const validationErrors = [];
      for (const control in this.registerForm.controls) {
        if (this.registerForm.controls[control].invalid) {
          validationErrors.push({
            field: control,
            errors: this.registerForm.controls[control].errors
          });
        }
      }
      
      console.log('Validation errors:', validationErrors);
      localStorage.setItem('workfolio_registration_validation_errors', JSON.stringify({
        timestamp: new Date().toISOString(),
        email: this.registerForm.value.email || 'not provided',
        errors: validationErrors
      }));
    }
  }
  
  private saveUserMetadata(): void {
    console.log('Saving additional user metadata');
    const metadata = {
      university: this.registerForm.value.university,
      department: this.registerForm.value.department,
      registrationCompleted: new Date().toISOString(),
      hasProfileImage: !!this.profileImageFile,
      browser: navigator.userAgent
    };
    
    localStorage.setItem('workfolio_user_metadata', JSON.stringify(metadata));
  }
}
