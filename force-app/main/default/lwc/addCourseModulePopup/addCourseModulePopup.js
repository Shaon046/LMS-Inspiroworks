import { LightningElement, api } from 'lwc';

export default class AddCourseModulePopup extends LightningElement {
    @api recordId;  

    showPopup = false;
    objectLabel = 'LMS Course Module';
    objectName = 'LMS_Course_Module__c';
    customMetadataName = 'LMS_Course_Module';
    parentComponent = 'Course__c';
    connectedCallback() {
        console.log('Record Id:   testttetststst', this.recordId);
    }

    handleCourseModuleCreated() {
        this.showPopup = true;
    }

    exitPopup() {
        this.showPopup = false;
    }
}