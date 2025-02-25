public without sharing class lmsMyCourseModulesController {
    @AuraEnabled
    public static List<WrapperGroup> fetchCourseModules(String getCourseId) { 
        // Identify user type: Admin or Learner
        Map<String, Boolean> userTypeMap = checkUserType();
        Boolean isAdmin = userTypeMap.get('isAdmin');
        Boolean isLearner = userTypeMap.get('isLearner');
        // Id currentUserId = UserInfo.getUserId();
        // Validate course
        Course__c getCourse = [
            SELECT Id 
            FROM Course__c 
            WHERE Id = :getCourseId
            LIMIT 1
        ];
        
        if (getCourse == null) {
            throw new AuraHandledException('Course not found.');
        }
        
        // Check if the user is enrolled in the course
        Id currentUserId = UserInfo.getUserId();
        Boolean isEnrolled = [
            SELECT COUNT() 
            FROM LMS_Course_Enrolment__c 
            WHERE User__c = :currentUserId 
            AND Course_Title__c = :getCourse.Id
        ] > 0;
        
        // Initialize wrapper group
        List<WrapperGroup> wrapperGroups = new List<WrapperGroup>();
        
        if (isAdmin || (isLearner && !isEnrolled)) {
            // Fetch LMS_Course_Module__c records for Admin users and non-enrolled Learners
            List<LMS_Course_Module__c> allModules = [
                SELECT Id, iSpring_HTML_File_Link__c, Quiz_Header__c,
                Name, Unit_Group__c, Unit_Description__c, Sequence_numbers__c 
                FROM LMS_Course_Module__c 
                WHERE LMS_Course__c = :getCourse.Id
                ORDER BY Unit_Group__c ASC
            ];
            
            wrapperGroups = groupModulesForAdmin(allModules, isEnrolled);
        } else if (isLearner && isEnrolled) {
            // Fetch LMS_Course_Participant_Module__c records for Learner users
            List<LMS_Course_Participant_Module__c> participantModules = [
                SELECT Id, LMS_Course_Module__r.LMS_Course__c, iSpring_HTML_File_Link__c, Quiz_Header__c,LMS_Course_Participant__c,
                Name, Unit_Group__c, Unit_Description__c, Course_Module_Name__c, Sequence_Number__c, Status_of_Course_Modules__c  
                FROM LMS_Course_Participant_Module__c 
                WHERE LMS_Course_Module__r.LMS_Course__c = :getCourse.Id AND LMS_Course_Participant__r.User__c = : currentUserId
                ORDER BY Unit_Group__c ASC
            ];
            
            wrapperGroups = groupModulesForLearner(participantModules, isEnrolled);
        }
        
        return wrapperGroups;
    }
    
    // Group modules for Admin users
    private static List<WrapperGroup> groupModulesForAdmin(List<LMS_Course_Module__c> allModules, Boolean isEnrolled) {
        Map<String, List<LMS_Course_Module__c>> groupedModules = new Map<String, List<LMS_Course_Module__c>>();
        
        for (LMS_Course_Module__c module : allModules) {
            String groupKey = module.Unit_Group__c != null ? module.Unit_Group__c : 'Ungrouped';
            if (!groupedModules.containsKey(groupKey)) {
                groupedModules.put(groupKey, new List<LMS_Course_Module__c>());
            }
            groupedModules.get(groupKey).add(module);
        }
        
        List<WrapperGroup> wrapperGroups = new List<WrapperGroup>();
        for (String groupId : groupedModules.keySet()) {
            WrapperGroup wrapper = new WrapperGroup();
            wrapper.unitGroupId = groupId;
            wrapper.adminModules = groupedModules.get(groupId); 
            wrapper.isEnrolled = isEnrolled;
            wrapperGroups.add(wrapper);
        }
        return wrapperGroups;
    }
    
    // Group modules for Learner users
    private static List<WrapperGroup> groupModulesForLearner(List<LMS_Course_Participant_Module__c> participantModules, Boolean isEnrolled) {
        Map<String, List<LMS_Course_Participant_Module__c>> groupedModules = new Map<String, List<LMS_Course_Participant_Module__c>>();
        
        for (LMS_Course_Participant_Module__c module : participantModules) {
            String groupKey = module.Unit_Group__c != null ? module.Unit_Group__c : 'Ungrouped';
            if (!groupedModules.containsKey(groupKey)) {
                groupedModules.put(groupKey, new List<LMS_Course_Participant_Module__c>());
            }
            groupedModules.get(groupKey).add(module);
        }
        
        List<WrapperGroup> wrapperGroups = new List<WrapperGroup>();
        for (String groupId : groupedModules.keySet()) {
            WrapperGroup wrapper = new WrapperGroup();
            wrapper.unitGroupId = groupId;
            wrapper.learnerModules = groupedModules.get(groupId);
            wrapper.isEnrolled = isEnrolled;
            wrapperGroups.add(wrapper);
        }
        return wrapperGroups;
    }
    
    // Check user type: Admin or Learner
    private static Map<String, Boolean> checkUserType() {
        Map<String, Boolean> resultMap = new Map<String, Boolean>();
        resultMap.put('isAdmin', false);
        resultMap.put('isLearner', false);
        
        Id currentUserId = UserInfo.getUserId();
        String adminPermissionSet = 'LMS_Community_Admin';
        String learnerPermissionSet = 'LMS_Community_Learner';
        
        String userType = [SELECT UserType FROM User WHERE Id = :currentUserId].UserType;
        Boolean isInternal = (userType == 'Standard');
        
        if (isInternal) {
            resultMap.put('isAdmin', true);
            return resultMap; 
        }
        
        List<PermissionSetAssignment> assignments = [
            SELECT PermissionSetId, PermissionSet.Name 
            FROM PermissionSetAssignment 
            WHERE AssigneeId = :currentUserId
        ];
        
        for (PermissionSetAssignment assignment : assignments) {
            if (assignment.PermissionSet.Name == adminPermissionSet) {
                resultMap.put('isAdmin', true);
                break;
            } else if (assignment.PermissionSet.Name == learnerPermissionSet) {
                resultMap.put('isLearner', true);
                break;
            }
        }
        
        return resultMap;
    }
    
    // Wrapper class
    public class WrapperGroup {
        @AuraEnabled public String unitGroupId;
        @AuraEnabled public List<LMS_Course_Module__c> adminModules;
        @AuraEnabled public List<LMS_Course_Participant_Module__c> learnerModules;
        @AuraEnabled public boolean isEnrolled;
    }
    
    /*@AuraEnabled
    public static List<LMS_Course_Module__c> getCourseQuizModules(String courseId) {
        try {
            // Check user type (if necessary for permission handling)
            Map<String, Boolean> userTypeMap = checkUserType();
            Boolean isAdmin = userTypeMap.get('isAdmin');
            Boolean isLearner = userTypeMap.get('isLearner');
            System.debug('courseId @@@@@@@');
            // Fetch Course Modules with Quiz Questions
           

            List<LMS_Course_Module__c> courseQuizData = [
                SELECT Id, Quiz_Header__c,
                Quiz_Question_1__c, Quiz_Question_2__c, Quiz_Question_3__c, Quiz_Question_4__c, Quiz_Question_5__c,
                Other_Optional_Answers_for_Quiz_1__c, Other_Optional_Answers_for_Quiz_2__c,
                Other_Optional_Answers_for_Quiz_3__c, Other_Optional_Answers_for_Quiz_4__c, Other_Optional_Answers_for_Quiz_5__c
                FROM LMS_Course_Module__c 
                WHERE Id IN (SELECT LMS_Course_Module__c  FROM LMS_Course_Participant_Module__c WHERE Id = :courseId)
                AND Quiz_Header__c != null LIMIT 1
            ];
            
            if (courseQuizData.isEmpty()) {
                throw new AuraHandledException('No quiz data found for the specified course.');
            }
            
            return courseQuizData;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching course quiz modules: ' + e.getMessage());
        }
    }*/
    

    @AuraEnabled
    public static String getCourseModule(String recordId){
        String courseModuleId = [SELECT LMS_Course_Module__c FROM LMS_Course_Participant_Module__c WHERE Id =: recordId].LMS_Course_Module__c;
        return courseModuleId;
    }


}