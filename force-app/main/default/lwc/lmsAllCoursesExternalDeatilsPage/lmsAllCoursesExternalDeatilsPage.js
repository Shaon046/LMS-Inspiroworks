import { LightningElement, track, api } from 'lwc';
export default class LmsAllCoursesExternalDeatilsPage extends LightningElement {

    showPopup = false;
    objectLabel = 'Course';
    objectName = "Course__c";
    customMetadataName = 'Course';
    hasAttachment = true;
    @track courseId;
    isShowCourseDetailView = false;
    isRefreshCourse = false;
    exitPopup() {
        this.showPopup = false;
    }
    handleCourseCreated(event) {
        this.showPopup = event.detail?.showPopup ?? false;
    }

    getSelectedCourseId(event) {
        this.courseId = event.detail?.courseId;
        console.log('Selected Course ID:', this.courseId);
        this.isShowCourseDetailView = true;
    }


    recordSaved() {
        this.isRefreshCourse = true;
        console.log('course Saved in external')
        setTimeout(() => {
            this.isRefreshCourse = false;
        }, 2000)
    }


}