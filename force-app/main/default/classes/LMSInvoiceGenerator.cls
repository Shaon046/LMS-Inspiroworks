public without sharing class LMSInvoiceGenerator {
    public static void generateAndAttachInvoice(Id orderId) {
        // Fetch the order and related data
        Order order = [SELECT Id, Name, Account.Name, TotalAmount, EffectiveDate FROM Order WHERE Id = :orderId];
        List<OrderItem> orderItems = [SELECT Id, Quantity, UnitPrice, Product2.Name FROM OrderItem WHERE OrderId = :orderId];
        
        // Pass data to the Visualforce page
        PageReference invoicePage = Page.LMSInvoicePDF; // Your VF page name
        invoicePage.getParameters().put('orderId', order.Id);
        Blob pdfBlob = invoicePage.getContentAsPDF();
        
        // Create a ContentVersion record for the PDF
        ContentVersion contentVersion = new ContentVersion();
        contentVersion.Title = 'Invoice_' + order.Name;
        contentVersion.PathOnClient = 'Invoice_' + order.Name + '.pdf';
        contentVersion.VersionData = pdfBlob;
        contentVersion.FirstPublishLocationId = order.Id; // Link to the Order record
        insert contentVersion;
    }
}