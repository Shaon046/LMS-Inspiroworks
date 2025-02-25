public without sharing class LMSSendInvoiceMail {
    
    
    public static void sendEmail(String orderId){
        
        Order order = [SELECT Id, Name, Account.Name,OrderNumber,TotalAmount, EffectiveDate, Contact_Name__c  FROM Order WHERE Id = :orderId];
        OrderItem orderItems = [SELECT Id, Quantity, UnitPrice, Product2.Name FROM OrderItem WHERE OrderId =: orderId];
        
         Contact con = new Contact();
         con = [Select Id, Name,Email From Contact Where Id =: order.Contact_Name__c];
        
        List<Messaging.SingleEmailMessage> masterListMails =  new List<Messaging.SingleEmailMessage>();
        
        List<EmailTemplate> template = [SELECT Id,Name,HtmlValue,Subject FROM EmailTemplate Where DeveloperName = 'lms_Order_Invoice_Email_for_External_Learner' LIMIT 1];
        
        Organization_Detail__mdt companyDetails = [SELECT Id, Company_Name__c, Phone__c, Email__c, Website__c, Mailing_Street__c, Mailing_City__c, Mailing_State__c, Mailing_Country__c, Mailing_Zip_postal_code__c, Email_Sender_Name__c FROM Organization_Detail__mdt LIMIT 1];
        List<OrgWideEmailAddress> owea = new List<OrgWideEmailAddress>();
        
        owea = [SELECT Id, Address, DisplayName FROM OrgWideEmailAddress LIMIT 1];
        
        List<String> toAddress = new List<String>();
        String htmlBody = template[0].HtmlValue;
        
        if(con != null && con.Email != null){
            toAddress.add(con.Email);
            
            htmlBody = htmlBody.replace('[insert name]', con.Name != null ? con.Name : '');
            htmlBody = htmlBody.replace('[!CompanyMail]', companyDetails.Email__c != null ? companyDetails.Email__c : '');
            htmlBody = htmlBody.replace('[!sender]', companyDetails.Email_Sender_Name__c != null ? companyDetails.Email_Sender_Name__c+'<br/>'+ companyDetails.Company_Name__c : '');
           // htmlBody = htmlBody.replace('[!CourseDetails]', companyDetails.Email__c != null ? companyDetails.Email__c : ''); 
           // htmlBody = htmlBody.replace('[!purchaseDetails]', companyDetails.Email__c != null ? companyDetails.Email__c : '');
                        
            PageReference invoicePDF = new PageReference('/apex/LMSInvoicePDF?orderId='+orderId);
            Messaging.EmailFileAttachment attachment = new Messaging.EmailFileAttachment();
            attachment.setContentType('application/pdf');
            attachment.setFileName('Invoice');
            attachment.Body = invoicePDF.getContentAsPdf();
            attachment.setInline(false);
            
            Messaging.SingleEmailMessage mymail = new Messaging.SingleEmailMessage();
            mymail.setToAddresses(toaddress);
            mymail.setSubject(template[0].Subject);
            mymail.setHtmlBody(htmlBody);
            mymail.setOrgWideEmailAddressId(owea[0].Id);
            mymail.setFileAttachments(new Messaging.EmailFileAttachment[]{attachment});
            
            masterListMails.add(mymail);
            
            if(!masterListMails.isEmpty()){
                Messaging.sendEmail(masterListMails);
            }
        }
           
        
    }

}