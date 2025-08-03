import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-report',
  templateUrl: './report.component.html',
  styleUrls: ['./report.component.css']
})
export class ReportComponent implements OnInit {
  facultyList: any[] = [];

  constructor(private http: HttpClient) {
    console.log('ReportComponent initialized');
  }

  ngOnInit(): void {
    console.log('ReportComponent: ngOnInit');
    
    // Track report page visits
    const reportVisits = JSON.parse(localStorage.getItem('workfolio_report_visits') || '[]');
    reportVisits.push({
      timestamp: new Date().toISOString(),
      referrer: document.referrer || 'direct'
    });
    localStorage.setItem('workfolio_report_visits', JSON.stringify(reportVisits));
    console.log(`Report page visited ${reportVisits.length} times`);
    
    // Try to load faculty list from localStorage first for immediate display
    const cachedFacultyList = localStorage.getItem('workfolio_faculty_list_cache');
    if (cachedFacultyList) {
      try {
        this.facultyList = JSON.parse(cachedFacultyList);
        console.log('Loaded faculty list from cache');
      } catch (e) {
        console.error('Error loading cached faculty list:', e);
      }
    }
    
    // Load faculty data from server
    console.log('Fetching faculty data from server');
    this.http.get<any[]>('assets/faculty.json').subscribe(
      data => {
        this.facultyList = data;
        console.log(`Loaded ${this.facultyList.length} faculty members`);
        
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
          context: 'report-component',
          error: error.message || 'Unknown error'
        });
        localStorage.setItem('workfolio_faculty_load_errors', JSON.stringify(facultyLoadErrors));
      }
    );
  }

  openReport(faculty: any): void {
    console.log(`Opening report for ${faculty.name}`);
    
    // Track report views
    const reportViews = JSON.parse(localStorage.getItem('workfolio_report_views') || '[]');
    reportViews.push({
      timestamp: new Date().toISOString(),
      facultyId: faculty.id,
      facultyName: faculty.name
    });
    localStorage.setItem('workfolio_report_views', JSON.stringify(reportViews));
    console.log(`Total report views: ${reportViews.length}`);
    
    alert(`Opening report for ${faculty.name}`);
    // You can navigate or open a modal here later
  }
}
