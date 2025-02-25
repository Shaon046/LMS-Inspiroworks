trigger ContentDocumentLinkTrigger on ContentDocumentLink (before insert) {
    if(Trigger.IsBefore){
        if(Trigger.isInsert){
            ContentDocumentLinkHelper.onBeforeInsert(Trigger.new);
        }
    }
    //update the document link of course module
    if(Trigger.IsBefore && Trigger.isInsert){
        LMSCourseModDocLinkTriggerHelper.handleBeforeInsert(Trigger.new);
    }   
}