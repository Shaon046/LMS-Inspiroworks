public class ContentDocumentLinkHelper {

    public static void onBeforeInsert(List<ContentDocumentLink> contentDocumentList){
        setVisibilityForAllUesrs(contentDocumentList);
    }
    
    public static void setVisibilityForAllUesrs(List<ContentDocumentLink> newContentDocumentLinkList){
         Set<Id> linkedRecordIds = new Set<Id>();
        
        for(ContentDocumentLink link : newContentDocumentLinkList) {
            linkedRecordIds.add(link.LinkedEntityId);
        }
        
        Map<Id, Course__c> courseRecordsMap = new Map<Id, Course__c>( [SELECT Id FROM Course__c WHERE Id IN :linkedRecordIds] );
                   
        for(ContentDocumentLink link : newContentDocumentLinkList) {
System.debug(String.valueOf(link.LinkedEntityId).startsWith('a01')+'  rohit bhai' );
            if(courseRecordsMap.containsKey(link.LinkedEntityId) || String.valueOf(link.LinkedEntityId).startsWith('a01')) {
                link.Visibility = 'AllUsers';
                 link.ShareType = 'V';
            }
        }
    }
}