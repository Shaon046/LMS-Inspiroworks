import { LightningElement, wire, track } from 'lwc';
import fetchAvailableCoursesWithFiles from '@salesforce/apex/lmsCoursesTabController.fetchAvailableCoursesWithFiles';
export default class Mytest extends LightningElement {
    showPopup = false;
    @track recordsData;

    @wire(fetchAvailableCoursesWithFiles)
    wiredContacts({ error, data }) {
        if (data) {
            console.log(JSON.stringify(data));
            this.recordsData = data.map(course => ({
                ...course,
                files: course.files.map(file => ({
                    ...file,
                    fileImageUrl: `/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=${file.LatestPublishedVersionId}`,
                }))
            }));
            console.log(' this.recordsData37===>' + JSON.stringify(this.recordsData));
        } else if (error) {
            this.error = error;
        }
    }

    createCourse() {
        this.showPopup = !this.showPopup
        this.dispatchEvent(new CustomEvent('coursecreate', {
            detail: { showPopup: this.showPopup }
        }));

    }
    
}