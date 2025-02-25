public Without Sharing class LMSAdminChatController {
	@AuraEnabled
    public static List<FeedItemWrapper> getFeedItemsWithComments(String parentId) {
       List<FeedItemWrapper> result = new List<FeedItemWrapper>();
        
		List<String> feedItemFieldApiNames = new List<String>{'Id','Body','CreatedById','CreatedDate'};
        List<String> userFieldApiNames = new List<String>{'FirstName','LastName'};
        List<FeedItem> feedItems;
        if(FLSUtility.hasFieldAccess('FeedItem',feedItemFieldApiNames) && FLSUtility.hasFieldCreateAccess('FeedItem',feedItemFieldApiNames) && FLSUtility.hasFieldAccess('User',userFieldApiNames) && FLSUtility.hasFieldCreateAccess('User',userFieldApiNames)){
      
               feedItems = [
                SELECT Id, Body, CreatedDate, CreatedById,InsertedBy.FirstName, InsertedBy.LastName
                FROM FeedItem 
                WHERE ParentId = :parentId AND Type = 'TextPost'  ORDER BY CreatedDate ASC
            ];
         }

        Set<Id> userIds = new Set<Id>();
        for (FeedItem item : feedItems) {
            userIds.add(item.CreatedById);
        }
        Set<Id> feedItemId = new Set<Id>();
        for (FeedItem item : feedItems) {
            feedItemId.add(item.Id);
        }

        Map<Id, String> profilePicMap = getProfilePictureUrls(userIds);
        
        Map<Id, List<FeedCommentWrapper>> feedCommentsMap = getFeedCommentsByFeedItemIds(new List<Id>(feedItemId));

        for (FeedItem item : feedItems) {
            String profilePic = profilePicMap.containsKey(item.CreatedById) ? profilePicMap.get(item.CreatedById) : null;
            String postAuthor = item.InsertedBy.FirstName + ' ' + item.InsertedBy.LastName;
            
            // Get the list of comments, assign null if no comments exist
            List<FeedCommentWrapper> comments = feedCommentsMap.containsKey(item.Id) ? feedCommentsMap.get(item.Id) : new List<FeedCommentWrapper>();

            result.add(new FeedItemWrapper(item.Id, item.Body.stripHtmlTags(), item.CreatedDate, postAuthor, profilePic, comments));
        }

        return result;
    }
    
    @AuraEnabled
    public static Map<Id, List<FeedCommentWrapper>> getFeedCommentsByFeedItemIds(List<Id> feedItemIds) {
        Map<Id, List<FeedCommentWrapper>> feedCommentMap = new Map<Id, List<FeedCommentWrapper>>();
		
        List<String> feedItemFieldApiNames = new List<String>{'Id','CommentBody','CreatedById','CreatedDate','FeedItemId'};
        List<String> userFieldApiNames = new List<String>{'FirstName','LastName'};
        List<FeedComment> feedComments;  
        if(FLSUtility.hasFieldAccess('FeedItem',feedItemFieldApiNames) && FLSUtility.hasFieldCreateAccess('FeedItem',feedItemFieldApiNames) && FLSUtility.hasFieldAccess('User',userFieldApiNames) && FLSUtility.hasFieldCreateAccess('User',userFieldApiNames)){
      
             feedComments = [
                SELECT Id, FeedItemId, CommentBody, CreatedDate, CreatedById,CreatedBy.FirstName, CreatedBy.LastName
                FROM FeedComment 
                WHERE FeedItemId IN :feedItemIds ORDER BY CreatedDate ASC
            ];
        }

        Set<Id> userIds = new Set<Id>();
        for (FeedComment comment : feedComments) {
            userIds.add(comment.CreatedById);
        }

        Map<Id, String> profilePicMap = getProfilePictureUrls(userIds);

        for (FeedComment comment : feedComments) {
            String profilePic = profilePicMap.containsKey(comment.CreatedById) ? profilePicMap.get(comment.CreatedById) : null;
            String commentAuthor = comment.CreatedBy.FirstName +' '+ comment.CreatedBy.LastName;
            String commentBody = comment.CommentBody.stripHtmlTags();
            FeedCommentWrapper wrapper;
            if(!String.isBlank(commentBody)){
                wrapper = new FeedCommentWrapper(comment.FeedItemId,comment.Id,commentBody , comment.CreatedDate, commentAuthor, profilePic);
            }
            
            if (!feedCommentMap.containsKey(comment.FeedItemId)) {
                feedCommentMap.put(comment.FeedItemId, new List<FeedCommentWrapper>());
            }
            feedCommentMap.get(comment.FeedItemId).add(wrapper);
        }

        return feedCommentMap;
    }
 
    private static Map<Id, String> getProfilePictureUrls(Set<Id> userIds) {
        Map<Id, String> profilePicMap = new Map<Id, String>();

        Map<Id, User> userMap = new Map<Id, User>([SELECT Id, FullPhotoUrl, ContactId FROM User WHERE Id IN :userIds ]);

        Set<Id> contactIds = new Set<Id>();
        for (User user : userMap.values()) {
            if (user.ContactId != null) {
                contactIds.add(user.ContactId);
            }
        }

        Map<Id, Id> contactToDocMap = new Map<Id, Id>();
        if (!contactIds.isEmpty()) {
            for (ContentDocumentLink docLink : [SELECT ContentDocumentId, LinkedEntityId FROM ContentDocumentLink WHERE LinkedEntityId IN :contactIds ]) {
                contactToDocMap.put(docLink.LinkedEntityId, docLink.ContentDocumentId);
            }
        }

        Map<Id, String> docToVersionMap = new Map<Id, String>();
        if (!contactToDocMap.values().isEmpty()) {
            for (ContentVersion version : [SELECT Id, ContentDocumentId FROM ContentVersion WHERE ContentDocumentId IN :contactToDocMap.values()]) {
                docToVersionMap.put(version.ContentDocumentId, '/sfc/servlet.shepherd/version/download/' + version.Id);
            }
        }

        for (User user : userMap.values()) {
            if (user.ContactId != null && contactToDocMap.containsKey(user.ContactId) && docToVersionMap.containsKey(contactToDocMap.get(user.ContactId))) {
                profilePicMap.put(user.Id, docToVersionMap.get(contactToDocMap.get(user.ContactId)));
            } else {
                profilePicMap.put(user.Id, user.FullPhotoUrl);
            }
        }
        return profilePicMap;
    }
    
    @AuraEnabled
    public static FeedCommentWrapper createFeedComment(Id feedItemId, String body) {
        if (feedItemId == null || String.isEmpty(body)) {
            throw new AuraHandledException('Invalid input: userId, feedItemId, and body are required.');
        }

        try {
           
            FeedComment newComment = new FeedComment();
            newComment.FeedItemId = feedItemId;
            newComment.CommentBody = body;
            insert newComment;

            FeedComment insertedComment = [
                SELECT Id, FeedItemId, CommentBody, CreatedDate, CreatedById, CreatedBy.FirstName, CreatedBy.LastName
                FROM FeedComment
                WHERE Id =:newComment.Id
                ORDER BY CreatedDate DESC
                LIMIT 1
            ];
            
            Set<Id> userIds = new Set<Id>{ insertedComment.CreatedById };
			Map<Id, String> profilePicMap = getProfilePictureUrls(userIds);
           
            return new FeedCommentWrapper(
                insertedComment.FeedItemId,
                insertedComment.Id,
                insertedComment.CommentBody,
                insertedComment.CreatedDate,
                insertedComment.CreatedBy.FirstName +' '+ insertedComment.CreatedBy.LastName,
                profilePicMap.containsKey(insertedComment.CreatedById) ? profilePicMap.get(insertedComment.CreatedById) : null
            );

        } catch (Exception e) {
            throw new AuraHandledException('Error inserting FeedComment: ' + e.getMessage());
        }
    }
    
    @AuraEnabled
    public static FeedItemWrapper insertFeedItem(String parentId, String message, String createdById) {
        try {
           
            FeedItem newFeedItem = new FeedItem();
            
            newFeedItem.ParentId = parentId; 
            newFeedItem.Body = message;
            newFeedItem.CreatedById = createdById;
            
            insert newFeedItem;
            
            
            FeedItem insertedFeedItem = [SELECT Id, Body, CreatedDate, CreatedById, InsertedBy.FirstName, InsertedBy.LastName FROM FeedItem WHERE Id = :newFeedItem.Id LIMIT 1];
            
            Set<Id> userIds = new Set<Id>{ insertedFeedItem.CreatedById };
			Map<Id, String> profilePicMap = getProfilePictureUrls(userIds);
            
            FeedItemWrapper wrapper = new FeedItemWrapper(
                insertedFeedItem.Id, 
                insertedFeedItem.Body, 
                insertedFeedItem.CreatedDate, 
                insertedFeedItem.InsertedBy.FirstName + ' ' + insertedFeedItem.InsertedBy.LastName, 
                profilePicMap.containsKey(insertedFeedItem.CreatedById) ? profilePicMap.get(insertedFeedItem.CreatedById) : null, 
                null 
            );
            
            return wrapper;
        } catch (Exception e) {
            
            throw new AuraHandledException('Error inserting FeedItem: ' + e.getMessage());
        }
    }
    
    
    
    
  
    public class FeedItemWrapper {
        @AuraEnabled
        public Id feedItemId;
        @AuraEnabled
        public String body;
        @AuraEnabled
        public DateTime postDate;
        @AuraEnabled
        public String postAuthor;
        @AuraEnabled
        public String authorProfilePictureUrl;
        @AuraEnabled
        public List<FeedCommentWrapper> comments; // Change from single comment to list
        
        public FeedItemWrapper(Id feedItemId, String body, DateTime postDate, String postAuthor, String authorProfilePictureUrl, List<FeedCommentWrapper> comments) {
            this.feedItemId = feedItemId;
            this.body = body;
            this.postDate = postDate;
            this.postAuthor = postAuthor;
            this.authorProfilePictureUrl = authorProfilePictureUrl;
            this.comments = comments;
        }
    }

    public class FeedCommentWrapper {
        @AuraEnabled
        public Id feedItemId;
        @AuraEnabled
        public Id feedCommentId;
        @AuraEnabled
        public String commentBody;
        @AuraEnabled
        public DateTime commentDate;
        @AuraEnabled
        public String commentAuthor;
        @AuraEnabled
        public String commentAuthPictureUrl;
        
        public FeedCommentWrapper(Id feedItemId, Id feedCommentId, String commentBody, DateTime commentDate, String commentAuthor, String commentAuthPictureUrl) {
            this.feedCommentId = feedCommentId;
            this.commentBody = commentBody;
            this.commentDate = commentDate;
            this.commentAuthor = commentAuthor;
            this.commentAuthPictureUrl = commentAuthPictureUrl;
            this.feedItemId = feedItemId;
        }
    }
}