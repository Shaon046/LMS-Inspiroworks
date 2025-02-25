/**
 * @description
 * @author       Shaon
 * @date         19-feb-2025
 * @version      1.0
 */
public without sharing class LMSAllCertificatesController {
    
    @AuraEnabled
    public static List<Map<String, Object>> getEnrolledCourseDetails() {
        
        String userId = UserInfo.getUserId();
        //String userId = '005fJ000001qnLqQAI';
        List<Map<String, Object>> responseList = new List<Map<String, Object>>();
        
        try {
            // Get completed courses
            List<LMS_Course_Enrolment__c> enrolledCourses = [SELECT Name, Status__c, Date_Of_Completion__c, Course_Title__c FROM LMS_Course_Enrolment__c WHERE User__c = :userId AND Status__c = 'Completed'];
            
            if(enrolledCourses.size() > 0){
                 // Set to hold course IDs
            Set<Id> courseIds = new Set<Id>();
            for (LMS_Course_Enrolment__c ec : enrolledCourses) {
                courseIds.add(ec.Course_Title__c);
            }
            
            //course names
            Map<Id, String> courseNamesMap = new Map<Id, String>();
            if (!courseIds.isEmpty()) {
                List<Course__c> courses = [SELECT Id, Title__c FROM Course__c WHERE Id IN :courseIds];
                
                for (Course__c course : courses) {
                    courseNamesMap.put(course.Id, course.Title__c);
                }
            }
            
            // content links for courses
            List<ContentDocumentLink> contentLinks = [SELECT ContentDocumentId, LinkedEntityId FROM ContentDocumentLink WHERE LinkedEntityId IN :courseIds ORDER BY SystemModstamp DESC];
            System.debug('contentLinks@@@@@@@@'+contentLinks);
            //content document IDs
            Set<Id> contentDocumentIds = new Set<Id>();
            for (ContentDocumentLink link : contentLinks) {
                contentDocumentIds.add(link.ContentDocumentId);
            }
            
            // content documents version
            Map<Id, String> documentToVersionMap = new Map<Id, String>();
            if (!contentDocumentIds.isEmpty()) {
                List<ContentDocument> contentDocs = [SELECT Id, LatestPublishedVersionId FROM ContentDocument WHERE Id IN :contentDocumentIds];
                
                System.debug('documentToVersionMap@@@@@'+documentToVersionMap);
                
                for (ContentDocument doc : contentDocs) {
                    documentToVersionMap.put(doc.Id, doc.LatestPublishedVersionId);
                }
            }
            
            for (LMS_Course_Enrolment__c course : enrolledCourses) {
                // course details
                Map<String, Object> courseDetails = new Map<String, Object>();
                
                // Add course details
                courseDetails.put('Status__c', course.Status__c);
                courseDetails.put('Date_Of_Completion__c', course.Date_Of_Completion__c);
                courseDetails.put('Course_Title__c', course.Course_Title__c);
                
                // course name
                String courseName = courseNamesMap.get(course.Course_Title__c);
                courseDetails.put('Course_Name__c', courseName);
                
                // Find ContentDocumentId associated with the course
                String documentVersion = null;
                for (ContentDocumentLink link : contentLinks) {
                    if (link.LinkedEntityId == course.Course_Title__c) {
                        // Get the latest version for the document
                        documentVersion = documentToVersionMap.get(link.ContentDocumentId);
                        break;
                    }
                }
                
                //  document version
                courseDetails.put('Document_Version__c', documentVersion != null ? documentVersion : null);
                
                responseList.add(courseDetails);
            }
            }
          
           
        } catch (Exception e) {
            throw new AuraHandledException('No enrollment details found.');
        }
        
        System.debug(responseList);
        return responseList;
    }
}