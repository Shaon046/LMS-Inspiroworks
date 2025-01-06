import { LightningElement, track } from 'lwc';
import getDashboardCount from '@salesforce/apex/LMSDashboardController.getDashboardCount';

export default class LmsInternalAccessPage extends LightningElement {
    showPopup = false;
    @track dashboardCountData = {};
    objectLabel = 'Account'






    connectedCallback() {
        console.log('@@@@@',this.getAllDashbordCount());
    }

    getAllDashbordCount() {
        getDashboardCount()
            .then(result => {
               this.dashboardCountData = result;

                 console.log('@@@@@',JSON.stringify(this.dashboardCountData));
            })
            .catch(error => {
                console.log('error', error);
            })
    }
    selectedTab(eve) {
        console.log("here @@@@@", eve.currentTarget.dataset.id)
        // Get the selected tab's data-id
        const selectedTabId = eve.currentTarget.dataset.id;
        console.log('yyyyzzz@ ', selectedTabId)
        // Get all tab items and content sections
        const tabItems = this.template.querySelectorAll('.slds-tabs_default__item');
        const tabContents = this.template.querySelectorAll('.slds-tabs_default__content');
        console.log("tab Items@@@@", tabItems, " tabContents@@@@", tabContents);


        tabItems.forEach(currentItem => {
            if (selectedTabId === currentItem.dataset.id) {
                console.log('cr@@', currentItem)
                currentItem.classList.add('slds-is-active');
            } else {
                currentItem.classList.remove('slds-is-active');
            }

        });

        // tab content
        tabContents.forEach(content => {
            console.log('OUTPUT ## : ', content.dataset.id);

            if (content.dataset.id === selectedTabId) {
                content.classList.add('slds-show');
                content.classList.remove('slds-hide');
            } else {
                content.classList.add('slds-hide');
                content.classList.remove('slds-show');
            }
        });


    }

    handleCourseCreated(eve) {
        this.showPopup = eve.detail.showPopup;
    }

    exitPopup() {
        this.showPopup = false;
    }


}