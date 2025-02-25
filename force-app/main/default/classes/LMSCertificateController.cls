/**
 * @description  This class handles the functionality of the LMS Certificate VF page.
 * @author       Shaon Bhattacharjee
 * @date         19-02-2025
 * @version      1.0
 */

public without sharing class LMSCertificateController {
    public String courseId { get; private set; }
    public LMS_Course_Enrolment__c enrolledCourse { get; private set; }
    public String firstName { get; private set; }
    public String lastName { get; private set; }
    public String orgName { get; private set; }
    public String courseName { get; private set; }
    public String completionDate { get; private set; }
    
    
    
    public  LMSCertificateController() {
        try {
            courseId = ApexPages.currentPage().getParameters().get('courseRecordId');
            
            if (String.isBlank(courseId)) {
                throw new VisualforceException('Course ID cannot be empty.');
            }
            
            // Get user
            String userId = UserInfo.getUserId();
            User currentUser = [SELECT FirstName, LastName FROM User WHERE Id = :userId LIMIT 1];
            firstName = currentUser.FirstName;
            lastName = currentUser.LastName;
            orgName = Label.Org_Name;
            
            System.debug('courseId@@@@'+courseId);
            enrolledCourse = [ SELECT Name, Status__c, Date_Of_Completion__c FROM LMS_Course_Enrolment__c WHERE Course_Title__c = :courseId AND User__c = :userId LIMIT 1];
            
            completionDate = String.valueOf(enrolledCourse.Date_Of_Completion__c);
            System.debug('enrolledCourse@@@@@'+enrolledCourse);
            
            Course__c course = [SELECT Title__c FROM Course__c WHERE Id =:courseId ];
            courseName = course.Title__c;
        } catch (QueryException e) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'No course found'));
        } catch (Exception e) {
            ApexPages.addMessage(new ApexPages.Message(ApexPages.Severity.ERROR, 'error occurred: ' + e.getMessage()));
        }
    }
}