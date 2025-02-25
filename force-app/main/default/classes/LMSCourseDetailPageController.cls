public Without Sharing class LMSCourseDetailPageController {
   public static string cartErrorMessage = 'This item is already in your cart. Please try adding a different one.'; 
    @AuraEnabled
    Public static  DataWrapper getAllCartItems(){
        DataWrapper dw = new DataWrapper();
        set<Id> setOfCourseIds = new Set<Id>();
        Map<Id,Id> courseFilesMap = new Map<Id,Id>();
        List<Cart_Item__c> cartItemsList = [SELECT Id, Name,cart_Id__c,Course_Id__c,Course_Id__r.Course_Type__c,Course_Id__r.Title__c FROM Cart_Item__c];
        if(!cartItemsList.isEmpty()){
        for(Cart_Item__c ci:cartItemsList){
            setOfCourseIds.add(ci.Course_Id__r.Id);
        }
        system.debug('setOfCourseIds13==>'+setOfCourseIds);
            if(!setOfCourseIds.isEmpty()){
         List<ContentDocumentLink> links = [
            SELECT ContentDocumentId, LinkedEntityId, ContentDocument.Title, ContentDocument.FileExtension, ContentDocument.LatestPublishedVersionId 
            FROM ContentDocumentLink 
            WHERE LinkedEntityId IN :setOfCourseIds
        ];
        
          System.debug('links@@@@ 30:-' + links);

        for (ContentDocumentLink link : links) {
            if (!courseFilesMap.containsKey(link.LinkedEntityId)) {
                courseFilesMap.put(link.LinkedEntityId, link.ContentDocument.LatestPublishedVersionId);
                system.debug('courseFilesMap25==>'+courseFilesMap);
            }
        }
        }
        } 

        dw.cartItemsList = cartItemsList;
        dw.courseFilesMap = courseFilesMap;
        dw.TotalCartItems = cartItemsList.size();
        return dw;
    }
    
    @AuraEnabled
    public static String createCart(string seletedCourseId){
        List<Cart__c> cartList = new List<Cart__c>();
        List<Cart_Item__c> cartItemList = new List<Cart_Item__c>();
        
        User u = [Select Id,Name FROM User WHERE Id = : userInfo.getuserId() LIMIT 1];
        system.debug('seletedCourseId10==>'+seletedCourseId);
         List<Cart_Item__c> cartItemsList = [SELECT Id, Name,cart_Id__c,Course_Id__c,Course_Id__r.Course_Type__c,Course_Id__r.Title__c 
                                            FROM Cart_Item__c WHERE Course_Id__r.Id = :seletedCourseId AND cart_Id__r.User_Id__c =:u.Id];
        
        if(!cartItemsList.isEmpty()){  return cartErrorMessage; }
        List<Cart__c> cartCheckList = [SELECT Id,User_Id__c FROM Cart__c WHERE User_Id__c =:u.Id LIMIT 1];
        
        if(cartCheckList.isEmpty()){
            
            Cart__c c = new Cart__c();
            c.Course_ID__c = seletedCourseId;
            c.Quantity__c = 3;
            c.User_Id__c = u.Id;
            cartList.add(c);
            insert cartList;
            
            Cart_Item__c ci = new Cart_Item__c();
            ci.Cart_Id__c = cartList[0].Id;
            ci.Course_Id__c = seletedCourseId;
            cartItemList.add(ci);
            
            if(!cartItemList.isEmpty()){
                
                insert cartItemList;
                return 'Success';
            }
        }else{
            Cart_Item__c ci = new Cart_Item__c();
            ci.Cart_Id__c = cartCheckList[0].Id;
            ci.Course_Id__c = seletedCourseId;
            cartItemList.add(ci);
            if( !cartItemList.isEmpty()){
                insert cartItemList;
                return 'Success';
            }
        }
        return 'Failed';
        
    }
    
    @AuraEnabled
    public static Boolean removeItemFromCart(List<string> cartItemId){
        system.debug('cartItemId54==>'+cartItemId);
        List<Cart_Item__c> cartItemList = new List<Cart_Item__c>();
        List<Cart_Item__c> ciList = [SELECT Id,Name,cart_Id__c,Course_Id__c,Course_Id__r.Course_Type__c,Course_Id__r.Title__c FROM Cart_Item__c WHERE Id IN:cartitemId];
        system.debug('ciList57==>'+ciList);
        
        if(!ciList.isEmpty()){
            delete ciList;
            return true;
        }
        return false;
    }
    public class DataWrapper{
        @AuraEnabled
        public List<Cart_Item__c> cartItemsList ;
        @AuraEnabled
        public  Map<Id,Id> courseFilesMap;
        @AuraEnabled
        public Integer TotalCartItems;
    }
}