import { LightningElement, track } from 'lwc';
import getUserProfileType from '@salesforce/apex/LMSCoursesTabController.getUserProfileType';

export default class LmsDashboardHome extends LightningElement {
    @track isAdmin = false;
    @track isLearner = false;

    connectedCallback() {    
        getUserProfileType()
            .then(result => {
                console.log(result);
                this.isAdmin = result.isAdmin;
                this.isLearner = result.isLearner;
            })
            .catch(error => {
                console.error('Error fetching dashboard count:', error);
            });
    }
}