public without sharing class LMSCoursesTabController {
    @AuraEnabled
    public static List<CourseWrapper> fetchAvailableCoursesWithFiles() {
        User currentUser = [SELECT Id,Name,AccountId,ContactId FROM User WHERE Id = :userInfo.getUserId() LIMIT 1];
        List<Course__c> displayCourses = new List<Course__c>();
        // Fetch the Course__c records
        List<Course__c> courses = [
            SELECT Id, Name, Course_Type__c, Title__c, Credits_Points__c,Course_Duration__c 
            FROM Course__c  ORDER BY CreatedDate ASC
        ];
        System.debug('courses@@@@ 21:-' + courses);


        Set<Id> courseIds = new Set<Id>();

        Map<String, Boolean> userProfile = getUserProfileType();
        if(userProfile != null && userProfile.get('isLearner') == true){

            List<AggregateResult> coursesHaveModule = [SELECT LMS_Course__c FROM LMS_Course_Module__c WHERE LMS_Course__c IN :courses GROUP BY LMS_Course__c] ;
            for (AggregateResult coursesModule : coursesHaveModule) {
                courseIds.add((Id)coursesModule.get('LMS_Course__c'));
            }
            displayCourses =  [
                SELECT Id, Name, Course_Type__c, Title__c, Credits_Points__c,Course_Duration__c 
                FROM Course__c ORDER WHERE Id IN :courseIds AND Status__c ='Active' ORDER BY CreatedDate ASC
            ];
        }else{
            for (Course__c course : courses) {
                courseIds.add(course.Id);
            }
             displayCourses = courses;
        }

        // Fetch LMS Configuration record
        LMS_Configuration__c lmsConfiguration = [
            SELECT Id, SubTabs__c, SubTabs_Color__c, Header_Display_Stylling__c 
            FROM LMS_Configuration__c 
            LIMIT 1
        ];

        // Fetch related files for the courses
        Map<Id, List<ContentDocument>> courseFilesMap = new Map<Id, List<ContentDocument>>();
        List<ContentDocumentLink> courseLinks = [
            SELECT ContentDocumentId, LinkedEntityId, ContentDocument.Title, ContentDocument.FileExtension, ContentDocument.LatestPublishedVersionId 
            FROM ContentDocumentLink 
            WHERE LinkedEntityId IN :courseIds
        ];

        for (ContentDocumentLink link : courseLinks) {
            if (!courseFilesMap.containsKey(link.LinkedEntityId)) {
                courseFilesMap.put(link.LinkedEntityId, new List<ContentDocument>());
            }
            courseFilesMap.get(link.LinkedEntityId).add(link.ContentDocument);
        }

        // Fetch related files for LMS_Configuration__c
        List<ContentDocument> lmsConfigFiles = new List<ContentDocument>();
        List<ContentDocumentLink> lmsConfigLinks = [
            SELECT ContentDocumentId, LinkedEntityId, ContentDocument.Title, ContentDocument.FileExtension, ContentDocument.LatestPublishedVersionId 
            FROM ContentDocumentLink 
            WHERE LinkedEntityId = :lmsConfiguration.Id
        ];

        for (ContentDocumentLink link : lmsConfigLinks) {
            lmsConfigFiles.add(link.ContentDocument);
        }


        //user enrolled course details
        Map<Id, Integer> enrolledCourseCreditsMap = new Map<Id, Integer>();
        List<LMS_Course_Enrolment__c> userEnrolledCourse = [SELECT Course_Title__c, Credits__c  FROM LMS_Course_Enrolment__c WHERE User__c = :currentUser.Id ];
        for (LMS_Course_Enrolment__c courseEnrolled : userEnrolledCourse) {
            enrolledCourseCreditsMap.put(
                courseEnrolled.Course_Title__c, 
                (courseEnrolled.Credits__c  != null) ? courseEnrolled.Credits__c .intValue() : 0
            );
        }

        //get the course status from the course perticipant modules
  		Map<Id, String> getCourseModuleStatusMap = getCourseModuleStatus() ;


        //get the number of course module
        List<AggregateResult> courseModuleCount = [SELECT LMS_Course__c, COUNT(Id) FROM LMS_Course_Module__c GROUP BY LMS_Course__c ];
        Map<Id, Integer> courseModuleCountMap = new Map<Id, Integer>();
        for (AggregateResult cModule : courseModuleCount) {
            Id courseId = (Id) cModule.get('LMS_Course__c');
            Integer moduleCount = (Integer) cModule.get('expr0');  
            courseModuleCountMap.put(courseId, moduleCount);
        }



        // Create CourseWrappers
        List<CourseWrapper> courseWrappers = new List<CourseWrapper>();
        for (Course__c course : displayCourses) {
            courseWrappers.add(new CourseWrapper(
                course, 
                courseFilesMap.containsKey(course.Id) ? courseFilesMap.get(course.Id) : new List<ContentDocument>(),
                lmsConfiguration,
                lmsConfigFiles,
                enrolledCourseCreditsMap.containsKey(course.Id) ? true : false,
                getCourseModuleStatusMap.containsKey(course.Id) ? getCourseModuleStatusMap.get(course.Id) : '',
                courseModuleCountMap.containsKey(course.Id) ? courseModuleCountMap.get(course.Id) : 0,
                enrolledCourseCreditsMap.containsKey(course.Id) ? enrolledCourseCreditsMap.get(course.Id) : 0
            ));
        }

        return courseWrappers;
    }

    @AuraEnabled
    public static Map<Id, String> getCourseModuleStatus() {
        Map<Id, String> courseStatusMap = new Map<Id, String>();
        List<LMS_Course_Participant__c> participations = new  List<LMS_Course_Participant__c>();
        // Get the current logged-in user's ID
        User currentUser = [SELECT Id,Name,AccountId,ContactId,IsPortalEnabled FROM User WHERE Id = :userInfo.getUserId() LIMIT 1];

        // Query Course Participation records for the logged-in user
        // if(!currentUser.IsPortalEnabled){
        // }
            participations = [SELECT ID, Course__c FROM LMS_Course_Participant__c WHERE User__c =:currentUser.Id];
        

        if (participations.isEmpty()) {
            return courseStatusMap; 
        }

        // Extract the participation IDs and related course IDs
        Set<Id> participationIds = new Set<Id>();
        Map<Id, Id> participationToCourseMap = new Map<Id, Id>();

        for (LMS_Course_Participant__c participation : participations) {
            participationIds.add(participation.Id);
            participationToCourseMap.put(participation.Id, participation.Course__c);
        }

        List<LMS_Course_Participant_Module__c> startedModules = [SELECT Id,LMS_Course_Participant__c, Status_of_Course_Modules__c FROM LMS_Course_Participant_Module__c WHERE LMS_Course_Participant__c IN :participationIds];

        // Mark courses with started modules
        Set<Id> coursesWithStartedModules = new Set<Id>();
        for (LMS_Course_Participant_Module__c module : startedModules) {
            Id courseParticipationId = module.LMS_Course_Participant__c;
            if (participationToCourseMap.containsKey(courseParticipationId)) {
                Id courseId = participationToCourseMap.get(courseParticipationId);
                
                // Initialize the course status if not already set
                if (!courseStatusMap.containsKey(courseId)) {
                    courseStatusMap.put(courseId, module.Status_of_Course_Modules__c); 
                }
        
                
                String currentStatus = courseStatusMap.get(courseId);
        
                if (module.Status_of_Course_Modules__c == 'In Progress') {
                    courseStatusMap.put(courseId, 'In Progress'); // Any "In Progress" module makes the course "In Progress"
                } else if (module.Status_of_Course_Modules__c == 'Completed') {
                    if (currentStatus != 'In Progress' && currentStatus != 'Not Started') {
                        courseStatusMap.put(courseId, 'Completed');
                    }else{
						courseStatusMap.put(courseId, 'In Progress');
                    }
                } else if (module.Status_of_Course_Modules__c == 'Not Started') {
                    if (currentStatus == 'Not Started') {
                        courseStatusMap.put(courseId, 'Not Started');
                    }else{
                        courseStatusMap.put(courseId, 'In Progress');
                    }
                }
            }
        }


        return courseStatusMap;
    }

    
   
    @AuraEnabled
    public static Map<String, Boolean> getUserProfileType() {
        Map<String, Boolean> resultMap = new Map<String, Boolean>();
       	resultMap.put('isAdmin', false);
        resultMap.put('isLearner', false);
        
        Id currentUserId = UserInfo.getUserId();

        String adminPermissionSet = 'LMS_Community_Admin';
        String learnerPermissionSet= 'LMS_Community_Learner';
		
        String userType = [SELECT UserType FROM User WHERE Id = :currentUserId].UserType;
        Boolean isInternal = (userType == 'Standard');
	
        if (isInternal) {
            resultMap.put('isAdmin', true);
            return resultMap; 
        }

        List<PermissionSetAssignment> assignments = [SELECT PermissionSetId, PermissionSet.Name FROM PermissionSetAssignment WHERE AssigneeId = :currentUserId];
        
        for (PermissionSetAssignment assignment : assignments) {
            if (assignment.PermissionSet.Name == adminPermissionSet) {
                resultMap.put('isAdmin', true);
                break;
            }else if (assignment.PermissionSet.Name == learnerPermissionSet){
				resultMap.put('isLearner', true);
                break;
            }
        }

        return resultMap;
    }



    
    
    public class CourseWrapper {
        @AuraEnabled
        public Course__c course;
        @AuraEnabled
        public LMS_Configuration__c lmsConfiguration;
        @AuraEnabled
        public List<ContentDocument> files;
        @AuraEnabled
        public List<ContentDocument> lmsConfigFiles;
        @AuraEnabled
        public Boolean isEnroll;
        @AuraEnabled
        public String courseModuleStatus;
        @AuraEnabled
        public Integer courseModuleCount;
        @AuraEnabled
        public Integer enrolledCourseCredit;
        

        public CourseWrapper(Course__c course, List<ContentDocument> courseFiles, LMS_Configuration__c lmsConfiguration, List<ContentDocument> lmsConfigFiles, Boolean isEnroll, String courseModuleStatus, Integer courseModuleCount, Integer enrolledCourseCredit) {
            this.course = course;
            this.files = courseFiles;
            this.lmsConfiguration = lmsConfiguration;
            this.lmsConfigFiles = lmsConfigFiles;
            this.isEnroll = isEnroll;
            this.courseModuleStatus= courseModuleStatus;
            this.courseModuleCount = courseModuleCount;
            this.enrolledCourseCredit = enrolledCourseCredit;
        }
    }
}