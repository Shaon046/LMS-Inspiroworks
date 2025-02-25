import { LightningElement,api,wire } from 'lwc';

export default class LmsDashboardCourseEnrollmentReport extends LightningElement {
    @api enrollmentRecord;
    @api tableHeaders = [];

}