public class LMSCourseEnrolmentHelper {

    public static void onBeforeInsert(List<LMS_Course_Enrolment__c> courseEnrolmentList){
        
    }
    
      public static void onBeforeUpdate(List<LMS_Course_Enrolment__c> courseEnrolmentList,Map<Id,LMS_Course_Enrolment__c> oldMap){
          Set<Id> setOfParticipantIds = new Set<Id>();
          for(LMS_Course_Enrolment__c ce:courseEnrolmentList){
              if(ce.Status__c != oldMap.get(ce.Id).Status__c && ce.Status__c =='In Progress'){
                 ce.Date_Registered__c = System.today();
              }
              else if(ce.Status__c != oldMap.get(ce.Id).Status__c && ce.Status__c =='Completed'){
                  ce.Date_Of_Completion__c = System.today();
              }
          }
    }
}