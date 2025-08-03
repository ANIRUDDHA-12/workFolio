import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-member-info',
  templateUrl: './member-info.component.html',
  styleUrls: ['./member-info.component.css']
})
export class MemberInfoComponent implements OnInit {
  faculty: any;
  reviewText: string = '';
  appraisalAmount: number = 0;

  constructor(private route: ActivatedRoute, private http: HttpClient) {
    console.log('MemberInfoComponent initialized');
  }

  ngOnInit(): void {
    console.log('MemberInfoComponent: ngOnInit');
    
    // Track member info page visits
    const memberInfoVisits = JSON.parse(localStorage.getItem('workfolio_member_info_visits') || '[]');
    const id = Number(this.route.snapshot.paramMap.get('id'));
    memberInfoVisits.push({
      timestamp: new Date().toISOString(),
      memberId: id,
      referrer: document.referrer || 'direct'
    });
    localStorage.setItem('workfolio_member_info_visits', JSON.stringify(memberInfoVisits));
    console.log(`Member info page visited ${memberInfoVisits.length} times`);
    
    // Load previously saved appraisal amount if exists
    const appraisals = JSON.parse(localStorage.getItem('workfolio_appraisals') || '{}');
    if (appraisals[id]) {
      this.appraisalAmount = appraisals[id];
      console.log(`Loaded previous appraisal amount: ${this.appraisalAmount} for member ID: ${id}`);
    }
    
    // Load faculty data
    console.log(`Loading faculty data for ID: ${id}`);
    this.http.get<any[]>('assets/faculty.json').subscribe(
      data => {
        this.faculty = data.find(member => member.id === id);
        console.log('Faculty data loaded:', this.faculty);
        
        // Track faculty data views
        const facultyViews = JSON.parse(localStorage.getItem('workfolio_faculty_views') || '[]');
        facultyViews.push({
          timestamp: new Date().toISOString(),
          facultyId: id,
          facultyName: this.faculty?.name || 'Unknown'
        });
        localStorage.setItem('workfolio_faculty_views', JSON.stringify(facultyViews));
      },
      error => {
        console.error('Error loading faculty data:', error);
        
        // Track faculty data load errors
        const facultyLoadErrors = JSON.parse(localStorage.getItem('workfolio_faculty_load_errors') || '[]');
        facultyLoadErrors.push({
          timestamp: new Date().toISOString(),
          facultyId: id,
          error: error.message || 'Unknown error'
        });
        localStorage.setItem('workfolio_faculty_load_errors', JSON.stringify(facultyLoadErrors));
      }
    );
  }

  submitReview(): void {
    console.log(`Submitting review for ${this.faculty?.name}`);
    
    // Track review submissions
    const reviewSubmissions = JSON.parse(localStorage.getItem('workfolio_review_submissions') || '[]');
    reviewSubmissions.push({
      timestamp: new Date().toISOString(),
      facultyId: this.faculty?.id,
      facultyName: this.faculty?.name || 'Unknown',
      reviewLength: this.reviewText.length,
      reviewText: this.reviewText.substring(0, 50) + (this.reviewText.length > 50 ? '...' : '') // Store preview only
    });
    localStorage.setItem('workfolio_review_submissions', JSON.stringify(reviewSubmissions));
    console.log(`Total review submissions: ${reviewSubmissions.length}`);
    
    alert(`Review for ${this.faculty.name} submitted:\n\n"${this.reviewText}"`);
    this.reviewText = '';
  }

  saveAppraisal(): void {
    console.log(`Saving appraisal of ₹${this.appraisalAmount} for ${this.faculty?.name}`);
    
    // Track appraisal submissions with improved key name
    const appraisals = JSON.parse(localStorage.getItem('workfolio_appraisals') || '{}');
    appraisals[this.faculty?.id] = this.appraisalAmount;
    localStorage.setItem('workfolio_appraisals', JSON.stringify(appraisals));
    
    // Track appraisal history
    const appraisalHistory = JSON.parse(localStorage.getItem('workfolio_appraisal_history') || '[]');
    appraisalHistory.push({
      timestamp: new Date().toISOString(),
      facultyId: this.faculty?.id,
      facultyName: this.faculty?.name || 'Unknown',
      amount: this.appraisalAmount
    });
    localStorage.setItem('workfolio_appraisal_history', JSON.stringify(appraisalHistory));
    console.log(`Total appraisal submissions: ${appraisalHistory.length}`);
    
    alert(`Appraisal of ₹${this.appraisalAmount} saved for ${this.faculty.name}`);
    this.appraisalAmount = 0;
}

}
