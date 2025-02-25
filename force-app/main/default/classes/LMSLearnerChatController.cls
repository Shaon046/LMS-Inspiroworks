/**
* @File Name : LMSChatController.cls
* @Description : Try to fetch feeditem and feedcomment and create feeditem for learner Q/A section 
* @Author :Anirban Pal
* @Last Modified By :
* @Last Modified On : February 12, 2025
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | February 12, 2025 |   | Initial Version
**/

public without sharing class LMSLearnerChatController {

	@AuraEnabled
    public static List<FeedItemWrapper> getFeedItemRecords(String feedParentId) {
        Id currentUserId = UserInfo.getUserId();
        List<FeedItemWrapper> feedItemWrappers = new List<FeedItemWrapper>();
    
        // Fetch FeedItems (Posts)
        List<FeedItem> feedItems = [
            SELECT Id, Body, ParentId, InsertedBy.FirstName, InsertedBy.LastName, CreatedById, CreatedDate 
            FROM FeedItem 
            WHERE ParentId = :feedParentId AND Type = 'TextPost' 
            ORDER BY CreatedDate ASC
        ];
		
        Map<Id, FeedItem> feedItemMap = new Map<Id, FeedItem>();
        Map<Id, Id> feedCreatedIdMap = new Map<Id, Id>();
        for (FeedItem feed : feedItems) {
            feedItemMap.put(feed.Id, feed);
            feedCreatedIdMap.put(feed.Id, feed.CreatedById);
        }
        
        System.debug(feedItemMap) ;
		List<FeedComment> feedComments = new List<FeedComment>();
        
        if (!feedItemMap.isEmpty()) {
            feedComments = [
               SELECT Id, FeedItemId, CommentBody,CreatedById, CreatedBy.FirstName, CreatedBy.LastName, CreatedDate
            FROM FeedComment  
                WHERE FeedItemId IN :feedItemMap.keySet() WITH SECURITY_ENFORCED
                ORDER BY CreatedDate ASC
            ];
        }
		
        for (FeedComment feedComt : feedComments) {
            feedCreatedIdMap.put(feedComt.Id, feedComt.CreatedById);
        }

        System.debug('feedCreatedIdMap'+feedCreatedIdMap);
		Map<Id, String> feedProfileImg = getUserImageUrls(feedCreatedIdMap);
        System.debug('feedProfileImg'+feedProfileImg);

		System.debug(feedComments) ;       
        for (FeedItem feed : feedItems) {
            String imgUrl;
            Boolean isOwned = feed.CreatedById == currentUserId;
            if(feedProfileImg.containsKey(feed.Id)){
                imgUrl = feedProfileImg.get(feed.Id);
			}
            feedItemWrappers.add(new FeedItemWrapper(
                feed.Id,
                feed.Body.stripHtmlTags(), 
                null,
                null,
                feed.InsertedBy.FirstName + ' ' + feed.InsertedBy.LastName,
                imgUrl,  
               	isOwned,                      
                feed.CreatedDate         
            ));
        }
        
        System.debug(feedComments) ;    
        for (FeedComment comment : feedComments) {
            String imgUrl;
            if(feedProfileImg.containsKey(comment.Id)){
                imgUrl = feedProfileImg.get(comment.Id);
			}
            if (feedItemMap.containsKey(comment.FeedItemId)) {
                FeedItem parentPost = feedItemMap.get(comment.FeedItemId);
                System.debug(parentPost) ;       
                Boolean isOwned = comment.CreatedById == currentUserId;
                feedItemWrappers.add(new FeedItemWrapper(
                    comment.Id,
                    comment.CommentBody.stripHtmlTags(),  
                    parentPost.Body.stripHtmlTags(),      
                    comment.FeedItemId,
                    comment.CreatedBy.FirstName + ' ' + comment.CreatedBy.LastName,
                    imgUrl, 
                    isOwned,                              
                    comment.CreatedDate             
                ));
            }
        }		
        return feedItemWrappers;
    }

	@AuraEnabled
    public static List<FeedItemWrapper> createFeedItem(String parentId, String message, String createdById) {
        Id currentUserId = UserInfo.getUserId();

        FeedItem post = new FeedItem();
        post.ParentId = parentId;
        post.Body = message;
        post.CreatedById = createdById;
      
        List<String> fieldApiNames = new List<String>{'Body','CreatedById','ParentId'};
            
        if(post != null && FLSUtility.hasFieldAccess('FeedItem',fieldApiNames) && FLSUtility.hasFieldCreateAccess('FeedItem',fieldApiNames)){
            insert post;
        }
        
        FeedItem feed;
		List<String> feedItemFieldApiNames = new List<String>{'Id','Body','CreatedById','CreatedDate','ParentId'};
        List<String> userFieldApiNames = new List<String>{'FirstName','LastName'};
         
        if(FLSUtility.hasFieldAccess('FeedItem',feedItemFieldApiNames) && FLSUtility.hasFieldCreateAccess('FeedItem',feedItemFieldApiNames) && FLSUtility.hasFieldAccess('User',userFieldApiNames) && FLSUtility.hasFieldCreateAccess('User',userFieldApiNames)){
             feed = [
                SELECT Id, Body, ParentId, InsertedBy.FirstName, InsertedBy.LastName, CreatedById, CreatedDate FROM FeedItem WHERE Id = :post.Id
            ];
        }

        Map<Id, Id> feedMap = new Map<Id, Id>();

        if (feed != null) {
            feedMap.put(feed.Id, feed.CreatedById);
        }

        Map<Id, String> feedProfileImg = getUserImageUrls(feedMap);
        String imgUrl;
        if(feedProfileImg.containsKey(feed.Id)){
            imgUrl = feedProfileImg.get(feed.Id);
        }
        Boolean isOwned = feed.CreatedById == currentUserId;
        return new List<FeedItemWrapper>{
            
            new FeedItemWrapper(
                feed.Id,
                feed.Body.stripHtmlTags(),
                null,
                null,
                feed.InsertedBy.FirstName + ' ' + feed.InsertedBy.LastName,
                imgUrl,
                isOwned,
                feed.CreatedDate
            )
        };
    }


	@AuraEnabled
    public static User getUserId(){
        List<String> fieldApiNames = new List<String>{'Id','FirstName','LastName'};
        
           if(FLSUtility.hasFieldAccess('User',fieldApiNames)){
               return [
                   SELECT Id, FirstName, LastName 
                   FROM User 
                   WHERE Id = :UserInfo.getUserId() 
                   LIMIT 1
               ];
           }else{
               return null;
           }
	}

    @AuraEnabled
    public static Map<Id, String> getUserImageUrls(Map<Id, Id> userIdsMap) {
        Map<Id, String> resultMap = new Map<Id, String>();

        if (userIdsMap == null || userIdsMap.isEmpty()) {
            return resultMap;
        }

        Map<Id, User> usersMap = new Map<Id, User>(
            [SELECT Id, ContactId, FullPhotoUrl FROM User WHERE Id IN :userIdsMap.values()]
        );

        // Collect Contact IDs
        Set<Id> contactIds = new Set<Id>();
        for (User usr : usersMap.values()) {
            if (usr.ContactId != null) {
                contactIds.add(usr.ContactId);
            }
        }

        Map<Id, Id> contactToContentDocMap = new Map<Id, Id>();
        List<ContentDocumentLink> contentDocs = [
            SELECT LinkedEntityId, ContentDocument.Id 
            FROM ContentDocumentLink 
            WHERE LinkedEntityId IN :contactIds 
            ORDER BY ContentDocument.CreatedDate DESC
        ];

        for (ContentDocumentLink cdl : contentDocs) {
            if (!contactToContentDocMap.containsKey(cdl.LinkedEntityId)) {
                contactToContentDocMap.put(cdl.LinkedEntityId, cdl.ContentDocument.Id);
            }
        }

        Map<Id, Id> contentDocToVersionMap = new Map<Id, Id>();
        List<ContentVersion> contentVersions = [
            SELECT Id, ContentDocumentId 
            FROM ContentVersion 
            WHERE ContentDocumentId IN :contactToContentDocMap.values()
            AND FileExtension IN ('jpg', 'jpeg', 'png', 'gif')
            ORDER BY CreatedDate DESC
        ];

        for (ContentVersion cv : contentVersions) {
            if (!contentDocToVersionMap.containsKey(cv.ContentDocumentId)) {
                contentDocToVersionMap.put(cv.ContentDocumentId, cv.Id);
            }
        }

        for (Id key : userIdsMap.keySet()) {
            Id userId = userIdsMap.get(key);
            User usr = usersMap.get(userId);

            if (usr != null) {
                if (usr.ContactId != null && contactToContentDocMap.containsKey(usr.ContactId)) {
                    Id contentDocId = contactToContentDocMap.get(usr.ContactId);
                    if (contentDocToVersionMap.containsKey(contentDocId)) {
                        resultMap.put(key, '/sfc/servlet.shepherd/version/download/' + contentDocToVersionMap.get(contentDocId));
                        continue;
                    }
                }
               
                resultMap.put(key, usr.FullPhotoUrl);
            }
        }

        return resultMap;
    }

	public class FeedItemWrapper {
        @AuraEnabled public String feedItemId; 
        @AuraEnabled public String message;          
        @AuraEnabled public String replyOf; 
        @AuraEnabled public String replyOfFeedId;
        @AuraEnabled public String authorName;
        @AuraEnabled public String authorProfileImg;              
        @AuraEnabled public Boolean isOwned;         
        @AuraEnabled public DateTime lastModifiedDate; 
    
        public FeedItemWrapper(String feedItemId, String message, String replyOf,String replyOfFeedId, String authorName,String authorProfileImg, Boolean isOwned, DateTime lastModifiedDate) {
            this.feedItemId = feedItemId;
            this.message = message;
            this.replyOf = replyOf;
            this.replyOfFeedId = replyOfFeedId;
            this.authorName = authorName;
            this.authorProfileImg = authorProfileImg;
            this.isOwned = isOwned;
            this.lastModifiedDate = lastModifiedDate;
        }
        
    }
}