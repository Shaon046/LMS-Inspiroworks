public Without Sharing class LMSStaffCourseDataController {
    
   @AuraEnabled()
    public static StaffCourseReportWrapper getStaffCourseReportData() {
        // Wrapper to store headers and staff data
        StaffCourseReportWrapper reportWrapper = new StaffCourseReportWrapper();
        
        // Fetch table headers
        reportWrapper.headers = new List<String>();
        for (lmsCourseReport__mdt metadata : [SELECT Header_Name__c, order__c 
                                            FROM lmsCourseReport__mdt  
                                            WHERE Type__c = 'Staff'  
                                            ORDER BY order__c ASC]) {
            reportWrapper.headers.add(metadata.Header_Name__c);
        }

        // Fetch staff course data
        List<StaffCourseDataWrapper> staffDataList = new List<StaffCourseDataWrapper>();
        AggregateResult[] groupedData = [SELECT User__r.Name staffName, Status__c, COUNT(Id) totalCount
                                        FROM LMS_Course_Enrolment__c 
                                        WHERE User__c != NULL
                                        GROUP BY User__r.Name, Status__c];

        Map<String, StaffCourseDataWrapper> staffDataMap = new Map<String, StaffCourseDataWrapper>();

        for (AggregateResult record : groupedData) {
            String staffName = (String) record.get('staffName');
            String status = (String) record.get('Status__c');
            Integer count = (Integer) record.get('totalCount');

            if (!staffDataMap.containsKey(staffName)) {
                staffDataMap.put(staffName, new StaffCourseDataWrapper(staffName, 0, 0, 0));
            }

            StaffCourseDataWrapper wrapper = staffDataMap.get(staffName);
            if (status == 'Registered') {
                wrapper.enrolledCount += count;
            } else if (status == 'In Progress') {
                wrapper.inProgressCount += count;
            } else if (status == 'Completed') {
                wrapper.completedCount += count;
            }
        }

        reportWrapper.staffData = new List<StaffCourseDataWrapper>(staffDataMap.values());

        return reportWrapper;
    }

    // Wrapper to hold both headers and staff course data
    public class StaffCourseReportWrapper {
        @AuraEnabled public List<String> headers { get; set; }
        @AuraEnabled public List<StaffCourseDataWrapper> staffData { get; set; }

        public StaffCourseReportWrapper() {
            this.headers = new List<String>();
            this.staffData = new List<StaffCourseDataWrapper>();
        }
    }

    // Wrapper to hold individual staff course data
    public class StaffCourseDataWrapper {
        @AuraEnabled public String staffName { get; set; }
        @AuraEnabled public Integer enrolledCount { get; set; }
        @AuraEnabled public Integer inProgressCount { get; set; }
        @AuraEnabled public Integer completedCount { get; set; }

        public StaffCourseDataWrapper(String name, Integer enrolled, Integer inProgress, Integer completed) {
            this.staffName = name;
            this.enrolledCount = enrolled;
            this.inProgressCount = inProgress;
            this.completedCount = completed;
        }
    }

    
}