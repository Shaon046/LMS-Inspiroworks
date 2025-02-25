trigger CourseTrigger on Course__c (before insert ,before update, after insert, after update) {
    
    if(Trigger.isBefore){
        if(Trigger.isInsert){
            CourseTriggerHelper.onBeforeInsert(Trigger.new);
        }
    }
    
    if(Trigger.isAfter){
        
        if(Trigger.isInsert){
            CourseTriggerHelper.onAfterInsert(Trigger.new , Trigger.oldMap);
        }
        
        if(Trigger.isUpdate){
        }
    }
}