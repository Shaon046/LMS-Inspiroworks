import { LightningElement, track, api } from 'lwc';
import fetchCourseModules from '@salesforce/apex/lmsMyCourseModulesController.fetchCourseModules';
import getCourseDetails from '@salesforce/apex/LmsInternalCourseDetailViewController.getCourseDetails';
import createLMSCourseEnrolment from '@salesforce/apex/lmsCourseEnrollementControllers.createLMSCourseEnrolment';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import fetchConfigurationStyles from '@salesforce/apex/LMSCoursesTabController.fetchAvailableCoursesWithFiles';
import getCourseModule from '@salesforce/apex/lmsMyCourseModulesController.getCourseModule';



export default class LmsExternalLearnerCourseDetailPage extends LightningElement {
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
    //@api isCurrentDetailPageRendered = false;
    //isCurrentPageDetails=false;
    @track courseModuleId;

    @track isShowModal = true;
    isRegistered = false;

    @track fileImageUrl;

    allModulesCompleted=false;


    isButtonDisabled = true;

    isEnrolled;
    isRetakeAvailble=false;
    ifretake= false;
    isShowDetailPage = false;
    isLoader=false;
    parentModuleId;
 @track communityHeaderStyle;

    connectedCallback() {
        this.fetchStyles();
    }
    

     fetchStyles() {
        fetchConfigurationStyles()
            .then((data) => {
                if (data) {
                    this.lmsConfigurations = data.map(item => item.lmsConfiguration);
                    this.communityHeaderStyle = `background-color : ${this.lmsConfigurations[0]?.Header_Display_Stylling__c}` || 'background: #add6e4;';
                }
            })
            .catch((error) => {
                console.error('Error fetching styles:', error);
            });
    }

    get computedHeaderStyle() {
        return this.communityHeaderStyle || 'background: #add6e4;';
    }


    get courseRecordId() {
        return this._courseRecordId;
    }

    set courseRecordId(value) {
        this._courseRecordId = value;
        if (value) {
                console.log('test Log @@@@@',this.isCurrentDetailPageRendered);
           setTimeout(() => {
            this.fetchCourseDetails(value);
            this.fetchCourseModulesData(value);
        }, 2000);


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

fetchCourseModulesData(val) {
    fetchCourseModules({ getCourseId: val })
        .then(result => {
            console.log('Result: test 1234 61', JSON.stringify(result));
            this.isEnrolled = result[0].isEnrolled;
            const ifCourseEnrolled = result[0].isEnrolled;
            if (this.isEnrolled === true) {
                this.isEnrolled = false;
            } else {
                this.isEnrolled = true;
            }
            console.log('test isEnrolled @@@@', result);

            // Process course modules
            this.courseModulesData = result.map(group => {

                // console.log('shaon123',group.learnerModules)

                const isLearnerModulesAvailable = group.learnerModules && group.learnerModules.length > 0;
                const modulesToProcess = isLearnerModulesAvailable ? group.learnerModules : group.adminModules;
                let overallStatus = 'Not Started';

                if (isLearnerModulesAvailable) {
                    const moduleStatuses = modulesToProcess.map(module => module.Status_of_Course_Modules__c);

                    if (moduleStatuses.some(status => status === 'In progress')) {
                        overallStatus = 'In Progress';
                    } else if (moduleStatuses.some(status => status === 'Completed')) {
                        if (moduleStatuses.some(status => status === 'Not Started')) {
                            overallStatus = 'Inprogress';
                        }
                    }
                    if (moduleStatuses.every(status => status === 'Completed')) {
                        overallStatus = 'Completed';
                    }
                }

                return {
                    ...group,
                    isExpanded: false,
                    overallStatus,
                    iconPath: 'M19 13H5v-2h14v2zm-7-7v14h2V6h-2z',
                    unitDescription: modulesToProcess[0]?.Unit_Description__c || modulesToProcess[0]?.Unit_Description__c,
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

            // Flatten all modules from all groups
            const allModules = this.courseModulesData.flatMap(group => group.modules);

            // Find the first incomplete module (Not Started or In Progress)
            const firstIncompleteModule = allModules.find(
                module =>
                    module.Status_of_Course_Modules__c === 'Not Started' ||
                    module.Status_of_Course_Modules__c === 'In progress'
            );

            // Check if all modules are completed
            const allModulesCompleted = this.courseModulesData.every(
                group => group.overallStatus === 'Completed'
            );

            this.allModulesCompleted = allModulesCompleted;
            console.log('All modules completed:', this.allModulesCompleted);

            if (allModulesCompleted) {
                // If all modules are completed, do not show links to videos or quizzes
                this.isVideoAvailable = false;
                this.isQuizAvailable = false;
                this.isQuizVideoNotAvailable = true;
                this.ifretake =false;
                return; // Stop further processing
            }
            // Handle the first incomplete module logic (quiz or video)
            if (firstIncompleteModule) {
                this.courseModuleId = firstIncompleteModule.Id;
                this.getCourseModule();

                if (firstIncompleteModule.iSpring_HTML_File_Link__c) {
                    this.selectedVideoUrl = firstIncompleteModule.iSpring_HTML_File_Link__c;
                    this.isVideoAvailable = true;
                    this.isQuizAvailable = false;
                    this.isQuizVideoNotAvailable = true;
                    this.ifretake =false;
                } else if (firstIncompleteModule.hasQuiz) {
                    this.isVideoAvailable = false;
                    this.isQuizAvailable = true;
                    this.isQuizVideoNotAvailable = true;
                    this.ifretake =false;
                }
            }
        })
        .catch(error => {
            console.error('Error fetching course modules:', error);
        });
}



    getChangeVideoUrl(event) {
        const moduleId = event.target.dataset.moduleId;
        this.courseModuleId = event.target.dataset.moduleId;
        this.getCourseModule()



        this.courseModulesData = this.courseModulesData.map(group => ({
            ...group,
            modules: group.modules.map(module => {
                if (module.Id === moduleId) {
                    if (module.iSpring_HTML_File_Link__c) {
                        this.selectedVideoUrl = module.iSpring_HTML_File_Link__c;
                        this.isVideoAvailable = true;
                        this.isQuizVideoNotAvailable = true;
                        this.isQuizAvailable = false;
                        this.ifretake =false;
                        this.allModulesCompleted=false; // No quiz if video is available
                    } else if (module.hasQuiz) {
                        this.isVideoAvailable = false;
                        this.isQuizAvailable = true; // Show quiz section
                        this.isQuizVideoNotAvailable = true;
                        this.ifretake =false;
                        this.allModulesCompleted=false; // No quiz if video is available

                    }
                }
                return module;
            }),
        }));
    }

    handleGroupToggle(event) {
        const groupId = event.target.dataset.groupId;
       // console.log('groupId@@@@@@@@@@@@@@@@',groupId);
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


    //here adding addtobuy logic which written. by rohit

    handleEnrolled() {
        this.isLoader=true;
        this.isShowModal = false;
        this.handleBuy();
        this.isShowDetailPage = true;
       // this.isCurrentPageDetails=true;
        console.log(this.courseRecordId);
        this.fetchCourseModulesData(this.courseRecordId);

    }

    handleBuy() {
        console.log('handleBuy called');
        const selectedId = this.courseRecordId;
        console.log('Selected Id179===>' + JSON.stringify(selectedId));
        createLMSCourseEnrolment({ courseId: selectedId })
            .then(result => {
                console.log('result===>' + JSON.stringify(result));
                if (result != 'Success') {
                    this.successToast('Course Successfully Enrolled !!!', 'Success');
                    this.isShowModal = false;
                    this.isLoader= false;
                }
                else {
                    this.successToast('You have successfully enrolled in the course.');
                    this.handleRefresh();
                    this.isLoader= false;

                }
            })
            .catch(error => {
                console.log('error===>' + JSON.stringify(error));
            })
    }

    handlePopUp() {
        this.isShowModal = true;
    }

    hideModalBox() {
        this.isShowModal = false;
    }

    successToast(title, variant) {
        const toastEvent = new ShowToastEvent({
            title: title,
            variant: variant,
            mode: "dismissable",
        })

        this.dispatchEvent(toastEvent)
    }

    handleMessage(event) {
    if (event.type === 'refreshQuizOnly') {
        console.log('Refreshing Quiz Only...');
        this.refreshQuiz();
    } else {
        console.log('Refreshing Entire Module...');
        this.fetchCourseModulesDatassss(this.courseRecordId);
    }
}

refreshQuiz() {
    // Find the current quiz module and refresh its data
    const quizModule = this.courseModulesData.flatMap(group => group.modules)
                        .find(module => module.Id === this.courseModuleId && module.hasQuiz);
    if (quizModule) {
        this.isQuizAvailable = true;
        this.isVideoAvailable = false;
        this.isQuizVideoNotAvailable = true;
        console.log('Quiz refreshed successfully!');
    }
}

    handleRetakeQuiz(event) {
        const { courseModulePartId, isRetakeFlag } = event.detail;
         this.courseModuleId = courseModulePartId;
         this.ifretake = true;
         this.isVideoAvailable =false;
         this.isRetakeAvailble= isRetakeFlag;
         console.log(courseModulePartId);  // For example
         console.log(isRetakeFlag);
    }



    fetchCourseModulesDatassss(val) {
    fetchCourseModules({ getCourseId: val })
        .then(result => {
            console.log('Result: test 1234 61', JSON.stringify(result));
            this.isEnrolled = result[0].isEnrolled;
            const ifCourseEnrolled = result[0].isEnrolled;
            if (this.isEnrolled === true) {
                this.isEnrolled = false;
            } else {
                this.isEnrolled = true;
            }
            console.log('test isEnrolled @@@@', result[0].isEnrolled);

            // Process course modules
            this.courseModulesData = result.map(group => {
                const isLearnerModulesAvailable = group.learnerModules && group.learnerModules.length > 0;
                const modulesToProcess = isLearnerModulesAvailable ? group.learnerModules : group.adminModules;
                let overallStatus = 'Not Started';

                if (isLearnerModulesAvailable) {
                    const moduleStatuses = modulesToProcess.map(module => module.Status_of_Course_Modules__c);

                    if (moduleStatuses.some(status => status === 'In progress')) {
                        overallStatus = 'In Progress';
                    } else if (moduleStatuses.some(status => status === 'Completed')) {
                        if (moduleStatuses.some(status => status === 'Not Started')) {
                            overallStatus = 'Inprogress';
                        }
                    }
                    if (moduleStatuses.every(status => status === 'Completed')) {
                        overallStatus = 'Completed';
                    }
                }

                return {
                    ...group,
                    isExpanded: false,
                    overallStatus,
                    iconPath: 'M19 13H5v-2h14v2zm-7-7v14h2V6h-2z',
                    unitDescription: modulesToProcess[0]?.Course_Module_Name__c || modulesToProcess[0]?.Name,
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

            // Flatten all modules from all groups
            const allModules = this.courseModulesData.flatMap(group => group.modules);

            // Find the first incomplete module (Not Started or In Progress)
            const firstIncompleteModule = allModules.find(
                module =>
                    module.Status_of_Course_Modules__c === 'Not Started' ||
                    module.Status_of_Course_Modules__c === 'In progress'
            );

            // Check if all modules are completed
            const allModulesCompleted = this.courseModulesData.every(
                group => group.overallStatus === 'Completed'
            );

            this.allModulesCompleted = allModulesCompleted;
            console.log('All modules completed:', this.allModulesCompleted);
        })
        .catch(error => {
            console.error('Error fetching course modules:', error);
        });
}


getCourseModule(){
    getCourseModule({recordId:this.courseModuleId}).then((parentModuleId)=>{
        this.parentModuleId = parentModuleId;
        console.log("check218",parentModuleId)}).catch((err)=>{
        console.warn(err)
    })
}



}