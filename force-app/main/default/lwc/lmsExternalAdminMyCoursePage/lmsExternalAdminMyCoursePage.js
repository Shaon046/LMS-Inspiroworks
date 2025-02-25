import { LightningElement,track,api } from 'lwc';
import fetchCourseModules from '@salesforce/apex/lmsMyCourseModulesController.fetchCourseModules';
import getCourseDetails from '@salesforce/apex/LmsInternalCourseDetailViewController.getCourseDetails';
export default class LmsExternalAdminMyCoursePage extends LightningElement {
courseTitle = 'Blended Learning and Virtual Classroom Techniques';
    courseTitle = 'Blended Learning and Virtual Classroom Techniques';
    @track courseModulesData = [];
    @track isVideoAvailable = false;
    @track isQuizAvailable = false; // Track quiz availability
    @track selectedVideoUrl;
    @track isQuizVideoNotAvailable = false;
    @api getCourseRecoerdId;
    totalCourseModules = 0;

    showPopup = false;
    objectLabel = 'LMS Course Module';
    objectName = 'LMS_Course_Module__c';
    customMetadataName = 'LMS_Course_Module';
    parentComponent = 'Course__c';
    courseName;
    creditPoint;
    session;
    description;
    @api courseRecordId;
    @api recordSaved;

     @track getCourseModuleId;
    isButtonDisabled=true;

    isEnrolled;
    isCourseEnrolledOrNot =false;
    get courseRecordId() {
        return this._courseRecordId;
    }

    set courseRecordId(value) {
        this._courseRecordId = value;
        console.log('Ids get from @@@@@@ 38 '+this.courseRecordId);
        if (value) {
            this.fetchCourseDetails(value);
            this.fetchCourseModulesData(value);
        }
    }

    get recordSaved() {
        return this._recordSaved;
    }

    set recordSaved(value) {
        this._recordSaved = value;
        if (value === true) {
            this.fetchCourseModulesData(this.courseRecordId);
        }
    }

    connectedCallback() {
        // Code to execute on component initialization
    }
fetchCourseModulesData(val) {
    fetchCourseModules({ getCourseId: val })
        .then(result => {
            console.log('Result: test 1234', JSON.stringify(result));
            this.courseModulesData = result.map(group => {
                const isLearnerModulesAvailable = group.learnerModules && group.learnerModules.length > 0;
                const modulesToProcess = isLearnerModulesAvailable ? group.learnerModules : group.adminModules;
                let overallStatus = 'Not Started';
                if (isLearnerModulesAvailable) {
                    const moduleStatuses = modulesToProcess.map(module => module.Status_of_Course_Modules__c);
                    if (moduleStatuses.some(status => status === 'In progress')) {
                        overallStatus = 'In Progress';
                    } else if (moduleStatuses.every(status => status === 'Completed')) {
                        overallStatus = 'Completed';
                    }
                }

                const moduleCount = modulesToProcess.length;
                console.log('moduleCount:', moduleCount);

                return {
                    ...group,
                    isExpanded: false,
                    // isEnrolled, // Add the isEnrolled value here
                    overallStatus,
                    iconPath: 'M19 13H5v-2h14v2zm-7-7v14h2V6h-2z',
                    unitDescription: modulesToProcess[0]?.Name || 'No Description',
                    modules: modulesToProcess.map(module => (
                        this.totalCourseModules++,
                        {
                            ...module,
                            isChecked: isLearnerModulesAvailable
                                ? module.Status_of_Course_Modules__c === 'Completed'
                                : false, // Admin modules do not have statuses
                            hasQuiz: module.Quiz_Header__c || false // Add quiz information
                        }
                    )),
                };
            });
        })
        .catch(error => {
            console.error('Error fetching course modules:', error);
        });
}


    getChangeVideoUrl(event) {
        const moduleId = event.target.dataset.moduleId;
        this.getCourseModuleId=moduleId;
        console.log('moduleId:', moduleId);
        this.courseModulesData = this.courseModulesData.map(group => ({
            ...group,
            modules: group.modules.map(module => {
                if (module.Id === moduleId) {
                    if (module.iSpring_HTML_File_Link__c) {
                        this.selectedVideoUrl = module.iSpring_HTML_File_Link__c;
                        this.isVideoAvailable = true;
                        this.isQuizVideoNotAvailable = true;
                        this.isQuizAvailable = false; // No quiz if video is available
                    } else if (module.hasQuiz) {
                        this.isVideoAvailable = false;
                        this.isQuizAvailable = true; // Show quiz section
                        this.isQuizVideoNotAvailable = true;
                    }
                }
                return module;
            }),
        }));
    }

    handleGroupToggle(event) {
        const groupId = event.target.dataset.groupId;
        this.courseModulesData = this.courseModulesData.map(group => {
            if (group.unitGroupId === groupId) {
                const isExpanded = !group.isExpanded;
                return {
                    ...group,
                    isExpanded,
                    iconPath: isExpanded
                        ? 'M19 13H5v-2h14v2z' // Expanded icon (-)
                        : 'M19 13H5v-2h14v2zm-7-7v14h2V6h-2z', // Collapsed icon (+)
                };
            }
            return group;
        });
    }

    handleCourseModuleCreated() {
        this.showPopup = true;
    }

    exitPopup() {
        this.showPopup = false;
    }

    exit() {
        this.dispatchEvent(new CustomEvent('hidecoursedetailview'));
    }

 fetchCourseDetails(recordId) {
    getCourseDetails({ recordId })
        .then(data => {
            this.courseName = data.courseTitle;
            this.creditPoint = data.creditsPoints;
            this.description = data.courseDescription;
            this.isRegistered = data.isEnrolled;
            // Properly interpolate latestPublishedId into the URL
            this.fileImageUrl = `/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=${data.latestPublishedId}`;
            console.log('Course details   this.fileImageUrl :', this.fileImageUrl);
            console.log('Course details fetched:', JSON.stringify(data));
        })
        .catch(error => {
            console.error('Error fetching course details:', error);
        });
}


afterRecordSaved(){
    console.log('record Saved046@@@@@@@177 ',this.courseRecordId);
    this.fetchCourseModulesData(this.courseRecordId)
}


}