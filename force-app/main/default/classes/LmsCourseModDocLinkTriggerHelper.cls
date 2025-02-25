/**
 * @description  This class is a helper class of the LMS Course Module Document Link Trigger.
 * @author      Shaon Bhattacharjee
 * @date         14-feb-2025
 * @version      1.0
 */

public with sharing class LmsCourseModDocLinkTriggerHelper {
    /** @description  This method will update Visibility of Course Module Document to allUsers .
     */
    public static void handleBeforeInsert(List<ContentDocumentLink> newList) {
        // flag
        Trigger_Flag__mdt flag = Trigger_Flag__mdt.getInstance('CourseModuleDocumentLinkTrigger');
        
        
        if (flag == null || !flag.IsActive__c) {
            return;
        }
        
        for (ContentDocumentLink link : newList) {
            if (link.LinkedEntityId != null && String.valueOf(link.LinkedEntityId).startsWith('a05')) {
                link.Visibility = 'AllUsers';
            }
        }
    }
}