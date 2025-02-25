import { LightningElement, track } from 'lwc';
import getUserDetails from '@salesforce/apex/LMSDashboardController.getUserDetails';
import refreshApex from 'lightning/refresh'
import getDashboardData from '@salesforce/apex/LMSCourseDashboardController.getDashboardData';
import getCompletedCoursesData from '@salesforce/apex/LMSStaffChartCourseDataController.getCompletedCoursesData';
import getStaffCourseReportData from '@salesforce/apex/LMSStaffCourseDataController.getStaffCourseReportData';
import getCourseReportData from '@salesforce/apex/LMSCourseEnrollmentStatusReport.getCourseReportData';
import getEnrollmentSummary from '@salesforce/apex/LMSMonthlyReportController.getEnrollmentSummary';



export default class LmsInternalAccessPage extends LightningElement {
    showPopup = false;
    @track userName;
    objectLabel = 'Course';
    objectName = "Course__c";
    customMetadataName = 'Course';
    hasAttachment = true;
    isShowCourseDetailView = false;
    @track courseId;
    recordSaved = false;
    isRefreshCourse = false;

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
        this.getUserDetails();
        this.getDashboardData();
    }

    //  dashboard count data
    getUserDetails() {
        getUserDetails()
            .then(result => {
                this.userName = result;
            })
            .catch(error => {
                console.error('Error fetching dashboard count:', error);
            });
    }

    // Handle tab selection logic
    updateTabs(selectedTabId) {
        const tabItems = this.template.querySelectorAll('.slds-tabs_default__item');
        const tabContents = this.template.querySelectorAll('.slds-tabs_default__content');


        // Update tab items
        tabItems.forEach(item => {

            console.log('outer>>>>>>', item);

            console.log('Check1122@@@@@@@@', item.dataset.id, '&&', selectedTabId, item.dataset.id === selectedTabId)


            item.classList.toggle('slds-is-active', item.dataset.id === selectedTabId);
        });

        // Update tab contents
        tabContents.forEach(content => {
            const isActive = content.dataset.id === selectedTabId;
            content.classList.toggle('slds-show', isActive);
            content.classList.toggle('slds-hide', !isActive);
        });
    }

    selectedTab(event) {
        const selectedTabId = event.currentTarget.dataset.id;
        console.log('Selected Tab ID:@@@@@@@@@@', selectedTabId);
        this.updateTabs(selectedTabId);
        this.isShowCourseDetailView = false;
        this.isDetailsPagesHidden()
    }

    handleCourseCreated(event) {
        this.showPopup = event.detail?.showPopup ?? false;
    }

    exitPopup() {
        this.showPopup = false;
    }

    getSelectedCourseId(event) {
        this.isShowCourseDetailView = true;
        this.courseId = event.detail?.courseId;
        console.log('Selected Course ID:', this.courseId);
        setTimeout(() => {
            this.updateTabs('course_detail_view');
        }, 0);
    }


    hideCourseDetailView() {
        this.isShowCourseDetailView = false;
        this.updateTabs('All_Courses');
    }

    afterRecordSave() {
        this.recordSaved = true;
        this.isRefreshCourse = true;
        setTimeout(() => { this.recordSaved = false; this.isRefreshCourse = false; }, 2000)
        console.log("record saved")
    }


    //this function will call the function of lmsAllCourses
    isDetailsPagesHidden() {
        const allCourse = this.template.querySelector('c-lms-all-courses');
        if (allCourse) {
            allCourse.isDetailsPagesHidden();
        }

        const myCourse = this.template.querySelector('c-lms-internal-my-course-detailpage');
        if (myCourse) {
            myCourse.resetCourseModule();
        }

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
                console.log('@@@@@@@@@@@@@@@@178',result);
            })
            .catch(error => {
                console.log('error==>' + JSON.stringify(error))
            })

    }

}