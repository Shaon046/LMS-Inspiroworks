public Without Sharing class LMSChatterGroupController {

    @AuraEnabled
    public static List<GroupWrapper> getAllCollaborationGroup() {
        List<GroupWrapper> groupWrappers = new List<GroupWrapper>();
        Map<Id, Id> groupCourseMap = new Map<Id, Id>(); 
        Set<String> groupTitles = new Set<String>(); 

        Id loggedInUserId = UserInfo.getUserId();
        List<CollaborationGroupMember> groupMembers = [SELECT Id, CollaborationGroupId FROM CollaborationGroupMember WHERE MemberId = :loggedInUserId];
        Set<Id> groupIds = new Set<Id>();
        for (CollaborationGroupMember member : groupMembers) {
            groupIds.add(member.CollaborationGroupId);
        }

        List<CollaborationGroup> collaborationGroupList = [
            SELECT Id, Name, MemberCount, OwnerId, Owner.Name, CollaborationType, Description, LastViewedDate, LastReferencedDate, IsArchived, IsBroadcast, SystemModstamp 
            FROM CollaborationGroup 
            WHERE CollaborationType = 'Public'
            ORDER BY SystemModstamp DESC
        ];

        Set<Id> ownerIds = new Set<Id>();
        for (CollaborationGroup cg : collaborationGroupList) {
            if (cg.OwnerId != null) {
                ownerIds.add(cg.OwnerId);
            }
        }

        Map<Id, User> userMap = new Map<Id, User>([SELECT Id, FirstName, LastName FROM User WHERE Id IN :ownerIds]);

        // Step 1: Map group names to their corresponding Course Ids
        Map<String, Id> courseMap = new Map<String, Id>();
        List<Course__c> courses = [SELECT Id, Title__c FROM Course__c];

        for (Course__c course : courses) {
            courseMap.put(course.Title__c, course.Id);
        }

        // Step 2: Map Group ID to Course ID
        for (CollaborationGroup colGroup : collaborationGroupList) {
            if (courseMap.containsKey(colGroup.Name)) {
                groupCourseMap.put(colGroup.Id, courseMap.get(colGroup.Name));
            }
        }

        // Step 3: Get ContentDocumentLink records related to Courses
        Map<Id, Id> courseToContentMap = new Map<Id, Id>();
        List<ContentDocumentLink> contentLinks = [
            SELECT ContentDocumentId, LinkedEntityId 
            FROM ContentDocumentLink 
            WHERE LinkedEntityId IN :groupCourseMap.values()
        ];

        for (ContentDocumentLink link : contentLinks) {
            courseToContentMap.put(link.LinkedEntityId, link.ContentDocumentId);
        }

        // Step 4: Get ContentVersion records for the linked ContentDocumentIds
        List<ContentVersion> contentVersions = [
            SELECT Id, ContentDocumentId 
            FROM ContentVersion 
            WHERE ContentDocumentId IN :courseToContentMap.values()
            ORDER BY CreatedDate DESC
        ];

        Map<Id, ContentVersion> contentDocumentToVersionMap = new Map<Id, ContentVersion>();
        for (ContentVersion version : contentVersions) {
            contentDocumentToVersionMap.put(version.ContentDocumentId, version);
        }

        // Step 5: Map ContentVersion Id to Group Id
        Map<Id, Id> groupToContentMap = new Map<Id, Id>();
        for (Id groupId : groupCourseMap.keySet()) {
            Id courseId = groupCourseMap.get(groupId);
            if (courseToContentMap.containsKey(courseId)) {
                Id contentDocumentId = courseToContentMap.get(courseId);
                if (contentDocumentToVersionMap.containsKey(contentDocumentId)) {
                    groupToContentMap.put(groupId, contentDocumentToVersionMap.get(contentDocumentId).Id);
                }
            }
        }

        // Step 6: Build the GroupWrapper objects
        for (CollaborationGroup colGroup : collaborationGroupList) {
            if (groupCourseMap.containsKey(colGroup.Id)) {
                Id associatedContentVersion = null;
                if (groupToContentMap.containsKey(colGroup.Id)) {
                    associatedContentVersion = groupToContentMap.get(colGroup.Id);
                }

                String groupAdminName = (userMap.containsKey(colGroup.OwnerId)) 
                                ? capitalizeFirstLetter(userMap.get(colGroup.OwnerId).FirstName) + '  '+ capitalizeFirstLetter(userMap.get(colGroup.OwnerId).LastName)
                                : 'Unknown';

                // Fetch Group Details using the new method
                GroupDetailsWrapper groupDetails = getGroupDetails(colGroup.Id);

                groupWrappers.add(new GroupWrapper(colGroup, groupAdminName, associatedContentVersion, groupDetails));
            }
        }

        return groupWrappers;
    }

    @AuraEnabled(cacheable=true)
    public static GroupDetailsWrapper getGroupDetails(String groupId) {
        // Get Group Details
        CollaborationGroup colGroup = [SELECT Name, Description FROM CollaborationGroup WHERE Id = :groupId LIMIT 1];

        // Fetch Group Members
        List<CollaborationGroupMember> groupMembers = [SELECT MemberId, Member.FirstName,Member.LastName, Member.FullPhotoUrl, Member.ContactId, Member.UserType FROM CollaborationGroupMember WHERE CollaborationGroupId = :groupId];

        // Prepare wrapper
        GroupDetailsWrapper groupWrapper = new GroupDetailsWrapper(colGroup.Name, colGroup.Description);

        // Extract Contact IDs (For External Users)
        Set<Id> contactIds = new Set<Id>();
        for (CollaborationGroupMember member : groupMembers) {
            if (member.Member.ContactId != null) {
                contactIds.add(member.Member.ContactId);
            }
        }

        // Fetch Profile Pictures for External Users from ContentVersion
        Map<Id, String> contactProfilePics = new Map<Id, String>();
        if (!contactIds.isEmpty()) {
            Map<Id, Id> contentDocMap = new Map<Id, Id>();
            for (ContentDocumentLink cdl : [
                SELECT ContentDocumentId, LinkedEntityId 
                FROM ContentDocumentLink 
                WHERE LinkedEntityId IN :contactIds
            ]) {
                contentDocMap.put(cdl.LinkedEntityId, cdl.ContentDocumentId);
            }

            Map<Id, Id> docToContactMap = new Map<Id, Id>(); 
            for (Id contactId : contentDocMap.keySet()) {
                docToContactMap.put(contentDocMap.get(contactId), contactId);
            }

            for (ContentVersion cv : [
                SELECT Id, ContentDocumentId 
                FROM ContentVersion 
                WHERE ContentDocumentId IN :docToContactMap.keySet()
                ORDER BY CreatedDate DESC
            ]) {
                Id contactId = docToContactMap.get(cv.ContentDocumentId); 
                if (contactId != null) {
                    contactProfilePics.put(contactId, '/sfc/servlet.shepherd/version/download/' + cv.Id);
                }
            }
        }

        // Build Member List
        for (CollaborationGroupMember member : groupMembers) {
            String profilePic = member.Member.FullPhotoUrl;
            if (member.Member.ContactId != null && contactProfilePics.containsKey(member.Member.ContactId)) {
                profilePic = contactProfilePics.get(member.Member.ContactId);
            }

            groupWrapper.members.add(new MemberDetailsWrapper(capitalizeFirstLetter(member.Member.FirstName) + '  ' + capitalizeFirstLetter(member.Member.LastName) , profilePic));
        }

        return groupWrapper;
    }

    public class GroupWrapper {
        @AuraEnabled
        public CollaborationGroup collaborationGroup;  // Stores full CollaborationGroup data
        
        @AuraEnabled
        public Id contentVersion;  // Stores the associated image ContentVersion

        @AuraEnabled
        public String groupAdminName;

        @AuraEnabled
        public GroupDetailsWrapper groupDetails;  // New field to store group details

        public GroupWrapper(CollaborationGroup collaborationGroup, String groupAdminName, Id contentVersion, GroupDetailsWrapper groupDetails) {
            this.collaborationGroup = collaborationGroup;
            this.contentVersion = contentVersion;
            this.groupAdminName = groupAdminName;
            this.groupDetails = groupDetails;
        }
    }

    public class GroupDetailsWrapper {
        @AuraEnabled
        public String groupName { get; set; }
        @AuraEnabled
        public String groupDescription { get; set; }
        @AuraEnabled
        public List<MemberDetailsWrapper> members { get; set; }

        public GroupDetailsWrapper(String name, String description) {
            this.groupName = name;
            this.groupDescription = description;
            this.members = new List<MemberDetailsWrapper>();
        }
    }

    public class MemberDetailsWrapper {
        @AuraEnabled
        public String name { get; set; }
        @AuraEnabled
        public String profileUrl { get; set; }

        public MemberDetailsWrapper(String name, String profileUrl) {
            this.name = name;
            this.profileUrl = profileUrl;
        }
    }


    private Static String capitalizeFirstLetter(String name) {
        if (String.isNotBlank(name)) {
            return name.substring(0,1).toUpperCase() + name.substring(1).toLowerCase();
        }
        return '';
    }
}