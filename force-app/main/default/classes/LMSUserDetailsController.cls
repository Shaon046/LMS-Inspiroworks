/**
* @File Name : LMSUserDetailsController.cls
* @Description : we are try to fetch logedin user details
* @Author : Anirban Pal
* @Last Modified By :
* @Last Modified On : February 18, 2025
* @Modification Log :
*==============================================================================
* Ver | Date | Author | Modification
*==============================================================================
* 1.0 | February 18, 2025 |   | Initial Version
**/

public  Without Sharing class LMSUserDetailsController {

	@AuraEnabled
	public static UserProfileWrapper getLoggedInUserDetails() {
		Id currentUserId = UserInfo.getUserId();

		User currentUser = [SELECT Id, Name, FirstName, LastName, FullPhotoUrl, ContactId, UserType FROM User WHERE Id = :currentUserId WITH SECURITY_ENFORCED LIMIT 1];

		String profileImage = currentUser.FullPhotoUrl;

		if (currentUser.ContactId != null) {
			List<ContentDocumentLink> docLinks = [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :currentUser.ContactId WITH SECURITY_ENFORCED];

			if (!docLinks.isEmpty()) {
				List<ContentVersion> versions = [SELECT Id FROM ContentVersion WHERE ContentDocumentId = :docLinks[0].ContentDocumentId WITH SECURITY_ENFORCED ORDER BY ContentModifiedDate DESC LIMIT 1];

				if (!versions.isEmpty()) {
					profileImage = '/sfc/servlet.shepherd/version/download/' + versions[0].Id;
				}
			}
		}

		Boolean isAdmin = false;
		Boolean isLearner = false;

		Boolean isInternal = (currentUser.UserType == 'Standard');

		if (isInternal) {
			isAdmin = true;
		} else {
			List<PermissionSetAssignment> assignments = [SELECT PermissionSet.Name FROM PermissionSetAssignment WHERE AssigneeId = :currentUserId WITH SECURITY_ENFORCED];
			for (PermissionSetAssignment assignment : assignments) {
				if (assignment.PermissionSet.Name == 'LMS_Community_Admin') {
					isAdmin = true;
					break;
				} else if (assignment.PermissionSet.Name == 'LMS_Community_Learner') {
					isLearner = true;
					break;
				}
			}
		}
		return new UserProfileWrapper(
			currentUser.Id,
			currentUser.FirstName + ' ' + currentUser.LastName,
			currentUser.UserType == 'Standard' ? 'Internal' : 'Extenal' ,
			profileImage,
			isAdmin,
			isLearner
		);
	}


	public class UserProfileWrapper {

		@AuraEnabled
		public Id userId;
		@AuraEnabled
		public String userName;
		@AuraEnabled
		public String userType;
		@AuraEnabled
		public String profileImage;
		@AuraEnabled
		public Boolean isAdmin;
		@AuraEnabled
		public Boolean isLearner;

		public UserProfileWrapper(Id userId,String userName, String userType, String profileImage, Boolean isAdmin, Boolean isLearner) {
			this.userId = userId;
			this.userName = userName;
			this.userType = userType;
			this.profileImage = profileImage;
			this.isAdmin = isAdmin;
			this.isLearner = isLearner;
		}
	}
}