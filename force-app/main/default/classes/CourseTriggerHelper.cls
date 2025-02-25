public  without sharing class CourseTriggerHelper {
    
    public static void onBeforeInsert(List<Course__c> courseList){
        preventDuplicationOfCourse(courseList);
    }
    
    public static void onAfterInsert(List<Course__c> courseList , Map<Id,Course__c> oldCourseMap){
        createCourseWithCollaborationGroup(courseList,oldCourseMap);
    }
    
    public static void createCourseWithCollaborationGroup(List<Course__c> courseList , Map<Id,Course__c> oldCourseMap){
        List<CollaborationGroup> groupsToCreate = new List<CollaborationGroup>();
        Map<Id, CollaborationGroup> courseToGroupMap = new Map<Id, CollaborationGroup>();
        
        for (Course__c course : courseList) {
            CollaborationGroup cgroup = new CollaborationGroup(
                Name = course.Title__c,
                Description = 'Discussion group for the course: ' + course.Title__c,
                CollaborationType = 'Public'
            );
            groupsToCreate.add(cgroup);
            courseToGroupMap.put(course.Id, cgroup);
        }
        
        if (!groupsToCreate.isEmpty()) {
            insert groupsToCreate;
        }
    }
    
    public static void preventDuplicationOfCourse(List<Course__c> courseList){
        Set<String> setOfCourseTitles = new Set<String>();
        List<Course__c> existingCourseList  = new List<Course__c>();
        for(Course__c cr:courseList){
            if(cr.Title__c !=''){
                setOfCourseTitles.add(cr.Title__c);
            }
        }
        existingCourseList = [SELECT Id,Title__c FROM Course__c WHERE Title__c IN:setOfCourseTitles];
        
        if(!existingCourseList.isEmpty()){
            courseList[0].Title__c.addError('A course with the same title already exists. Please try with a different one.');
        }        
    }
}