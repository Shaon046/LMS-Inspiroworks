trigger LMSCourseEnrolmentTrigger on LMS_Course_Enrolment__c (before insert ,before update) {

    if(Trigger.isBefore){
        if(Trigger.isInsert){
           
        }
        if(Trigger.isUpdate){
            LMSCourseEnrolmentHelper.onBeforeUpdate(Trigger.new,Trigger.oldMap);
        }
    }
}