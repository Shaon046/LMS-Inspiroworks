import { LightningElement } from 'lwc';
import getMyCourses from '@salesforce/apex/LMSDashboardController.getMyCourses';
import getReportData from '@salesforce/apex/LMSDashboardController.getReportData';
import getUserDetails from '@salesforce/apex/LMSDashboardController.getUserDetails';

export default class LmsDashboardBody extends LightningElement {

    myCourses;
    reportData;
    username;
    isRepportDataReady = false;
    isDataReady = false;
    enrolledCourses = 0;
    inProgressCourses = 0;
    completedCourses = 0;

    connectedCallback() {
        getMyCourses().then(result => {
            this.myCourses = result;
            this.isDataReady = true;
            console.log(JSON.stringify(this.myCourses));
            this.myCourses.forEach(course => {
                if(course.Status__c == 'In Progress'){
                    this.inProgressCourses++;
                }
                else if(course.Status__c == "Completed"){
                    this.completedCourses++;
                }
                else if(course.Status__c == "Registered"){
                    this.enrolledCourses++
                }
            });
        });

        getReportData().then(result => {
            
            this.reportData = result;
            this.isRepportDataReady = true;
        });


         getUserDetails().then(result => {            
            this.username = result;
        })
    }

}