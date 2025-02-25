/**
* @description  This class handles the view of course details and related course modules in course detail view page.
* @author       Shaon
* @date         13-Jan-2025
* @version      1.0
*/


public without sharing class LmsInternalCourseDetailViewController {
    /**
* @description  This method will return course details and related course module details.
* @param        String objectName, String customMetadataName, String recordId, Boolean Attachment
* @return       Map of object.
*/
    
    @AuraEnabled
    public static CourseDetailWrapper getCourseDetails(String recordId) {
        try{
            //Course__c record
            
            // here  added  one More condtion to check if course is refgistered then return true or false 
            
            Id currentUserId = UserInfo.getUserId();
            Boolean isEnrolled = [
                SELECT COUNT() 
                FROM LMS_Course_Enrolment__c 
                WHERE User__c = :currentUserId 
                AND Course_Title__c = :recordId
            ] > 0;
            
            Course__c course = [SELECT Name, Course_Type__c, Description__c, Credits_Points__c, Student_capacity__c, Title__c FROM Course__c WHERE Id = :recordId LIMIT 1];
            
            //related LMS_Course_Module__c
            List<LMS_Course_Module__c> courseModules = [SELECT Name, Unit_Description__c FROM LMS_Course_Module__c WHERE LMS_Course__c = :recordId];
            
            
            // added by prash here we fetching latestPublishedId 
            String latestPublishedId = null;
            List<ContentDocumentLink> contentLinks = [
                SELECT ContentDocumentId 
                FROM ContentDocumentLink 
                WHERE LinkedEntityId = :recordId 
                ORDER BY SystemModstamp DESC 
                LIMIT 1
            ];
            
            if (!contentLinks.isEmpty()) {
                List<ContentDocument> documents = [
                    SELECT LatestPublishedVersionId 
                    FROM ContentDocument 
                    WHERE Id = :contentLinks[0].ContentDocumentId
                    LIMIT 1
                ];
                if (!documents.isEmpty()) {
                    latestPublishedId = documents[0].LatestPublishedVersionId;
                }
            }
            
            CourseDetailWrapper wrapper = new CourseDetailWrapper();
            wrapper.courseName = course.Name;
            wrapper.courseType = course.Course_Type__c;
            wrapper.courseDescription = course.Description__c;
            wrapper.creditsPoints = course.Credits_Points__c;
            wrapper.courseTitle = course.Title__c;
            if(isEnrolled){
                wrapper.isEnrolled = true; 
            }else{
                wrapper.isEnrolled = false; 
            }
            wrapper.latestPublishedId = latestPublishedId;
            
            
            // LMS_Course_Module__c records
            List<Object> CourseModule = new List<Object>();
            for (LMS_Course_Module__c module : courseModules) {
                CourseModule.add(module);
            }
            
            wrapper.courseModule = CourseModule;
            
            System.debug(wrapper);
            return wrapper;
            
        }catch(Exception  error){
            throw new AuraHandledException('Error: '+error.getMessage());
        }
        
    }
    
    //need to change the logic as per new requirement
    //check user profile
    @AuraEnabled
    public static CourseDetailWrapper getUserProfile(){
        
        try{
            String profileId=userinfo.getProfileId();
            String proName=[Select Id,Name from Profile where Id=:profileId].Name;
            
            CourseDetailWrapper wrapper = new CourseDetailWrapper();
            
            if(proName == 'System Administrator'){
                wrapper.isAdmin = true;
            }
            
            
            System.debug(wrapper);
            return wrapper;
        }catch(Exception error){
            throw new AuraHandledException('Error: '+error.getMessage());
        }
        
    }
    
  //this method will handle attachments of courseModule
 @AuraEnabled
public static List<Map<String, String>> getCourseModuleResources(String moduleId) {
    List<Map<String, String>> fileDetailsList = new List<Map<String, String>>();

    if (String.isBlank(moduleId)) {
        return fileDetailsList;
    }

    // Fetch ContentDocumentLinks
    List<ContentDocumentLink> contentDocs = [SELECT ContentDocumentId, ContentDocument.Title FROM ContentDocumentLink WHERE LinkedEntityId = :moduleId
    ];

    if (!contentDocs.isEmpty()) {
        Set<Id> documentIds = new Set<Id>();
        for (ContentDocumentLink docLink : contentDocs) {
            documentIds.add(docLink.ContentDocumentId);
        }

        // Fetch latest ContentVersion 
        List<ContentVersion> contentVersions = [SELECT Id, ContentDocumentId, Title FROM ContentVersion WHERE ContentDocumentId IN :documentIds AND IsLatest = TRUE
        ];

        // Fetch or Create Public URLs
        for (ContentVersion cv : contentVersions) {
            Map<String, String> fileDetail = new Map<String, String>();
            fileDetail.put('fileName', cv.Title);
            
            // Fetch ContentDistribution
            List<ContentDistribution> distributions = [SELECT Id, ContentDownloadUrl FROM ContentDistribution WHERE ContentVersionId = :cv.Id LIMIT 1 ];
            
            if (!distributions.isEmpty()) {
                fileDetail.put('contentVersionUrl', distributions[0].ContentDownloadUrl);
            } else {
                // Create new ContentDistribution
                ContentDistribution newDist = new ContentDistribution(
                    Name = cv.Title,
                    ContentVersionId = cv.Id,
                    PreferencesAllowViewInBrowser = true,
                    PreferencesLinkLatestVersion = true
                );
                insert newDist;
                fileDetail.put('contentVersionUrl', newDist.ContentDownloadUrl);
            }
            
            fileDetailsList.add(fileDetail);
        }
    }

    System.debug('fileDetailsList: ' + fileDetailsList);
    return fileDetailsList;
}




    //Wrapper
    public class CourseDetailWrapper {
        @AuraEnabled public String courseName;
        @AuraEnabled public String courseType;
        @AuraEnabled public String courseDescription;
        @AuraEnabled public Decimal creditsPoints;
        @AuraEnabled public Integer studentCapacity;
        @AuraEnabled public String courseTitle;
        @AuraEnabled public boolean isAdmin;
        @AuraEnabled public List<Object> courseModule;
        @AuraEnabled public boolean isEnrolled;
        @AuraEnabled public  string latestPublishedId;
        
    }
    
    
    @AuraEnabled
    public static String getChatterId(String courseName){
        try{
 String chatterId = [SELECT Id FROM CollaborationGroup WHERE name =: courseName].Id;
        return chatterId;
        }catch(Exception e){
           throw new AuraHandledException(e.getMessage());
        }
       
    }
    


@AuraEnabled
public static Map<String, Object> getEnrolledCourseDetails(String courseId) {
    if (String.isEmpty(courseId)) {
        throw new AuraHandledException('Course ID cannot be empty.');
    }

    String userId = UserInfo.getUserId();

    Map<String, Object> responseMap = new Map<String, Object>();

    try {
    String orgName = Label.Org_Name;
    User currentUser = [SELECT FirstName, LastName FROM User WHERE Id = :userId LIMIT 1];
    LMS_Course_Enrolment__c enrolledCourse = [SELECT Name, Status__c, Date_Of_Completion__c FROM LMS_Course_Enrolment__c WHERE Course_Title__c = :courseId AND User__c = :userId LIMIT 1];

        responseMap.put('enrolledCourse', enrolledCourse);
        responseMap.put('FirstName', currentUser.FirstName);
        responseMap.put('LastName', currentUser.LastName);
         responseMap.put('orgName', orgName);


 String latestPublishedId = null;
            List<ContentDocumentLink> contentLinks = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :courseId ORDER BY SystemModstamp DESC LIMIT 1];
            
            if (!contentLinks.isEmpty()) {
                List<ContentDocument> documents = [SELECT LatestPublishedVersionId FROM ContentDocument WHERE Id = :contentLinks[0].ContentDocumentId LIMIT 1];
                if (!documents.isEmpty()) {
                    latestPublishedId = documents[0].LatestPublishedVersionId;
                }
            }
responseMap.put('courseImageDocumentId', latestPublishedId);


    } catch (Exception e) {
        throw new AuraHandledException('No enrollment details found.');
    }
    return responseMap;
}



}