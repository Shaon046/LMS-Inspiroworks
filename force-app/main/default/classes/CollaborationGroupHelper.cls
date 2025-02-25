public class CollaborationGroupHelper {

    public static void updateChatterGroupPhoto(Id chatterGroupId, Id contentDocumentId) {
        try {
            // Get the content version of the latest document
            ContentVersion contentVersion = [SELECT Id, VersionData, Title 
                                             FROM ContentVersion 
                                             WHERE ContentDocumentId = :contentDocumentId 
                                             LIMIT 1];

            // Get the base URL for the org
            String baseUrl = URL.getOrgDomainUrl().toExternalForm();

            // Prepare the HTTP request to update the photo
            HttpRequest req = new HttpRequest();
            req.setEndpoint(baseUrl + '/services/data/v58.0/chatter/groups/' + chatterGroupId + '/photo');
            req.setMethod('POST');
            req.setHeader('Authorization', 'Bearer ' + UserInfo.getSessionId());
            req.setHeader('Content-Type', 'multipart/form-data; boundary=boundary');
            req.setBody('--boundary\n' +
                        'Content-Disposition: form-data; name="fileData"; filename="' + contentVersion.Title + '"\n' +
                        'Content-Type: image/jpeg\n\n' +
                        contentVersion.VersionData.toString() + '\n' +
                        '--boundary--');

            Http http = new Http();
            HttpResponse res = http.send(req);

            if (res.getStatusCode() == 201) {
                System.debug('Photo updated successfully for Chatter Group: ' + chatterGroupId);
            } else {
                System.debug('Failed to update photo. Response: ' + res.getBody());
            }
        } catch (Exception e) {
            System.debug('Error updating Chatter Group photo: ' + e.getMessage());
        }
    }
}