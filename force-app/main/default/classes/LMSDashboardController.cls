/**
* @File Name : LMSDashboardController.cls
* @Description : For the internal user dashbord 
* @Author :Anirban Pal
* @Last Modified By :
* @Last Modified On : January 2, 2025
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | January 2, 2025 |   | Initial Version
**/

public without sharing class LMSDashboardController {
	
    @AuraEnabled
    public static String getUserDetails() {
      
        Id currentUserId = UserInfo.getUserId();
        User currentUser = [SELECT Id, Name, UserType, ContactId FROM User WHERE Id = :currentUserId];

        if (currentUser.UserType == 'Standard') {
            return currentUser.Name;
        } else if (currentUser.ContactId != null) {
            List<Contact> contactList = [SELECT Id, Name FROM Contact WHERE Id = :currentUser.ContactId];
            if (!contactList.isEmpty()) {
                return String.isNotEmpty(contactList[0].Name) ? contactList[0].Name : currentUser.Name;
            }
        }
   
        return currentUser.Name;

    }

    @AuraEnabled
    public static List<LMS_Course_Enrolment__c> getMyCourses() {
        Id currentUserId = UserInfo.getUserId();
        User currentUser = [SELECT Id, Name, UserType, ContactId FROM User WHERE Id = :currentUserId];
        if(currentUser != null){
            Contact con = [SELECT Id, Name FROM Contact WHERE Id =:currentUser.ContactId];
            List<LMS_Course_Enrolment__c> courseList = [SELECT Id, Course_Title__r.Title__c, Course_Title__r.Description__c, Status__c FROM LMS_Course_Enrolment__c WHERE Participant__c =:con.Id];

            if(!courseList.isEmpty()){
                return courseList;
            }
        }
        return null;
    }

    @AuraEnabled
    public static Map<String,List<Integer>> getReportData(){
        Id currentUserId = UserInfo.getUserId();
        User currentUser = [SELECT Id, Name, UserType, ContactId FROM User WHERE Id = :currentUserId];
        if(currentUser != null){
            Contact con = [SELECT Id, Name FROM Contact WHERE Id =:currentUser.ContactId];
            // Get the current date
            Date today = Date.today();
            
            // Calculate the start date for the current month
            Date startOfCurrentMonth = today.toStartOfMonth();
            
            // Calculate the start date for the past two months
            Date startOfTwoMonthsAgo = startOfCurrentMonth.addMonths(-2);
            
            // Query the Course Enrollment records for the current month and the past two months
            List<LMS_Course_Enrolment__c> enrollments = [
                SELECT Id, Date_Registered__c, Status__c, Course_Started_On__c, Date_Of_Completion__c
                FROM LMS_Course_Enrolment__c
                WHERE 
                (
                    (Date_Registered__c >= :startOfTwoMonthsAgo AND Date_Registered__c <= :today) OR
                    (Course_Started_On__c >= :startOfTwoMonthsAgo AND Course_Started_On__c <= :today) OR
                    (Date_Of_Completion__c >= :startOfTwoMonthsAgo AND Date_Of_Completion__c <= :today)
                )
                AND Participant__c = :con.Id
                ORDER BY Date_Registered__c
            ];

             // Initialize a map to store the results
            Map<String, List<Integer>> resultMap = new Map<String, List<Integer>>();
            
            // Initialize counters for each status
            Integer registeredCount = 0;
            Integer inProgressCount = 0;
            Integer completedCount = 0;

            // Iterate through the enrollments and group them by month and status
            for (LMS_Course_Enrolment__c enrollment : enrollments) {
                // Get the month of the Date Registered field
                String monthKey = enrollment.Date_Registered__c.month() + '-' + enrollment.Date_Registered__c.year();
                
                // Initialize the list for the month if it doesn't exist
                if (!resultMap.containsKey(monthKey)) {
                    resultMap.put(monthKey, new List<Integer>{0, 0, 0});
                }
                
                // Update the counters based on the status
                if (enrollment.Status__c == 'Registered') {
                    resultMap.get(monthKey)[0]++;
                } else if (enrollment.Status__c == 'In Progress') {
                    resultMap.get(monthKey)[1]++;
                } else if (enrollment.Status__c == 'Completed') {
                    resultMap.get(monthKey)[2]++;
                }
            }

            // Format the result map with month names
            Map<String, List<Integer>> formattedResultMap = new Map<String, List<Integer>>();
            for (String key : resultMap.keySet()) {
                List<String> monthYear = key.split('-');
                Integer month = Integer.valueOf(monthYear[0]);
                Integer year = Integer.valueOf(monthYear[1]);
                
                // Get the month name
                String monthName = DateTime.newInstance(year, month, 1).format('MMMM');
                
                // Add the month name and the corresponding counts to the formatted map
                formattedResultMap.put(monthName, resultMap.get(key));
            }
            
            return formattedResultMap;
        }

        return null;
    }

//Added by Prashant 
@AuraEnabled
public static String getUserDetailsWithThereRole() {
    Id currentUserId = UserInfo.getUserId();
    User currentUser = [SELECT Id, Name, UserType, ContactId FROM User WHERE Id = :currentUserId];

    List<PermissionSetAssignment> assignedPermissions = [
        SELECT PermissionSet.Name 
        FROM PermissionSetAssignment 
        WHERE AssigneeId = :currentUserId
    ];

    Boolean isAdmin = false;
    Boolean isLearner = false;

    for (PermissionSetAssignment psa : assignedPermissions) {
        if (psa.PermissionSet.Name == 'LMS_Community_Admin') {
            isAdmin = true;
        }
        if (psa.PermissionSet.Name == 'LMS_Community_Learner') {
            isLearner = true;
        }
    }

    // Return user details based on permission set
    if (isAdmin) {
        return currentUser.Name + ' - Admin';
    } else if (isLearner) {
        return currentUser.Name + ' - Learner';
    }

    return currentUser.Name;
}



}