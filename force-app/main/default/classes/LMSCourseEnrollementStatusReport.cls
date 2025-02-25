public class LMSCourseEnrollementStatusReport {

    public static void getAllDataForReport(){
        List<Course__c> courseList = [SELECT Id,Name FROM Course__c];
    }
    
public class dataWrapper{
    @AuraEnabled
    public List<Course__c> courseList;
}
}