import { LightningElement, track } from 'lwc';
import getEnrolledCourseDetails from '@salesforce/apex/LMSCalendarEventsController.getEnrolledCourseDetails'
export default class LmsCalendarAndEvents extends LightningElement {

    @track calendarEvents;

    connectedCallback() {
        this.getEnrolledCourseDetails();
    }

    getEnrolledCourseDetails() {
        getEnrolledCourseDetails()
            .then((res) => {
                //console.log('Response:', res);
                this.calendarEvents = res;
                //this.addEvents(this.calendarEvents);
            })
            .catch((err) => {
                console.warn('Error:', err);
            });
    }


}