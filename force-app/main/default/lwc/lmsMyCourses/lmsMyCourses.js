import { LightningElement, wire, track, api } from 'lwc';
import fetchAvailableCoursesWithFiles from '@salesforce/apex/LMSCoursesTabController.fetchAvailableCoursesWithFiles';
import getCourseDetails from '@salesforce/apex/LmsInternalCourseDetailViewController.getCourseDetails';
import { CurrentPageReference } from 'lightning/navigation'; 


export default class LmsMyCourses extends LightningElement {
    showPopup = false;
    @track recordsData;
    @track filteredData;
    @track totalCredit = 0;

    @track courseName;

    getCurrentMyCourseId;
    isMyCourseDetailPage = false;

//added
    @wire(CurrentPageReference)
    getStateParameters(currentPageReference) {
        console.log('Page Reference:', currentPageReference);
        if (currentPageReference && currentPageReference.state) {
            const cId = currentPageReference.state.courseId;
            if (cId === undefined || cId === null) {
                this.isMyCourseDetailPage = false;
            } else {
                this.fetchCourseDetails(cId);
                this.getCurrentMyCourseId = cId;
                this.isMyCourseDetailPage = true;
            }
            console.log('Course ID:   ddddddd', cId);
        } else {
            console.log('No courseId found in the page reference state');
        }
    }

    connectedCallback() {
        this.fetchAvailableCoursesWithFiles();
    }

    fetchAvailableCoursesWithFiles() {
        fetchAvailableCoursesWithFiles()
            .then((data) => {
                if (data) {
                    console.log(JSON.stringify(data));
                    this.recordsData = data.map(course => {
                        return {
                            ...course,
                            files: course.files.map(file => ({
                                ...file,
                                fileImageUrl: `/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=${file.LatestPublishedVersionId}`,
                            })),
                        };
                    });
                    this.filteredData = [...this.recordsData];
                    console.log(' this.recordsData37===>' + JSON.stringify(this.recordsData));
                }
            })
            .catch((error) => {
                console.log('fetching error' + JSON.stringify(error));
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

    hanldeGetCourseId(event) {
        console.log(event.target.dataset.id);
        this.getCurrentMyCourseId = event.target.dataset.id;
        this.fetchCourseDetails(this.getCurrentMyCourseId);
        this.isMyCourseDetailPage = true;
    }


    //added by prashant 

    fetchCourseDetails(recordId) {
        getCourseDetails({ recordId })
            .then(data => {
                this.courseName = data.courseTitle;
                this.creditPoint = data.creditsPoints;
                this.description = data.courseDescription;
                console.log('Course details fetched:', JSON.stringify(data));
            })
            .catch(error => {
                console.error('Error fetching course details:', error);
            });
    }
}