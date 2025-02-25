import { LightningElement,wire, api } from 'lwc';
import getDashboardData from '@salesforce/apex/LMSCourseDashboardController.getDashboardData';
export default class LmsDashboardCardsReport extends LightningElement {

   
    @api dashboardCardData = [];

    @wire(getDashboardData)
    wiredDashboardData({ error, data }) {
        if (data) {
            this.dashboardData = data;
            console.log('this.dashboardData12==>' +JSON.stringify(this.dashboardData));
        } else if (error) {
            console.error('Error fetching dashboard data:', error);
        }
    }
}