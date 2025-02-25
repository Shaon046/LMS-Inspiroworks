import { LightningElement,api,track } from 'lwc';
export default class LmsCertificateTab extends LightningElement {
@api courseName;
dateOfCompletion

_enrolledCourseDetails; 
@track dateOfCompletion;
@api courseImage;
@api courseRecordId
firstName;
lastName
orgName
    @api 
    get enrolledCourseDetails() {
        return this._enrolledCourseDetails;
    }
    set enrolledCourseDetails(value) {
        this._enrolledCourseDetails = value;
        console.log("Setting enrolledCourseDetails:", JSON.stringify(value));
        if (value) {
            this.dateOfCompletion = value.enrolledCourse.Date_Of_Completion__c;
            this.firstName =value.FirstName;
            this.lastName = value.LastName;
            this.orgName = value.orgName;

        } 
    }


   downloadPDF() {
    const vfPageUrl = `/apex/lmsCourseCompletionCertificate?courseRecordId=${this.courseRecordId}`;
    const anchor = document.createElement('a');
    anchor.href = vfPageUrl;
    anchor.download = `${courseName}-Completion-Certificate.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
}


    
}