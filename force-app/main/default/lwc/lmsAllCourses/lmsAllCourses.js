import { LightningElement, track, wire, api } from 'lwc';
import fetchAvailableCoursesWithFiles from '@salesforce/apex/LMSCoursesTabController.fetchAvailableCoursesWithFiles';
import getUserProfileType from '@salesforce/apex/LMSCoursesTabController.getUserProfileType';
import { publish, MessageContext } from 'lightning/messageService';
import COUNTING_UPDATED_CHANNEL from '@salesforce/messageChannel/Cart_Item__c';
import createLMSCourseEnrolment from '@salesforce/apex/lmsCourseEnrollementControllers.createLMSCourseEnrolment';

import getCourseDetails from '@salesforce/apex/LmsInternalCourseDetailViewController.getCourseDetails';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';


export default class LmsAllCourses extends LightningElement {
    @track recordsData;
    @track filteredData;
    showPopup = false;
    @track isLoading = false;
    @track searchQuery = '';
    // @track selectedType = '';
    @track isAdmin = false;
    @track isLearner = false;
    @track isShowModal = false;
    @track selectedCourseId;
    @track seletedCourseName;
    @track seletedCourseType;
    @track courseName;
    //added  by prash
    @track isAllCoursesPage = true;
    @track isCourseDetailsPage = false;
    @track isExternalCourseDetailpage = false;
    @track getCourseId;
    _isRefreshCourse;


    //refresh the courses after adding new course

    @api
    get isRefreshCourse() {
        return this._isRefreshCourse;
    }
    set isRefreshCourse(value) {
        console.log('sb01', value)
        this._isRefreshCourse = value;
        if (this._isRefreshCourse == true) {
            this.fetchCourses()
        }

    }

    @wire(MessageContext)
    MessageContext;

    connectedCallback() {
        this.getUserProfileType();
        this.fetchCourses();

    }

    @api isDetailsPagesHidden() {
        this.isAllCoursesPage = true;
        this.isExternalCourseDetailpage = false;
        this.isCourseDetailsPage = false;
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
                this.filteredData = [...this.recordsData];
                console.log('this.recordsData===>' + JSON.stringify(this.filteredData));
            })
            .catch(error => {
                this.error = error;
                console.error('Error fetching courses: ', error);
            });
    }
    getUserProfileType() {
        getUserProfileType()
            .then(data => {
                this.isAdmin = data.isAdmin;
                this.isLearner = data.isLearner;
                console.log('isAdmin', data);
            })
            .catch(error => {
                console.error('Error fetching courses: ', error);
            })
    }


    filterCourses(event) {
        this.selectedType = event.target.value;
        console.log('Selected Type:', this.selectedType);
        this.applyFilters();
    }

    handleSearch(event) {
        this.searchQuery = event.target.value.toLowerCase();
        console.log('Search Query:', this.searchQuery);
        this.applyFilters();
    }
    applyFilters() {

        if (this.searchQuery) {
            if (this.selectedType) {
                console.log('Selected Type:', this.selectedType);
                this.filteredData = this.recordsData.filter(course =>
                    (course.course.Title__c &&
                        course.course.Title__c.toLowerCase().includes(this.searchQuery)) &&
                    (course.course.Course_Type__c &&
                        course.course.Course_Type__c.toLowerCase() === this.selectedType.toLowerCase())
                );
            } else {
                console.log('Search Query:', this.searchQuery);
                this.filteredData = this.recordsData.filter(course =>
                    course.course.Title__c &&
                    course.course.Title__c.toLowerCase().includes(this.searchQuery)
                );
            }

        } else {
            if (this.selectedType) {
                this.filteredData = this.recordsData.filter(course =>
                (course.course.Course_Type__c &&
                    course.course.Course_Type__c.toLowerCase() === this.selectedType.toLowerCase())
                );
            } else {
                this.filteredData = [...this.recordsData];

            }
        }


    }
    createCourse() {
        this.showPopup = true;
        console.log('clicked', this.showPopup)
        this.dispatchEvent(new CustomEvent('coursecreate', {
            detail: { showPopup: this.showPopup }
        }));

    }

    selectedCourse(event) {
        //added by prashnt 
        this.getCourseId = event.currentTarget.dataset.id;
        console.log(this.getCourseId);
        this.isAllCoursesPage = false;
        this.isCourseDetailsPage = true;
        //end here 
        this.dispatchEvent(new CustomEvent('getcourseid', {
            detail: {
                courseId: event.currentTarget.dataset.id
            }
        }));
    }



    // getUserProfile() {
    //     getUserProfile().then((res) => {
    //         console.log('OUTPUT : ', res.isAdmin)
    //         , this.isAdmin = res.isAdmin;
    //     }).catch((err) => { console.log(err) })
    // }

    handleSelectedCourse(event) {
        this.selectedCourseId = event.currentTarget.dataset.id;
        console.log('Selected Course Id128===>' + JSON.stringify(this.selectedCourseId));
        this.seletedCourseName = event.currentTarget.dataset.itemName;
        console.log('this.seletedCourseName @@@@@', this.seletedCourseName);
        this.seletedCourseType = event.currentTarget.dataset.itemType;
        console.log('Selected Id70 in parent===>' + JSON.stringify(this.seletedCourseName));
        console.log('Selected Id71 in parent===>' + JSON.stringify(this.seletedCourseType));

        // added by prash
        this.isAllCoursesPage = false;
        this.isExternalCourseDetailpage = true;
        //end
        this.handlePopUp();
        this.getCurrectFileUrl();

    }

    getCurrectFileUrl(event) {
        const fileLatestPublishedVersionId = event.currentTarget.dataset.itemFile;
        console.log('Selected Id79 in parent===>' + JSON.stringify(fileLatestPublishedVersionId));

        // Construct the file URL
        this.fileImageUrls = `/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=${fileLatestPublishedVersionId}`;
        console.log('Constructed File URL:', this.fileImageUrl);
    }

    handlePopUp() {
        this.isShowModal = true;
    }

    hideModalBox() {
        this.isShowModal = false;
    }

    handleCart() {
        this.isShowModal = false;
        const selectedId = this.selectedCourseId;;

        console.log('Selected Id169===>' + JSON.stringify(selectedId));
        const payload = {
            cartId: selectedId,
        };
        publish(this.MessageContext, COUNTING_UPDATED_CHANNEL, payload);
    }

    handleBuy() {
        console.log('handleBuy called');
        const selectedId = this.selectedCourseId;
        console.log('Selected Id179===>' + JSON.stringify(selectedId));

        createLMSCourseEnrolment({ courseId: selectedId })
            .then(result => {
                console.log('result===>' + JSON.stringify(result));
                if (result != 'Succes') {
                    this.errorToast(result);
                    this.isShowModal = false;
                }
                else {
                    this.successToast('You have successfully enrolled in the course.');
                }
            })
            .catch(error => {
                console.log('error===>' + JSON.stringify(error));
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

    //added by prashant 

    fetchCourseDetails(recordId) {
        getCourseDetails({ recordId })
            .then(data => {
                this.courseName = data.courseTitle;
                this.creditPoint = data.creditsPoints;
                this.description = data.courseDescription;
            })
            .catch(error => {
                console.error('Error fetching course details:', error);
            });
    }

}