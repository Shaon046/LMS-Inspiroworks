/**
* @File Name : LMSMonthlyReportController.cls
* @Description :
* @Author :
* @Last Modified By :
* @Last Modified On : January 15, 2025
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | January 15, 2025 |   | Initial Version
**/


public Without Sharing class LMSMonthlyReportController {
	
   @AuraEnabled(cacheable=true)
    public static Map<String, Map<String, Integer>> getEnrollmentSummary() {
        // Fetch course data
        Map<Id, Course__c> courseMap = new Map<Id, Course__c>([SELECT Id, Title__c FROM Course__c]);
        System.debug('courseMap==>' + courseMap);

        // Fetch enrollments with status, registered date, and completion date (year and month)
        List<AggregateResult> enrollments = [
            SELECT 
                Status__c, 
                COUNT(Id) totalCount, 
                CALENDAR_YEAR(Date_Registered__c) registeredYear,
                CALENDAR_MONTH(Date_Registered__c) registeredMonth,
                CALENDAR_YEAR(Date_of_Completion__c) completionYear,
                CALENDAR_MONTH(Date_of_Completion__c) completionMonth,
                CALENDAR_YEAR(Course_Started_On__c) progressYear,
                CALENDAR_MONTH(Course_Started_On__c) progressMonth
            FROM LMS_Course_Enrolment__c 
            WHERE Course_Title__c IN :courseMap.keySet()
            GROUP BY 
                Status__c, 
                CALENDAR_YEAR(Date_Registered__c), 
                CALENDAR_MONTH(Date_Registered__c),
                CALENDAR_YEAR(Date_of_Completion__c), 
                CALENDAR_MONTH(Date_of_Completion__c),
                CALENDAR_YEAR(Course_Started_On__c),
                CALENDAR_MONTH(Course_Started_On__c) 
            ORDER BY CALENDAR_YEAR(Date_Registered__c) ASC, CALENDAR_MONTH(Date_Registered__c) ASC
        ];

        // Map to store results: "year-month" -> (status -> count)
        Map<String, Map<String, Integer>> statusCountByMonth = new Map<String, Map<String, Integer>>();

        for (AggregateResult ar : enrollments) {
            // Determine the status and count
            String status = (String) ar.get('Status__c');
            Integer count = (Integer) ar.get('totalCount');
            
            // Determine the month based on the status
            Integer month;
            String yearMonth;

            // Use completion date if status is 'Completed', otherwise use registered date
            if (status == 'Completed') {
                month = (Integer) ar.get('completionMonth');
                yearMonth = (Integer) ar.get('completionYear') + '-' + Integer.valueOf(month);
            } else if(status == 'Registered') {
                month = (Integer) ar.get('registeredMonth');
                yearMonth = (Integer) ar.get('registeredYear') + '-' + Integer.valueOf(month);
            }else{
                month = (Integer) ar.get('progressMonth');
                yearMonth = (Integer) ar.get('progressYear') + '-' + Integer.valueOf(month);
            }

            // Initialize the year-month map if not present
            if (!statusCountByMonth.containsKey(yearMonth)) {
                statusCountByMonth.put(yearMonth, new Map<String, Integer>());
            }

            // Update the status count for the specific year-month
            Map<String, Integer> statusMap = statusCountByMonth.get(yearMonth);
            if (!statusMap.containsKey(status)) {
                statusMap.put(status, 0);
            }
            statusMap.put(status, statusMap.get(status) + count);
        }

        // Return the result map
        System.debug('statusCountByMonth==>' + statusCountByMonth);
        return statusCountByMonth;
    }

    
    
}