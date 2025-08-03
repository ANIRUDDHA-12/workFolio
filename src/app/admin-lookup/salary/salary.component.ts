import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-salary',
  templateUrl: './salary.component.html',
  styleUrls: ['./salary.component.css']
})
export class SalaryComponent implements OnInit {
  salaryPerHour: number = 0;
  facultyList: any[] = [];

  constructor(private http: HttpClient) {
    console.log('SalaryComponent initialized');
  }

  ngOnInit(): void {
    console.log('SalaryComponent: ngOnInit');
    
    // Track salary page visits
    const salaryVisits = JSON.parse(localStorage.getItem('workfolio_salary_visits') || '[]');
    salaryVisits.push({
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct'
    });
    localStorage.setItem('workfolio_salary_visits', JSON.stringify(salaryVisits));
    console.log(`Salary page visited ${salaryVisits.length} times`);
    
    // Load saved salary per hour if exists
    const savedSalary = localStorage.getItem('workfolio_salary_per_hour');
    if (savedSalary) {
      this.salaryPerHour = Number(savedSalary);
      console.log(`Loaded saved salary rate: ₹${this.salaryPerHour} per hour`);
    }
    
    // Load payment status if exists
    const paymentStatus = JSON.parse(localStorage.getItem('workfolio_payment_status') || '{}');
    
    // Try to load faculty list from localStorage first for immediate display
    const cachedFacultyList = localStorage.getItem('workfolio_faculty_list_cache');
    if (cachedFacultyList) {
      try {
        const cachedData = JSON.parse(cachedFacultyList);
        this.processFacultyData(cachedData, paymentStatus);
        console.log('Loaded faculty list from cache');
      } catch (e) {
        console.error('Error loading cached faculty list:', e);
      }
    }
    
    // Load faculty data from server
    console.log('Fetching faculty data from server');
    this.http.get<any[]>('assets/faculty.json').subscribe(
      data => {
        console.log(`Loaded ${data.length} faculty members`);
        this.processFacultyData(data, paymentStatus);
        
        // Cache faculty list
        localStorage.setItem('workfolio_faculty_list_cache', JSON.stringify(data));
        localStorage.setItem('workfolio_faculty_list_last_updated', new Date().toISOString());
      },
      error => {
        console.error('Error loading faculty data:', error);
        
        // Track faculty data load errors
        const facultyLoadErrors = JSON.parse(localStorage.getItem('workfolio_faculty_load_errors') || '[]');
        facultyLoadErrors.push({
          timestamp: new Date().toISOString(),
          context: 'salary-component',
          error: error.message || 'Unknown error'
        });
        localStorage.setItem('workfolio_faculty_load_errors', JSON.stringify(facultyLoadErrors));
      }
    );
  }
  
  /**
   * Process faculty data with appraisals and payment status
   */
  private processFacultyData(data: any[], paymentStatus: any): void {
    console.log('Processing faculty data with appraisals and payment status');
    const appraisals = JSON.parse(localStorage.getItem('workfolio_appraisals') || '{}');

    this.facultyList = data.map(faculty => ({
      ...faculty,
      paid: paymentStatus[faculty.id] || false,
      appraisal: appraisals[faculty.id] || 0
    }));
  }


  saveSalary(): void {
    console.log(`Setting salary rate to ₹${this.salaryPerHour} per hour`);
    
    // Save salary rate to localStorage
    localStorage.setItem('workfolio_salary_per_hour', this.salaryPerHour.toString());
    
    // Track salary rate changes
    const salaryChanges = JSON.parse(localStorage.getItem('workfolio_salary_changes') || '[]');
    salaryChanges.push({
      timestamp: new Date().toISOString(),
      newRate: this.salaryPerHour
    });
    localStorage.setItem('workfolio_salary_changes', JSON.stringify(salaryChanges));
    console.log(`Salary rate change history: ${salaryChanges.length} changes`);
    
    alert(`Salary set to ₹${this.salaryPerHour} per hour`);
    // Optionally: apply this rate to all faculty entries or save it somewhere
  }

  markAsPaid(faculty: any) {
    console.log(`Marking ${faculty.name} as paid`);
    faculty.paid = true;
    
    // Save payment status to localStorage
    const paymentStatus = JSON.parse(localStorage.getItem('workfolio_payment_status') || '{}');
    paymentStatus[faculty.id] = true;
    localStorage.setItem('workfolio_payment_status', JSON.stringify(paymentStatus));
    
    // Track payment history
    const paymentHistory = JSON.parse(localStorage.getItem('workfolio_payment_history') || '[]');
    paymentHistory.push({
      timestamp: new Date().toISOString(),
      facultyId: faculty.id,
      facultyName: faculty.name,
      amount: this.calculateTotalPay(faculty),
      appraisal: faculty.appraisal
    });
    localStorage.setItem('workfolio_payment_history', JSON.stringify(paymentHistory));
    console.log(`Payment recorded for ${faculty.name}`);
  }
  
  /**
   * Calculate total pay for a faculty member
   */
  private calculateTotalPay(faculty: any): number {
    const baseAmount = this.salaryPerHour * (faculty.hours || 0);
    const totalAmount = baseAmount + (faculty.appraisal || 0);
    return totalAmount;
  }

}
