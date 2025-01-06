import { LightningElement, wire, track } from 'lwc';
import fetchAvailableCoursesWithFiles from '@salesforce/apex/lmsCoursesTabController.fetchAvailableCoursesWithFiles';
import { publish, MessageContext } from 'lightning/messageService';
import COUNTING_UPDATED_CHANNEL from '@salesforce/messageChannel/Cart_Item__c';

export default class LmsCourseTabs extends LightningElement {
    @track recordsData;
    @track isShowModal = false;
    @track value;
    @track seletedCourseId;
    @track seletedCourseName;
    @track seletedCourseType
    isShowAddCard = false;
    isViewBoolean = false;
    get options() {
        return [
            { label: 'List View', value: 'listView' },
            { label: 'Grid View', value: 'gridView' }
        ];
    }

    handleChange(event) {
        this.value = event.detail.value;
    }

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

    handleViewChange(event) {
        this.value = event.detail.value;
        console.log('getValues@@@37 ' + this.value);
        if (this.value === 'gridView') {
            this.isViewBoolean = true;
        } else {
            this.isViewBoolean = false;
        }
    }

    //    getCurrectCourseId(event){
    //         const seletedId = event.currentTarget.dataset.id;
    //         console.log('Selected Id25 in parent===>' + JSON.stringify(seletedId));
    //         this.template.querySelector('c-lms-course-detail-page').showModalBox(seletedId);

    //     }



    @wire(MessageContext)
    MessageContext;

    getCurrectCourseId(event) {
        this.seletedCourseId = event.currentTarget.dataset.id;
        this.seletedCourseName = event.currentTarget.dataset.itemName;
        this.seletedCourseType = event.currentTarget.dataset.itemType; 
        console.log('Selected Id72 in parent===>' + JSON.stringify(this.seletedCourseId));
        console.log('Selected Id70 in parent===>' + JSON.stringify(this.seletedCourseName));
        console.log('Selected Id71 in parent===>' + JSON.stringify(this.seletedCourseType));

        this.handlePopUp();
        this.getCurrectFileUrl();

    }

    getCurrectFileUrl(event){
       const fileLatestPublishedVersionId = event.currentTarget.dataset.itemFile; 
       console.log('Selected Id79 in parent===>' + JSON.stringify(fileLatestPublishedVersionId));

        // Construct the file URL
    this.fileImageUrl = `/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=${fileLatestPublishedVersionId}`;
    console.log('Constructed File URL:', this.fileImageUrl);
    }

    getListCourseId(event){
        this.seletedCourseId = event.currentTarget.dataset.id;
        this.seletedCourseName = event.currentTarget.dataset.itemName;
        this.seletedCourseType = event.currentTarget.dataset.itemType; 
        console.log('Selected Id91 ===>' + JSON.stringify(this.seletedCourseId));
        console.log('Selected Id92 ===>' + JSON.stringify(this.seletedCourseName));
        console.log('Selected Id93 ===>' + JSON.stringify(this.seletedCourseType));
        this.handlePopUp();
        this.getCurrentListFileUrl();
    }

    getCurrentListFileUrl(event){
        console.log('getCurrentListFileUrl called');
        const fileLatestPublishedVersionId = event.currentTarget.dataset.itemFiles; 
        console.log('Selected Id100 ===>' + JSON.stringify(fileLatestPublishedVersionId));

        // Construct the file URL
          // Construct the file URL
    this.fileImageUrl = `/sfc/servlet.shepherd/version/renditionDownload?rendition=THUMB720BY480&versionId=${fileLatestPublishedVersionId}`;
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
        const seletedId = this.seletedCourseId;;

        console.log('Selected Id80 in parent===>' + JSON.stringify(seletedId));
        const payload = {
            cartId: seletedId,
        };
        publish(this.MessageContext, COUNTING_UPDATED_CHANNEL, payload);
    }


}