import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';


export default class LmsDashboardMyCourses extends NavigationMixin(LightningElement) {

    @api myCourses;

    connectedCallback() {
        this.myCourses = JSON.parse(JSON.stringify(this.myCourses));
        this.myCourses.forEach(course => {
            let courseStatus = course.Status__c;
            if(courseStatus == 'Registered' ){
               course.btnLabel = 'Start';
            } else if(courseStatus == 'In Progress' || courseStatus == 'Completed'){
                course.btnLabel = 'Continue'
            }
        });

        console.log(JSON.stringify(this.myCourses));
    }

    handleRedirect(e){
        let courseId = e.target.dataset.id;

        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: `/course-detail?courseId=${courseId}`
            },
            state: {
             courseId: `${courseId}`
    }
        });
    }

}