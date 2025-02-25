/**
* @File Name : LMSExternaluserProfileController.cls
* @Description :
* @Author :
* @Last Modified By :
* @Last Modified On : January 21, 2025
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | January 21, 2025 |   | Initial Version
**/

public without sharing class LMSExternaluserProfileController {
	
  
   	@AuraEnabled
    public static UserWrapper userDetails() {
        UserWrapper wrappedUserDetails = new UserWrapper();
        User currentUser = [SELECT Id,Username, ContactId, Contact.FirstName, Contact.LastName, Contact.Email, Contact.MobilePhone, FullPhotoUrl
                            FROM User 
                            WHERE Id = :UserInfo.getUserId() AND IsActive = true LIMIT 1];

        if(currentUser.ContactId != null){
            List<ContentDocumentLink> contentDocs = [SELECT Id, ContentDocument.Id FROM ContentDocumentLink WHERE LinkedEntityId  =: currentUser.ContactId ORDER BY ContentDocument.CreatedDate DESC];
            if(contentDocs != null && contentDocs.size() > 0){
                List<ContentVersion> cntversion = [SELECT Id FROM ContentVersion WHERE ContentDocumentId = :contentDocs[0].ContentDocument.Id];
                if(cntversion != null && cntversion.size() > 0){
                    wrappedUserDetails.contentVersion = true;
                    wrappedUserDetails.profilePictureUrl = cntversion[0].Id;
                }else{
                    wrappedUserDetails.profilePictureUrl = String.isNotBlank(currentUser.FullPhotoUrl) ? currentUser.FullPhotoUrl : '';
                }
            }
        }
        
        wrappedUserDetails.userId = currentUser.Id; 
        wrappedUserDetails.firstName = String.isNotBlank(currentUser.Contact.FirstName) ? currentUser.Contact.FirstName : ''; 
        wrappedUserDetails.lastName = String.isNotBlank(currentUser.Contact.LastName) ? currentUser.Contact.LastName : ''; 
        wrappedUserDetails.email = String.isNotBlank(currentUser.Contact.Email) ? currentUser.Contact.Email : '';
        wrappedUserDetails.mobilePhone = String.isNotBlank(currentUser.Contact.MobilePhone) ? currentUser.Contact.MobilePhone : ''; 
        wrappedUserDetails.userName = String.isNotBlank(currentUser.Username) ? currentUser.Username : '';
        wrappedUserDetails.contactId = currentUser.ContactId != null ? currentUser.ContactId : '';
        wrappedUserDetails.profilePictureUrl = wrappedUserDetails.contentVersion ? wrappedUserDetails.profilePictureUrl : String.isNotBlank(currentUser.FullPhotoUrl) ? currentUser.FullPhotoUrl : '';
        
        return wrappedUserDetails;
    }
    

    @AuraEnabled
    public static String updateUserDetails(String userData) {
        // Parse the incoming JSON data
        Map<String, Object> userMap = (Map<String, Object>) JSON.deserializeUntyped(userData);
        
        String userId = (String) userMap.get('userId');
        String contactId = (String) userMap.get('contactId');
      
        try {
            
            if(!String.isBlank(userId)){
                User existingUser = [SELECT Id, Email, FirstName, LastName, MobilePhone FROM User WHERE Id = :userId];

                existingUser.Email = (String) userMap.get('email');
                existingUser.FirstName = (String) userMap.get('firstName');
                existingUser.LastName = (String) userMap.get('lastName');
                existingUser.MobilePhone = (String) userMap.get('mobilePhone');
                update existingUser;
                
            }
            if(!String.isBlank(contactId)){
                Contact existinContact = [SELECT Id, FirstName, LastName, Email, MobilePhone FROM contact WHERE Id =:contactId];

                existinContact.Email = (String) userMap.get('email');
                existinContact.FirstName = (String) userMap.get('firstName');
                existinContact.LastName = (String) userMap.get('lastName');
                existinContact.MobilePhone = (String) userMap.get('mobilePhone');
                update existinContact;

            }
           
            return 'successfully';
        } catch (Exception e) {
            System.debug('Error: ' + e.getMessage());
            return 'An error occurred while updating user details: ' + e.getMessage();
        }
    }


    @AuraEnabled
    public static Map<String, Object> changeExternalUserPassword(String userId, String newPassword) {
        Map<String, Object> response = new Map<String, Object>();
        try {
            if (!String.isBlank(userId) && !String.isBlank(newPassword)) {
                User externalUser = [SELECT Id, IsActive FROM User WHERE Id = :userId LIMIT 1];
                if (externalUser != null && externalUser.IsActive) {
                    System.setPassword(userId, newPassword);
                    response.put('success', true);
                    response.put('message', 'Password changed successfully.');
                } else {
                    response.put('success', false);
                    response.put('message', 'User not found or inactive.');
                }
            } else {
                response.put('success', false);
                response.put('message', 'Please provide accurate data.');
            }
        } catch (Exception e) {
            response.put('success', false);
            response.put('message', 'Error changing password: ' + e.getMessage());
        }
        return response;
    }

  


    public class UserWrapper {
        @AuraEnabled
        public String userId;
        @AuraEnabled
        public String contactId;
        @AuraEnabled
        public String firstName;
        @AuraEnabled
        public String lastName;
        @AuraEnabled
        public String email;
        @AuraEnabled
        public String mobilePhone;
        @AuraEnabled
        public String userName;
        @AuraEnabled
        public Boolean contentVersion = false;
        @AuraEnabled
        public String profilePictureUrl;
    }
    
    
   	@AuraEnabled
    public static String uploadFile(String base64, String filename, String recordId) {
        System.debug('base64'+base64 + 'filename' + filename + ' recordId ' + recordId);
        ContentVersion cv = createContentVersion(base64, filename);
        ContentDocumentLink cdl = createContentLink(cv.Id, recordId);
        if (cv == null || cdl == null) { return null; }
        if(deleteExistingFiles(recordId, cdl.ContentDocumentId)){
			 return cdl.Id;
        }
        
        return 'Profile picture not uploaded';
       
    }
  
  
    private static ContentVersion createContentVersion(String base64, String filename) {
        ContentVersion cv = new ContentVersion();
        cv.VersionData = EncodingUtil.base64Decode(base64);
        cv.Title = filename;
        cv.PathOnClient = filename;
        try {
            insert cv;
            return cv;
        } catch(DMLException e) {
            System.debug(e);
            return null;
        }
    }
    
 
    private static ContentDocumentLink createContentLink(String contentVersionId, String recordId) {
        if (contentVersionId == null || recordId == null) { return null; }
        ContentDocumentLink cdl = new ContentDocumentLink();
        cdl.ContentDocumentId = [ SELECT ContentDocumentId FROM ContentVersion WHERE Id =: contentVersionId].ContentDocumentId;
        cdl.LinkedEntityId = recordId;
        // ShareType is either 'V', 'C', or 'I'
        // V = Viewer, C = Collaborator, I = Inferred
        cdl.ShareType = 'I';
        cdl.Visibility = 'AllUsers';
        try {
            insert cdl;
            return cdl;
        } catch(DMLException e) {
            System.debug(e);
            return null;
        }
    }
    
    
    private static Boolean deleteExistingFiles(String recordId, String newContentDocumentId) {
        try {
            List<ContentDocumentLink> links = [
                SELECT ContentDocumentId 
                FROM ContentDocumentLink 
                WHERE LinkedEntityId = :recordId AND ContentDocumentId != :newContentDocumentId
            ];
    
            if (!links.isEmpty()) {
                List<ContentDocument> documentsToDelete = new List<ContentDocument>();
                for (ContentDocumentLink link : links) {
                    documentsToDelete.add(new ContentDocument(Id = link.ContentDocumentId));
                }
    
               
                delete documentsToDelete;
    
                return true; 
            }
            return false; 
        } catch (Exception e) {
            System.debug('Error deleting old files: ' + e.getMessage());
            return false;
        }
    }
  
}