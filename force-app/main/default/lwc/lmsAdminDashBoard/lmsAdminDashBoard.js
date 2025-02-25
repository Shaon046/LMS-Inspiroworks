import { LightningElement, track } from 'lwc';
import getUserDetails from '@salesforce/apex/LMSDashboardController.getUserDetails';
import getDashboardData from '@salesforce/apex/LMSCourseDashboardController.getDashboardData';
import getCompletedCoursesData from '@salesforce/apex/LMSStaffChartCourseDataController.getCompletedCoursesData';
import getStaffCourseReportData from '@salesforce/apex/LMSStaffCourseDataController.getStaffCourseReportData';
import getCourseReportData from '@salesforce/apex/LMSCourseEnrollmentStatusReport.getCourseReportData';
import getEnrollmentSummary from '@salesforce/apex/LMSMonthlyReportController.getEnrollmentSummary';


export default class LmsAdminDashBoard extends LightningElement {
    @track dashBoardCardRecord;
    @track isCardRecord = false;
    @track staffChartData;
    @track isStaffChartData = false;
    @track staffTableReport;
    @track staffTableHeader;
    @track isStaffTableData = false;
    @track courseEnrollmentData;
    @track reportTabelHeader;
    @track isCourseEnrollment = false;
    @track monthlyChartProgressData;
    @track isMonthlyProgressData = false;

    connectedCallback() {
        this.getDashboardData();
        this.getUserDetails();

    }

    getUserDetails() {
        getUserDetails()
            .then(result => {
                this.currentUserName = result;
            })
            .catch(error => {
                console.error('Error fetching dashboard count:', error);
            });
    }
    getDashboardData() {
        getDashboardData()
            .then(result => {
                this.dashBoardCardRecord = result;
                this.isCardRecord = true;
            })
            .catch(error => {
                console.log('error17==>' + JSON.stringify(error))
            })

        getCompletedCoursesData()
            .then(result => {
                this.staffChartData = result;
                this.isStaffChartData = true;
            })
            .catch(error => {
                console.log('error==>' + JSON.stringify(error))
            })

        getStaffCourseReportData()
            .then(result => {
                this.staffTableHeader = result.headers;
                this.staffTableReport = result.staffData;
                this.isStaffTableData = true;
                console.log(result);
            })
            .catch(error => {
                console.log('error==>' + JSON.stringify(error))
            })

        getCourseReportData()
            .then(result => {
                this.reportTabelHeader = result.headers;
                this.courseEnrollmentData = result.courseData;
                this.isCourseEnrollment = true;
                console.log(result);
            })
            .catch(error => {
                console.log('error==>' + JSON.stringify(error))
            })

        getEnrollmentSummary()
            .then(result => {
                this.monthlyChartProgressData = result;
                this.isMonthlyProgressData = true;
                console.log('@@@@@@@@@@@@@@@@178', result);
            })
            .catch(error => {
                console.log('error==>' + JSON.stringify(error))
            })

    }
}