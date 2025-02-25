public without sharing class LMSQuizController {
    
    @AuraEnabled
    public static List<LMS_Course_Module__c> getCourseQuizModules(String courseId) {
        try {
            // Check user type (if necessary for permission handling)
            Map<String, Boolean> userTypeMap = checkUserType();
            Boolean isAdmin = userTypeMap.get('isAdmin');
            Boolean isLearner = userTypeMap.get('isLearner');
            
            // Retrieve dynamic quiz fields
            List<String> quizFields = new List<String>();
            
            // Describe LMS_Course_Module__c fields
            Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe()
                .get('LMS_Course_Module__c').getDescribe().fields.getMap();
            
            // Identify quiz fields dynamically
            for (String fieldName : fieldMap.keySet()) {
                if (fieldName.toLowerCase().startsWith('quiz_question_') ||
                    fieldName.toLowerCase().startsWith('other_optional_answers_for_quiz_') ||
                    fieldName.toLowerCase().startsWith('correct_answer_of_quiz_')) {
                        quizFields.add(fieldMap.get(fieldName).getDescribe().getName()); // Get exact case
                    }
            }
            
            System.debug('Dynamic Quiz Fields: ' + quizFields);
            
            // Base query fields
            String baseFields = 'Id, Quiz_Header__c';
            
            // Append dynamically retrieved quiz fields
            if (!quizFields.isEmpty()) {
                baseFields += ', ' + String.join(quizFields, ', ');
            }
            
            // Construct SOQL query
            String queryStr = 'SELECT ' + baseFields + ' FROM LMS_Course_Module__c WHERE Quiz_Header__c != null';
            
            if (isLearner) {
                queryStr += ' AND Id IN (SELECT LMS_Course_Module__c FROM LMS_Course_Participant_Module__c WHERE Id = :courseId) LIMIT 1';
            } else if (isAdmin) {
                queryStr += ' AND Id = :courseId WITH SECURITY_ENFORCED LIMIT 1';
            }
            
            List<LMS_Course_Module__c> courseQuizData = new List<LMS_Course_Module__c>();
            
            // List<String> fieldApiNames = new List<String>{'Id','Quiz_Header__c','ParentId'};
            // fieldApiNames.addAll(quizFields);            
            // if(FLSUtility.hasFieldAccess('LMS_Course_Module__c',fieldApiNames)){
            courseQuizData = Database.query(queryStr);
            //}
            
            
            if (courseQuizData.isEmpty()) {
                throw new AuraHandledException('No quiz data found for the specified course.');
            }
            
            return courseQuizData;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching course quiz modules: ' + e.getMessage());
        }
    }
    
    
    
    
    //  Check  I am checking the user admin or leaner user type: Admin or Learner
    private static Map<String, Boolean> checkUserType() {
        Map<String, Boolean> resultMap = new Map<String, Boolean>();
        resultMap.put('isAdmin', false);
        resultMap.put('isLearner', false);
        
        Id currentUserId = UserInfo.getUserId();
        String adminPermissionSet = 'LMS_Community_Admin';
        String learnerPermissionSet = 'LMS_Community_Learner';
        
        String userType;
        // List<String> userFields = new List<String>{'UserType'};
        // if(FLSUtility.hasFieldAccess('User', userFields)){
        userType = [SELECT UserType FROM User WHERE Id = :currentUserId].UserType;
        // }
        
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
    
    @AuraEnabled
    public static Map<String, Object> submitQuizAnswers(String participantModuleId, List<Map<String, String>> answers) {
        Map<String, Object> result = new Map<String, Object>();
        
        try {
            // Retrieve dynamic field names for quiz-related fields
            List<String> participantModuleFields = new List<String>();
            List<String> courseModuleFields = new List<String>();
            
            // Describe LMS_Course_Participant_Module__c fields
            Map<String, Schema.SObjectField> participantFieldMap = Schema.getGlobalDescribe()
                .get('LMS_Course_Participant_Module__c').getDescribe().fields.getMap();
            
            for (String fieldName : participantFieldMap.keySet()) {
                if (fieldName.toLowerCase().startsWith('participant_s_answer_of_quiz_question_')) {
                    participantModuleFields.add(participantFieldMap.get(fieldName).getDescribe().getName()); // Exact case
                }
            }
            
            // Describe LMS_Course_Module__c fields
            Map<String, Schema.SObjectField> courseFieldMap = Schema.getGlobalDescribe()
                .get('LMS_Course_Module__c').getDescribe().fields.getMap();
            
            for (String fieldName : courseFieldMap.keySet()) {
                if (fieldName.toLowerCase().startsWith('correct_answer_of_quiz_')) {
                    courseModuleFields.add(courseFieldMap.get(fieldName).getDescribe().getName()); // Exact case
                }
            }
            
            System.debug('Participant Module Fields: ' + participantModuleFields);
            System.debug('Course Module Fields: ' + courseModuleFields);
            
            // Base query fields for participant module
            String participantBaseFields = 'Id, Status_of_Course_Modules__c, Attempt_Number__c, Number_of_Quiz_Attempt__c, '
                + 'Designated_Passing_Grade__c, Passed_Counter__c, Quiz_Status__c, Passing_Grade__c, '
                + 'LMS_Course_Module__c, Total_Questions_on_Course_Module__c';
            
            if (!participantModuleFields.isEmpty()) {
                participantBaseFields += ', ' + String.join(participantModuleFields, ', ');
            }
            
            // Fetch participant module with dynamic fields
            String participantQuery = 'SELECT ' + participantBaseFields + ' FROM LMS_Course_Participant_Module__c WHERE Id = :participantModuleId WITH SECURITY_ENFORCED LIMIT 1';
            System.debug('Final Participant Query: ' + participantQuery);
            
            LMS_Course_Participant_Module__c participantModule = new LMS_Course_Participant_Module__c();
            // List<String> fieldApiNames = new List<String>();
            // fieldApiNames = participantBaseFields.split(',');
            
            // if(FLSUtility.hasFieldAccess('LMS_Course_Participant_Module__c',fieldApiNames)){
            participantModule = Database.query(participantQuery);
            // }
            
            if (participantModule == null) {
                result.put('error', 'Participant module record not found.');
                return result;
            }
            
            // Fetch related course module
            Id courseModuleId = participantModule.LMS_Course_Module__c;
            
            // Base query for course module
            String courseBaseFields = 'Id, Number_of_Quiz_Attempt__c';
            
            if (!courseModuleFields.isEmpty()) {
                courseBaseFields += ', ' + String.join(courseModuleFields, ', ');
            }
            
            String courseQuery = 'SELECT ' + courseBaseFields + ' FROM LMS_Course_Module__c WHERE Id = :courseModuleId WITH SECURITY_ENFORCED LIMIT 1';
            System.debug('Final Course Query: ' + courseQuery);
            
            LMS_Course_Module__c courseModule;
            // List<String> courseModuleFieldApiNames = new List<String>();
            // courseModuleFieldApiNames = courseBaseFields.split(',');
            
            // if(FLSUtility.hasFieldAccess('LMS_Course_Module__c',courseModuleFieldApiNames)){
            courseModule = Database.query(courseQuery);
            // }
            
            if (courseModule == null) {
                result.put('error', 'Related course module record not found.');
                return result;
            }
            
            // Process quiz answers
            Integer passedCounter = 0;
            Integer totalQuestions = answers.size();
            
            for (Integer i = 0; i < answers.size(); i++) {
                Map<String, String> answer = answers[i];
                String userAnswer = answer.get('selectedAnswer');
                
                // Use dynamically retrieved field names
                String correctAnswerField = 'Correct_Answer_of_Quiz_' + (i + 1) + '__c';
                String participantAnswerField = 'Participant_s_Answer_of_Quiz_Question_' + (i + 1) + '__c';
                
                if (courseFieldMap.containsKey(correctAnswerField) && participantFieldMap.containsKey(participantAnswerField)) {
                    String correctAnswer = (String) courseModule.get(correctAnswerField);
                    participantModule.put(participantAnswerField, userAnswer);
                    
                    if (userAnswer != null && userAnswer == correctAnswer) {
                        passedCounter++;
                    }
                } else {
                    result.put('error', 'Correct answer field not found for quiz question ' + (i + 1));
                    return result;
                }
            }
            
            // Increment attempts
            participantModule.Attempt_Number__c = (participantModule.Attempt_Number__c != null)
                ? participantModule.Attempt_Number__c + 1
                : 1;
            
            // Quiz Status Calculation
            if (participantModule.Attempt_Number__c > courseModule.Number_of_Quiz_Attempt__c) {
                participantModule.Quiz_Status__c = 'Failed Final';
            } else {
                Double passingGrade = (Double.valueOf(passedCounter) / totalQuestions) * 100;
                participantModule.Passed_Counter__c = passedCounter;
                participantModule.Passing_Grade__c = passingGrade;
                
                if (passingGrade >= participantModule.Designated_Passing_Grade__c) {
                    participantModule.Quiz_Status__c = 'Passed';
                } else if (participantModule.Attempt_Number__c >= courseModule.Number_of_Quiz_Attempt__c) {
                    participantModule.Quiz_Status__c = 'Failed Final';
                } else {
                    participantModule.Quiz_Status__c = 'Failed';
                }
            }
            
            participantModule.Status_of_Course_Modules__c = 'Completed';
            System.debug('Final Status before DML: ' + participantModule.Quiz_Status__c);
            List<String> coursePartModulefieldApiNames = new List<String>();
            // coursePartModulefieldApiNames.addAll(fieldApiNames);
            try { 
                
                //System.debug('Read Access--'+FLSUtility.hasFieldAccess('LMS_Course_Participant_Module__c',CoursePartModulefieldApiNames));
                //System.debug('Edit Access--'+FLSUtility.hasFieldUpdateAccess('LMS_Course_Participant_Module__c',CoursePartModulefieldApiNames));
                if(FLSUtility.hasFieldAccess('LMS_Course_Participant_Module__c',CoursePartModulefieldApiNames) && FLSUtility.hasFieldUpdateAccess('LMS_Course_Participant_Module__c',CoursePartModulefieldApiNames)){
                    update participantModule;
                }
                
                System.debug('DML executed successfully.');
            } catch (Exception e) {
                System.debug('DML failed: ' + e.getMessage());
                result.put('error', 'DML failed: ' + e.getMessage());
                return result;
            }
            
            // Return result
            result.put('quizStatus', participantModule.Quiz_Status__c);
            result.put('passingGrade', participantModule.Passing_Grade__c);
            result.put('attemptNumber', participantModule.Attempt_Number__c);
            result.put('totalQuestions', totalQuestions);
            result.put('correctAnswers', passedCounter);
            result.put('maxAttempts', courseModule.Number_of_Quiz_Attempt__c);
            result.put('designatedPassingGrade', participantModule.Designated_Passing_Grade__c);
        } catch (Exception e) {
            System.debug('Error in submitQuizAnswers: ' + e.getMessage());
            result.put('error', 'Unexpected error: ' + e.getMessage());
        }
        
        return result;
    }
    
    
    public class QuizModuleWrapper {
        @AuraEnabled public String quizStatus;
        @AuraEnabled public Decimal passingGrade;
        @AuraEnabled public Decimal attemptNumber;
        @AuraEnabled public String totalQuestions;
        @AuraEnabled public String correctAnswers;
        @AuraEnabled public Decimal maxAttempts;
        @AuraEnabled public Decimal designatedPassingGrade;
        @AuraEnabled public String StatusofCourseModules;
        @AuraEnabled public LMS_Course_Participant_Module__c getCoursePartipantModules;
        
        
    }
    
    @AuraEnabled
    public static List<QuizModuleWrapper> getCourseQuizModulesData(String courseParticipantId) {
        try {
            // Check user type
            Map<String, Boolean> userTypeMap = checkUserType();
            Boolean isAdmin = userTypeMap.get('isAdmin');
            Boolean isLearner = userTypeMap.get('isLearner');
            
            // Retrieve dynamic quiz answer fields
            List<String> participantModuleFields = new List<String>();
            
            // Describe LMS_Course_Participant_Module__c fields
            Map<String, Schema.SObjectField> participantFieldMap = Schema.getGlobalDescribe()
                .get('LMS_Course_Participant_Module__c').getDescribe().fields.getMap();
            
            // Identify quiz answer fields dynamically
            for (String fieldName : participantFieldMap.keySet()) {
                if (fieldName.toLowerCase().startsWith('participant_s_answer_of_quiz_question_')) {
                    participantModuleFields.add(participantFieldMap.get(fieldName).getDescribe().getName()); // Get exact case
                }
            }
            
            System.debug('Dynamic Quiz Fields: ' + participantModuleFields);
            
            // Base fields for the query
            String baseFields = 'Id, Status_of_Course_Modules__c, Attempt_Number__c, Number_of_Quiz_Attempt__c, '
                + 'Designated_Passing_Grade__c, Passed_Counter__c, Quiz_Status__c, Passing_Grade__c, '
                + 'Total_Questions_on_Course_Module__c';
            
            // Append dynamically retrieved quiz fields
            if (!participantModuleFields.isEmpty()) {
                baseFields += ', ' + String.join(participantModuleFields, ', ');
            }
            
            // Fetch participant module details
            String queryStr = 'SELECT ' + baseFields + ' FROM LMS_Course_Participant_Module__c WHERE Id = :courseParticipantId WITH SECURITY_ENFORCED';
            String queryString = String.escapeSingleQuotes(queryStr);
            List<LMS_Course_Participant_Module__c> participantModules;
            
            //List<String> qfields = new List<String>{'Id', 'Status_of_Course_Modules__c', 'Attempt_Number__c', 'Number_of_Quiz_Attempt__c','Designated_Passing_Grade__c', 'Passed_Counter__c', 'Quiz_Status__c', 'Passing_Grade__c',
            //'Total_Questions_on_Course_Module__c'};
            
            // if(FLSUtility.hasFieldAccess('LMS_Course_Participant_Module__c', qfields)){
            participantModules = Database.query(queryString);
            //}
            
            if (participantModules.isEmpty()) {
                throw new AuraHandledException('No quiz data found for the specified course.');
            }
            
            List<QuizModuleWrapper> wrapperList = new List<QuizModuleWrapper>();
            
            for (LMS_Course_Participant_Module__c participantModule : participantModules) {
                QuizModuleWrapper wrapper = new QuizModuleWrapper();
                wrapper.quizStatus = participantModule.Quiz_Status__c;
                wrapper.passingGrade = participantModule.Passing_Grade__c;
                wrapper.attemptNumber = participantModule.Attempt_Number__c;
                wrapper.maxAttempts = participantModule.Number_of_Quiz_Attempt__c;
                wrapper.designatedPassingGrade = participantModule.Designated_Passing_Grade__c;
                wrapper.StatusofCourseModules = participantModule.Status_of_Course_Modules__c;
                wrapper.totalQuestions = String.valueOf(participantModule.Total_Questions_on_Course_Module__c);
                wrapper.correctAnswers = String.valueOf(participantModule.Passed_Counter__c);
                
                wrapperList.add(wrapper);
            }
            
            return wrapperList;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching course quiz modules: ' + e.getMessage());
        }
    }
    
    
    @AuraEnabled
    public static List<LMS_Course_Participant_Module__c> getCourseQuizModulesAnswers(String courseId) {
        try {
            // Retrieve dynamic quiz answer fields
            List<String> quizAnswerFields = new List<String>();
            
            // Describe LMS_Course_Participant_Module__c fields
            Map<String, Schema.SObjectField> fieldMap = Schema.getGlobalDescribe()
                .get('LMS_Course_Participant_Module__c').getDescribe().fields.getMap();
            
            // Identify quiz answer fields dynamically
            for (String fieldName : fieldMap.keySet()) {
                if (fieldName.toLowerCase().startsWith('participant_s_answer_of_quiz_question_')) {
                    quizAnswerFields.add(fieldMap.get(fieldName).getDescribe().getName()); // Get exact case
                }
            }
            
            System.debug('Dynamic Quiz Fields: ' + quizAnswerFields);
            
            // Base query fields
            String baseFields = 'Id';
            
            // Append dynamically retrieved quiz fields
            if (!quizAnswerFields.isEmpty()) {
                baseFields += ', ' + String.join(quizAnswerFields, ', ');
            }
            
            // Construct dynamic SOQL query
            String queryStr = 'SELECT ' + baseFields + ' FROM LMS_Course_Participant_Module__c WHERE Id = :courseId WITH SECURITY_ENFORCED';
            List<LMS_Course_Participant_Module__c> participantModules = Database.query(queryStr);
            
            return participantModules;
        } catch (Exception e) {
            throw new AuraHandledException('Error fetching quiz module answers: ' + e.getMessage());
        }
    }
    
    
    
}