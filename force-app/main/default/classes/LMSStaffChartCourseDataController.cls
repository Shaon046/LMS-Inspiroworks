public Without Sharing class LMSStaffChartCourseDataController {

    @AuraEnabled(cacheable=true)
    public static List<AggregateResult> getCompletedCoursesData() {
        return [
            SELECT User__r.Name staffName, COUNT(Id) completedCount
            FROM LMS_Course_Enrolment__c
            WHERE Status__c = 'Completed' AND User__r.Name != NULL
            GROUP BY User__r.Name
            ORDER BY COUNT(Id) DESC
        ];
    }
}