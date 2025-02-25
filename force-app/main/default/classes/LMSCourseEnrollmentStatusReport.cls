public Without Sharing class LMSCourseEnrollmentStatusReport {
    
   @AuraEnabled()
    public static CourseReportWrapper getCourseReportData() {
        // Wrapper to store headers and course data
        CourseReportWrapper reportWrapper = new CourseReportWrapper();
        
        // Fetch table headers
        reportWrapper.headers = new List<String>();
        for (lmsCourseReport__mdt metadata : [SELECT Header_Name__c, order__c 
                                            FROM lmsCourseReport__mdt  
                                            WHERE Type__c = 'Course'  
                                            ORDER BY order__c ASC]) {
            reportWrapper.headers.add(metadata.Header_Name__c);
        }

        // Fetch course data
        Map<Id, Course__c> courseMap = new Map<Id, Course__c>([SELECT Id, Title__c FROM Course__c]);
        system.debug('courseMap7==>' + courseMap);
        
        List<AggregateResult> enrollments = [SELECT Course_Title__c, Status__c, COUNT(Id) totalCount 
                                            FROM LMS_Course_Enrolment__c 
                                            WHERE Course_Title__c IN :courseMap.keySet()
                                            GROUP BY Course_Title__c, Status__c];
        
        Map<Id, Map<String, Integer>> enrollmentCounts = new Map<Id, Map<String, Integer>>();
        for (AggregateResult ar : enrollments) {
            Id courseId = (Id) ar.get('Course_Title__c');
            String status = (String) ar.get('Status__c');
            Integer count = (Integer) ar.get('totalCount'); 
            if (!enrollmentCounts.containsKey(courseId)) {
                enrollmentCounts.put(courseId, new Map<String, Integer>());
            }
            enrollmentCounts.get(courseId).put(status, count);
        }
        
        reportWrapper.courseData = new List<DataWrapper>();
        for (Course__c course : courseMap.values()) {
            DataWrapper data = new DataWrapper();
            data.courseName = course.Title__c;
            
            Map<String, Integer> courseEnrollments = enrollmentCounts.get(course.Id);
            
            data.enrolledCount = courseEnrollments != null && courseEnrollments.containsKey('Registered') ? courseEnrollments.get('Registered') : 0; 
            
            data.inProgressCount = courseEnrollments != null && courseEnrollments.containsKey('In Progress') ? courseEnrollments.get('In Progress') : 0; 
            
            data.completedCount = courseEnrollments != null && courseEnrollments.containsKey('Completed') ? courseEnrollments.get('Completed') : 0;
            
            reportWrapper.courseData.add(data);
            system.debug('reportData41==>' + reportWrapper.courseData.size());
        }
        
        return reportWrapper;
    }

    // Wrapper class to hold headers and course data
    public class CourseReportWrapper {
        @AuraEnabled public List<String> headers { get; set; }
        @AuraEnabled public List<DataWrapper> courseData { get; set; }

        public CourseReportWrapper() {
            this.headers = new List<String>();
            this.courseData = new List<DataWrapper>();
        }
    }

    // Wrapper class to hold individual course data
    public class DataWrapper {
        @AuraEnabled public String courseName { get; set; }
        @AuraEnabled public Integer enrolledCount { get; set; }
        @AuraEnabled public Integer inProgressCount { get; set; }
        @AuraEnabled public Integer completedCount { get; set; }
    }

}