public without sharing class lmsCoursesTabController {
    @AuraEnabled(cacheable=true)
    public static List<CourseWrapper> fetchAvailableCoursesWithFiles() {
        // Fetch the Course__c records
        List<Course__c> courses = [
            SELECT Id, Name, Course_Type__c, Title__c, Credits_Points__c 
            FROM Course__c
        ];
        System.debug('courses@@@@ 21:-' + courses);

        // Extract the course IDs for the ContentDocumentLink query
        Set<Id> courseIds = new Set<Id>();
        for (Course__c course : courses) {
            courseIds.add(course.Id);
        }

        // Fetch related files for the courses
        Map<Id, List<ContentDocument>> courseFilesMap = new Map<Id, List<ContentDocument>>();
        List<ContentDocumentLink> links = [
            SELECT ContentDocumentId, LinkedEntityId, ContentDocument.Title, ContentDocument.FileExtension, ContentDocument.LatestPublishedVersionId 
            FROM ContentDocumentLink 
            WHERE LinkedEntityId IN :courseIds
        ];

        System.debug('links@@@@ 30:-' + links);

        for (ContentDocumentLink link : links) {
            if (!courseFilesMap.containsKey(link.LinkedEntityId)) {
                courseFilesMap.put(link.LinkedEntityId, new List<ContentDocument>());
            }
            courseFilesMap.get(link.LinkedEntityId).add(link.ContentDocument);
        }
        List<CourseWrapper> courseWrappers = new List<CourseWrapper>();
        for (Course__c course : courses) {
            courseWrappers.add(new CourseWrapper(
                course, 
                courseFilesMap.containsKey(course.Id) ? courseFilesMap.get(course.Id) : new List<ContentDocument>()
            ));
        }

        return courseWrappers;
    }

    public class CourseWrapper {
        @AuraEnabled
        public Course__c course;
        @AuraEnabled
        public List<ContentDocument> files;

        public CourseWrapper(Course__c course, List<ContentDocument> files) {
            this.course = course;
            this.files = files;
        }
    }
}