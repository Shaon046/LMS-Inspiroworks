public Without Sharing class LMSCourseDashboardController {
    
    @AuraEnabled(cacheable=true)
    public static List<DataWrapper> getDashboardData() {
        List<DataWrapper> dashboardData = new List<DataWrapper>();
        
        // Query to get unique staff count
        AggregateResult result;
        if(Schema.sObjectType.LMS_Course_Enrolment__c.fields.User__c.isAccessible()){
            result = [SELECT COUNT_DISTINCT(User__c) countUniqueStaff FROM LMS_Course_Enrolment__c];
        }
        
        
        // Extract the count from the AggregateResult
        Integer staffCount = (Integer) result.get('countUniqueStaff');
        
        // Add to dashboard data
        dashboardData.add(new DataWrapper('Staffs', 'utility:people', staffCount));
        
        
        // Query to count unique courses
        Integer uniqueCourseCount = [SELECT COUNT() FROM Course__c];
        dashboardData.add(new DataWrapper('Unique Courses', 'utility:education', uniqueCourseCount));
        
        // Query to count enrolled courses
        Integer enrolledCourseCount;
        if(Schema.sObjectType.LMS_Course_Enrolment__c.fields.Status__c.isAccessible()){
            enrolledCourseCount = [SELECT COUNT() FROM LMS_Course_Enrolment__c WHERE Status__c = 'Registered'];
            dashboardData.add(new DataWrapper('Enrolled Courses', 'utility:note', enrolledCourseCount));
        }
       
        
        // Query to count in-progress courses
         Integer inProgressCourseCount;
        if(Schema.sObjectType.LMS_Course_Enrolment__c.fields.Status__c.isAccessible()){
            inProgressCourseCount = [SELECT COUNT() FROM LMS_Course_Enrolment__c WHERE Status__c = 'In Progress'];
            dashboardData.add(new DataWrapper('In Progress Courses', 'utility:knowledge_base', inProgressCourseCount));
        }
        
        
        return dashboardData;
    }
    
    public class DataWrapper {
        @AuraEnabled
        public String label { get; set; }
        @AuraEnabled
        public String icon { get; set; }
        @AuraEnabled
        public Integer count { get; set; }
        
        public DataWrapper(String label, String icon, Integer count) {
            this.label = label;
            this.icon = icon;
            this.count = count;
        }
    }
}