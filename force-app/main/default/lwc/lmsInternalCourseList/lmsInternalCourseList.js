import { LightningElement, wire, track } from 'lwc';
import fetchAvailableCoursesWithFiles from '@salesforce/apex/LMSCoursesTabController.fetchAvailableCoursesWithFiles';
import createLMSCourseEnrolment from '@salesforce/apex/LMSCourseEnrollementController.createLMSCourseEnrolment';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class LmsInternalCourseList extends LightningElement {
    @track recordsData;
    showPopup = false;
    @track isLoading = false;

    connectedCallback() {
        this.fetchCourses();
    }

    fetchCourses() {
        fetchAvailableCoursesWithFiles()
            .then(data => {
                console.log(JSON.stringify(data));

                this.recordsData = data.map(course => ({
                    ...course,
                    files: course.files.map(file => ({
                        ...file,
                        fileImageUrl: `/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=${file.LatestPublishedVersionId}`,
                    }))
                }));
                console.log('this.recordsData===>' + JSON.stringify(this.recordsData));
            })
            .catch(error => {
                this.error = error;
                console.error('Error fetching courses: ', error);
            });
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
                    this.recordsData = this.recordsData.map(courseWrapper => {
                        if (courseWrapper.course.Id === seletedCourseId) {
                            return {
                                ...courseWrapper,
                                isEnroll: true 
                            };
                        }
                        return courseWrapper; 
                    });
                    console.log('recordsData==>' + JSON.stringify(this.recordsData));
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

selectedCourse(event) {
    this.dispatchEvent( new CustomEvent('getcourseid', {
        detail: {
            courseId: event.currentTarget.dataset.id
        }
    }));
}


}