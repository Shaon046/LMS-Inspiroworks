import { LightningElement, wire, track } from 'lwc';
import fetchAvailableCoursesWithFiles from '@salesforce/apex/lmsCoursesTabController.fetchAvailableCoursesWithFiles';
import createLMSCourseEnrolment from '@salesforce/apex/LMSCourseEnrollementController.createLMSCourseEnrolment';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class LmsInternalCourseList extends LightningElement {
    @track recordsData;
    showPopup = false;
    @track isLoading = false;

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

    //for handle Enroll button logic
    handleEnroll(event) {
        this.isLoading = true;
        console.log('handleEnroll called');
        const seletedCourseId = event.currentTarget.dataset.id;
        console.log('seletedCourseId37==>' + JSON.stringify(seletedCourseId));
        createLMSCourseEnrolment({ courseId: seletedCourseId })
            .then(result => {
                console.log('result==>41' + JSON.stringify(result));
                if (result != 'Succes') {
                    this.errorToast(result);
                    this.isLoading = false;
                }
                else {
                    this.successToast('You have successfully enrolled in the course.');
                    this.isLoading = false;
                }
            })
            .catch(error => {
                console.log(error + '===>44');
            })

    }

    errorToast(title) {
        const toastEvent = new ShowToastEvent({
            title,
            variant: "error",
            mode: "dismissable",

        })

        this.dispatchEvent(toastEvent)
    }

    successToast(title) {
        const toastEvent = new ShowToastEvent({
            title,
            variant: "success",
            mode: "dismissable",
        })

        this.dispatchEvent(toastEvent)
    }
}