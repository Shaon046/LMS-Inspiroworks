import { LightningElement, api, track } from 'lwc';
import getCourseDetails from '@salesforce/apex/LmsInternalCourseDetailViewController.getCourseDetails';
import getUserProfile from '@salesforce/apex/LmsInternalCourseDetailViewController.getUserProfile';

// added by prash
import fetchCourseModules from '@salesforce/apex/lmsMyCourseModulesController.fetchCourseModules';


export default class LmsInternalCourseDetailViewPage extends LightningElement {

//added by prash
 @track courseModulesData = [];
    @track isVideoAvailable = false;
    @track isQuizAvailable = false; // Track quiz availability
    @track selectedVideoUrl;

    // connectedCallback() {
    // }
//   fetchCourseModulesData() {
//         fetchCourseModules({ getCourseId: 'a00fJ00000273jCQAQ' })
//             .then(result => {
//                 console.log('Result:', JSON.stringify(result));
//                 this.courseModulesData = result.map(group => {
//                     const moduleStatuses = group.modules.map(module => module.Status_of_Course_Modules__c);

//                     let overallStatus = 'Not Started';
//                     if (moduleStatuses.some(status => status === 'In progress')) {
//                         overallStatus = 'In Progress';
//                     } else if (moduleStatuses.every(status => status === 'Completed')) {
//                         overallStatus = 'Completed';
//                     }

//                     return {
//                         ...group,
//                         isExpanded: false,
//                         overallStatus,
//                         iconPath: 'M19 13H5v-2h14v2zm-7-7v14h2V6h-2z',
//                         unitDescription: group.modules[0]?.Course_Module_Name__c || 'No Description',
//                         modules: group.modules.map(module => ({
//                             ...module,
//                             isChecked: module.Status_of_Course_Modules__c === 'Completed',
//                             hasQuiz: module.Quiz_Header__c || false // Add quiz information
//                         })),
//                     };
//                 });
//             })
//             .catch(error => {
//                 console.error('Error fetching course modules:', error);
//             });
//     }

//     getChangeVideoUrl(event) {
//         const moduleId = event.target.dataset.moduleId;

//         this.courseModulesData = this.courseModulesData.map(group => ({
//             ...group,
//             modules: group.modules.map(module => {
//                 if (module.Id === moduleId) {
//                     if (module.iSpring_HTML_File_Link__c) {
//                         this.selectedVideoUrl = module.iSpring_HTML_File_Link__c;
//                         this.isVideoAvailable = true;
//                         this.isQuizAvailable = false; // No quiz if video is available
//                     } else if (module.hasQuiz) {
//                         this.isVideoAvailable = false;
//                         this.isQuizAvailable = true; // Show quiz section
//                     }
//                 }
//                 return module;
//             }),
//         }));
//     }


//     handleGroupToggle(event) {
//         const groupId = event.target.dataset.groupId;
//         this.courseModulesData = this.courseModulesData.map(group => {
//             if (group.unitGroupId === groupId) {
//                 const isExpanded = !group.isExpanded;
//                 return {
//                     ...group,
//                     isExpanded,
//                     iconPath: isExpanded
//                         ? 'M19 13H5v-2h14v2z' // -
//                         : 'M19 13H5v-2h14v2zm-7-7v14h2V6h-2z', // +
//                 };
//             }
//             return group;
//         });
//     }







//     @api courseRecordId;

//     showPopup = false;
//     objectLabel = 'LMS Course Module';
//     objectName = 'LMS_Course_Module__c';
//     customMetadataName = 'LMS_Course_Module';
//     parentComponent = 'Course__c';
//     isAdmin = false;
//     courseName;
//     creditPoint;
//     session;
//     description;
//     @track courseModule;

//     get courseRecordId() {
//         return this._courseRecordId;
//     }

//     set courseRecordId(value) {
//         this._courseRecordId = value;
//         if (value) {
//             this.fetchCourseDetails(value); 
//         }
//     }

// connectedCallback() {
//     getUserProfile();
//             this.fetchCourseModulesData();

// }


//     //fetch course details
//     fetchCourseDetails(recordId) {
//         getCourseDetails({ recordId })
//             .then((data) => {
//                 this.courseName = data.courseTitle;
//                 this.creditPoint = data.creditsPoints;
//                 this.description = data.courseDescription;
//                 this.courseModule = data.courseModule;
//                 console.log('Course details fetched:', JSON.stringify(data));
//             })
//             .catch((error) => {
//                 console.error('Error fetching course details:', error);
//             });
//     }

//     getUserProfile(){
//         getUserProfile().then((res)=>{this.isAdmin = res.isAdmin}).catch((err)=>console.error(err));
//     }



//     handleCourseModuleCreated() {
//         this.showPopup = true;
//     }

//     exitPopup() {
//         this.showPopup = false;
//     }

//     exit() {
//         this.dispatchEvent(new CustomEvent('hidecoursedetailview'));
//     }


    
}