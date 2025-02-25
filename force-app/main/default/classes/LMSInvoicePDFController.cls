public without sharing class LMSInvoicePDFController {
    public Order order { get; private set; }
    public List<OrderItem> orderItems { get; private set; }
    public String todaysdate { get; private set; }
    public Contact contact { get; private set; }
    public Organization_Detail__mdt companyDetails { get; private set; }
    public Payment__c paymentDetails { get; private set; }
    public Integer pendingAmount { get; private set; }
    public Decimal totalProducts { get; private set; }
    public Decimal totalRate { get; private set; }
    public String paymentDate { get; private set; }
    
    public LMSInvoicePDFController() {
        Id orderId = ApexPages.currentPage().getParameters().get('orderId');
        order = [SELECT Id, Name, Account.Name,OrderNumber,TotalAmount, EffectiveDate, Contact_Name__c  FROM Order WHERE Id = :orderId];
        orderItems = [SELECT Id, Quantity, UnitPrice, Product2.Name FROM OrderItem WHERE OrderId = :orderId];
        contact = [SELECT Id, Name, Email, Phone, MailingStreet, MailingCity, MailingState, MailingCountry, MailingPostalCode from Contact Where Id=: order.Contact_Name__c LIMIT 1];
        companyDetails = [SELECT Id, Company_Name__c, Phone__c, Email__c, Website__c, Mailing_Street__c, Mailing_City__c, Mailing_State__c, Mailing_Country__c, Mailing_Zip_postal_code__c FROM Organization_Detail__mdt LIMIT 1];
        paymentDetails = [SELECT Id, Payment_Status__c, Transaction_Date__c, Payment_Amount__c FROM Payment__c where Related_Contact__c =:contact.Id LIMIT 1];
        pendingAmount = 0;
        paymentDate = (paymentDetails.Transaction_Date__c).day()+'/'+(paymentDetails.Transaction_Date__c).month()+'/'+(paymentDetails.Transaction_Date__c).year();
        totalProducts = Decimal.valueOf(orderItems.size()).setScale(2);
        totalRate = 0;
        
        for(OrderItem oli:orderItems){
            totalRate = totalRate + oli.UnitPrice;
        }
        
        Date today = Date.today();
        todaysdate = today.day() +'/'+ today.month() +'/'+ today.year();
        
       // PageReference invoicePDF = new PageReference('/apex/InvoicePDF?orderId='+orderId);
       // attachPdf(invoicePDF, orderId);
        
    }
    
    public static void attachPdf(PageReference invoicePDF, String recordId){
        
        If(invoicePDF != null && recordId != null){
            Attachment attachment = new Attachment();
            attachment.body = invoicePDF.getContentAsPdf();
            attachment.Name = 'Invoice.pdf';
            attachment.ParentId = recordId;
            
            List<String> fieldApiNames = new List<String>{'body','Name','ParentId'};
            
            if(FLSUtility.hasFieldAccess('Attachment',fieldApiNames) && FLSUtility.hasFieldCreateAccess('Attachment',fieldApiNames)){
                insert attachment;
            }
            
        }
        
    }
}