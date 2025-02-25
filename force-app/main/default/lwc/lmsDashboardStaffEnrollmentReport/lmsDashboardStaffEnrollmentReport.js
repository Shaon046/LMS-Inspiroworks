import { LightningElement,track,wire,api } from 'lwc';


export default class LmsDashboardStaffEnrollmentReport extends LightningElement {

    @api staffData;
    @api headers;

    // connectedCallback() {
    //     getStaffCourseData()
    //         .then(result => {
    //             console.log('result==>'+JSON.stringify(result))
    //             this.data = result;
    //             console.log('data', this.data);
    //             console.log('this.data13==Staff==>'+JSON.stringify(this.data))
    //         })
    //         .catch(error => {
    //             console.log('error==>'+JSON.stringify(error))
    //         });
    // }

    //     @wire(getTableHeaders)
    //     wiredHeaders({ error, data }) {
    //         if (data) {
    //             this.headers = data;
    //             console.log('this.headers27 In staff==>'+JSON.stringify(this.headers))
    //         } else if (error) {
    //             this.error = error;
    //         }
    //     }
}