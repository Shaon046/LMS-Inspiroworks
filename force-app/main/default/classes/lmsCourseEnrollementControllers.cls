public without sharing class lmsCourseEnrollementControllers {
    public static string orderProductMeassae ='Your course is not added into product';
    public static string enrollementErrorMessage ='You have already enrolled for this course.';
    @AuraEnabled
    public static String createLMSCourseEnrolment(List<String> courseId){
        if (courseId == null || courseId.isEmpty()) {
            return 'No courses selected.';
        }
        system.debug('courseId5==>'+courseId);
        List<LMS_Course_Enrolment__c> checkEnrollemnetList = new List<LMS_Course_Enrolment__c>();
        List<LMS_Course_Enrolment__c> enrollemnetList = new List<LMS_Course_Enrolment__c>();
        User currentUser = [SELECT Id,Name,AccountId,ContactId FROM User WHERE Id = :userInfo.getUserId() LIMIT 1];
        system.debug('currentUser7==>'+currentUser);
        system.debug('currentUser12==>'+currentUser.ContactId);
        
        List<Course__c> courseList = [SELECT Id, Name, Course_Type__c, Title__c, Credits_Points__c FROM Course__c WHERE Id IN:courseId];
        
        checkEnrollemnetList = [SELECT Id FROM LMS_Course_Enrolment__c where User__c =:currentUser.Id AND  Course_Title__c IN :courseId];
        
        if(!checkEnrollemnetList.isEmpty()){
            return enrollementErrorMessage;
        }
        
        for(Course__c course:courseList){
            enrollemnetList.add(new LMS_Course_Enrolment__c(
                User__c = currentUser.Id,
                Date_Registered__c = System.today(),
                Status__c = 'Registered',
                Course_Title__c = course.Id, 
                Credits__c = course.Credits_Points__c,
                Participant__c = currentUser.ContactId !=null ? currentUser.ContactId : null
            ));
            system.debug('enrollemnetList25==>'+enrollemnetList);
        }
        
        
        if(!enrollemnetList.isEmpty()){
            insert enrollemnetList;
            system.debug('enrollemnetList28==>'+enrollemnetList);
            createLMSCourseParticipant(courseList,currentUser.ContactId,currentUser.Id);
            createLMSCourseParticipantModule(courseList,currentUser.Id);
            if(currentUser.AccountId !=null){
                createOrderWithOrderItem(courseList,currentUser.AccountId); 
            }
            return 'Succes';
        }
        return 'Failed';
        
    }
    
    private static void createLMSCourseParticipant(List<Course__c> courseList,Id contactId,Id userId){
        if (courseList.isEmpty()) {
            return;
        }
        system.debug('courseList34==>'+courseList);        
        List<LMS_Course_Participant__c> lMSCourse_ParticipantList = new List<LMS_Course_Participant__c>();
        
        for(Course__c course:courseList){
            lMSCourse_ParticipantList.add(new LMS_Course_Participant__c(
                Course__c = course.Id,
                All_Quiz_Completed__c = false,
                User__c = userId,
                Participant__c = contactId !=null ? contactId : null
            ));
        }
        
        if(!lMSCourse_ParticipantList.isEmpty()){
            insert lMSCourse_ParticipantList;
            
        }
    }
    
    
    private static void createLMSCourseParticipantModule(List<Course__c> courseList,Id userId){
        if (courseList.isEmpty()) {
            return;
        }
        
        system.debug('createLMSCourseParticipantModule called');
        system.debug('course57==>'+courseList);
        List<LMS_Course_Participant_Module__c> lmsCourseParticipantModuleList = new List<LMS_Course_Participant_Module__c>();
        List<LMS_Course_Module__c> lmsCourseModuleList = new List<LMS_Course_Module__c>();
        
        lmsCourseModuleList = [SELECT Id,LMS_Course__c,Quiz_Question_1__c,Quiz_Question_2__c,Quiz_Question_3__c,
                               Quiz_Question_4__c,Quiz_Question_5__c,Designated_passing_Grade__c,Quiz_Header__c,
                               Unit_Group__c,iSpring_HTML_File_Link__c,Unit_Description__c,Name
                               FROM LMS_Course_Module__c WHERE LMS_Course__c IN:courseList];
        system.debug('lmsCourseModuleList67==>'+lmsCourseModuleList);
        
        Map<Id, Id> courseToParticipantMap = new Map<Id, Id>();
        for (LMS_Course_Participant__c participant : [SELECT Id, Course__c FROM LMS_Course_Participant__c WHERE Course__c IN :courseList]) {
            courseToParticipantMap.put(participant.Course__c, participant.Id);
        }
        
        
        if(lmsCourseModuleList.isEmpty()){return ;}
        
        for (LMS_Course_Module__c module : lmsCourseModuleList) {
            Id participantId = courseToParticipantMap.get(module.LMS_Course__c);
            if (participantId != null) {
                
                lmsCourseParticipantModuleList.add(new LMS_Course_Participant_Module__c(
                    LMS_Course_Module__c = module.Id,
                    Quiz_Question_1__c = module.Quiz_Question_1__c,
                    Quiz_Question_2__c = module.Quiz_Question_2__c,
                    Quiz_Question_3__c = module.Quiz_Question_3__c,
                    Quiz_Question_4__c = module.Quiz_Question_4__c,
                    Quiz_Question_5__c = module.Quiz_Question_5__c,
                    Designated_passing_Grade__c = module.Designated_passing_Grade__c,
                    LMS_Course_Participant__c = participantId,
                    Status_of_Course_Modules__c	= 'Not Started',
                    Quiz_Header__c = module.Quiz_Header__c,
                    Unit_Group__c =module.Unit_Group__c,
                    iSpring_HTML_File_Link__c  = module.iSpring_HTML_File_Link__c,
                    Unit_Description__c = module.Unit_Description__c,
                    Course_Module_Name__c = module.Name
                    
                    
                ));
            }
        }
        
        if(!lmsCourseParticipantModuleList.isEmpty()){
            insert lmsCourseParticipantModuleList;
        }
    }
    
    
    
    private static string createOrderWithOrderItem(List<Course__c> courseList, Id accountId) {
        Map<Id,Order> mapOfCourseWithOrder = new Map<Id,Order>();
        Map<Id,PricebookEntry> mapOfCourseWithPricebookEntry = new Map<Id,PricebookEntry>();
        List<Product2> existingProductList = [SELECT Id,name, Course__c FROM Product2 WHERE Course__c IN:courseList];
        if(existingProductList.isEmpty()){
            return orderProductMeassae;
        }
        
        Product2 existingProduct = existingProductList[0];
        System.debug('existingProduct101==>' + existingProduct);
        List<PricebookEntry> standardPBEntrie = [SELECT Id,Name, Product2Id, Pricebook2Id, UnitPrice FROM PricebookEntry WHERE Product2Id =:existingProductList];
        System.debug('standardPBEntrie103==>' + standardPBEntrie);
        for(PricebookEntry pe:standardPBEntrie){
            mapOfCourseWithPricebookEntry.put(pe.Product2Id,pe);
        }
        Pricebook2 existingPricebook = [SELECT Id, Name FROM Pricebook2 WHERE Name = 'Standard Price Book'  LIMIT 1];  
        System.debug('existingPricebook105==>' + existingPricebook);
        
        List<OrderItem> orderItemList = new List<OrderItem>();
        List<Order> orderList = new List<Order>();
        
        // Create Order
        for(Product2 product:existingProductList){
            Order ord = new Order();
            ord.AccountId = accountId;
            ord.Status = 'Purchased';
            ord.EffectiveDate = System.today();
            ord.Pricebook2Id = existingPricebook.Id;
            orderList.add(ord);
            mapOfCourseWithOrder.put(product.Id,ord);
        }
        
        if(!orderList.isEmpty()){
            insert orderList;
        }
        
        for (Product2 product : existingProductList) {
            Order order = mapOfCourseWithOrder.get(product.Id);
            PricebookEntry pe = mapOfCourseWithPricebookEntry.get(product.Id);
            system.debug('order169==>'+pe);
            system.debug('pe170==>'+pe);
            OrderItem ordItem = new OrderItem();
            ordItem.OrderId = order.Id;
            ordItem.PricebookEntryId = pe.Id;
            ordItem.Quantity = 1;
            ordItem.UnitPrice = pe.UnitPrice; // Ensure UnitPrice is set
            ordItem.Course__c = product.Course__c;
            orderItemList.add(ordItem);  
        }
        
        
        if(!orderItemList.isEmpty()){
            insert orderItemList;
            system.debug('orderItemList183==>'+orderItemList);
            createOpportunityAndOpportunityLineItem(courseList, orderItemList);
            return 'Success';
        }
        return 'Failed';
        
    }
    
    public static void createOpportunityAndOpportunityLineItem(List<Course__c> courseList, List<orderItem> orderItemList) {
        if (courseList.isEmpty() || orderItemList.isEmpty()) {
            return;
        }
        
        List<Opportunity> oppsList = new List<Opportunity>();
        List<OpportunityLineItem> oppsLineItemList = new List<OpportunityLineItem>();
        
        Map<Id, Opportunity> orderItemToOpportunityMap = new Map<Id, Opportunity>();
        
        // Create Opportunities for each OrderItem
        for (OrderItem ot : orderItemList) {
            Opportunity newOpportunity = new Opportunity(
                StageName = 'Closed Won', // Replace with the appropriate stage
                Name = 'Opportunity Related to ' +'Order',
                CloseDate = System.today().addDays(30),
                Amount = ot.course__r.Credits_Points__c
            );
            oppsList.add(newOpportunity);
            system.debug('oppsList209==>'+oppsList);
            orderItemToOpportunityMap.put(ot.Id, newOpportunity);
        }
        
        if (!oppsList.isEmpty()) {
            insert oppsList;
        }
        
        // Add OpportunityLineItems for each OrderItem and its related Opportunity
        for (OrderItem ot : orderItemList) {
            Opportunity relatedOpportunity = orderItemToOpportunityMap.get(ot.Id);
            if (relatedOpportunity != null) {
                oppsLineItemList.add(new OpportunityLineItem(
                    OpportunityId = relatedOpportunity.Id,
                    PricebookEntryId = ot.PricebookEntryId, 
                    UnitPrice = relatedOpportunity.Amount, 
                    Quantity = 1,
                    Course__c = ot.course__c,
                    TotalPrice = 100
                ));
            }
        }
        
        if (!oppsLineItemList.isEmpty()) {
            insert oppsLineItemList;
            system.debug('oppsLineItemList234==>'+oppsLineItemList);
        }
    }
    
}