import { LightningElement, track, api } from 'lwc';
import getCourseModuleResources from '@salesforce/apex/LmsInternalCourseDetailViewController.getCourseModuleResources';
import getChatterId from '@salesforce/apex/LmsInternalCourseDetailViewController.getChatterId';
import getEnrolledCourseDetails from '@salesforce/apex/LmsInternalCourseDetailViewController.getEnrolledCourseDetails';

export default class LmsQaAndResources extends LightningElement {
    isPreviewable = true;
    isGrpChat = true;
    @track parentId
    @api courseName;
    @track ischatterGroupIdReady = false;
    @api courseRecordId;

    showCertificateTab = false;

    @track resourceList = [];
    _moduleId;
    @track enrolledCourseDetails;
    courseImage;

    connectedCallback() {
        this.getChatterId();
        this.getCourseModuleResources();
        this.getEnrolledCourseDetails();
        // console.log('courseRecordIdshaon',this.courseRecordId);
    }

    @api
    get moduleId() {
        return this._moduleId;
    }
    set moduleId(value) {

        this._moduleId = value;
        this.getCourseModuleResources()
    }


    getCourseModuleResources() {
        getCourseModuleResources({ moduleId: this._moduleId })
            .then((res) => {
                //console.log('Response:', JSON.stringify(res));
                this.resourceList = res;
            })
            .catch((err) => console.warn(err));
    }


    @track activeTab = 'QA';

    selectedTab(event) {
        // Get the selected tab id
        const selectedTabId = event.currentTarget.dataset.id;
        this.activeTab = selectedTabId;

        // Get all tab
        const tabItems = this.template.querySelectorAll('.slds-tabs_default__item');
        const tabContents = this.template.querySelectorAll('.slds-tabs_default__content');

        // tabs
        tabItems.forEach(tab => {
            if (tab.dataset.id === selectedTabId) {
                tab.classList.add('slds-is-active');
            } else {
                tab.classList.remove('slds-is-active');
            }
        });

        // tab content
        tabContents.forEach(content => {
            if (content.dataset.id === selectedTabId) {
                content.classList.add('slds-show');
                content.classList.remove('slds-hide');
            } else {
                content.classList.add('slds-hide');
                content.classList.remove('slds-show');
            }
        });
    }


    getChatterId() {
        if (this.courseName) {
            getChatterId({ courseName: this.courseName }).then((chatterId) => {
                this.parentId = chatterId;
                this.ischatterGroupIdReady = true;
            }).catch((err) => console.warn(err));
        }
    }

    getEnrolledCourseDetails() {
        // console.log('test90');
        if (this.courseRecordId) {
            getEnrolledCourseDetails({ courseId: this.courseRecordId })
                .then((res) => {
                    this.enrolledCourseDetails = res;
                    this.showCertificateTab = res.enrolledCourse.Status__c == 'Completed';
                    console.log("enrolled course detail", JSON.stringify(this.enrolledCourseDetails));

                    const baseUrl = window.location.origin;
                    this.courseImage = baseUrl+`/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=${this.enrolledCourseDetails.courseImageDocumentId}`

                    console.log('courseImage@@@@@@@@@',this.courseImage)

                })
                .catch((err) => {
                    console.warn(err);
                });
        }

    }
}