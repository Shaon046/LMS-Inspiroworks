public with sharing class LmsRecordCreatePopupController {

    @AuraEnabled
    public static Map<String, Map<String, Object>> getFields(String objectName) {
        try {

            // get the field comma separeated list from metadata 
            String fieldList = [SELECT Fields_API_Name__c,DeveloperName from lmsFieldManagement__mdt WHERE DeveloperName =: 'Course'].Fields_API_Name__c;
            List<String> fieldArray = fieldList.split(',');
            System.debug('field list@@@@@@@@@@@@@@'+ fieldArray[3]);

            Map<String, Map<String, Object>> fieldMetadata = new Map<String, Map<String, Object>>();

            Map<String, Schema.SObjectType> globalDescribeMap = Schema.getGlobalDescribe();
            Schema.SObjectType sObjectType = globalDescribeMap.get('Course__c');
            
            Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();
            Map<String, Schema.SObjectField> fieldMap = describeResult.fields.getMap();
            
            for (String fieldName : fieldArray) {
              System.debug('fieldName@@@'+fieldName);
                Schema.SObjectField sField = fieldMap.get(fieldName);
                
                if (sField != null) {
                    Map<String, Object> fieldInfo = new Map<String, Object>();
                    
                    // Get field label
                    String fieldLabel = sField.getDescribe().getLabel();
                    fieldInfo.put('label', fieldLabel);
                    
                    // Get field type
                    Schema.DisplayType fieldType = sField.getDescribe().getType();
                    fieldInfo.put('type', fieldType.name());
                    
                    //picklist type 
                    if (fieldType == Schema.DisplayType.PICKLIST || fieldType == Schema.DisplayType.MULTIPICKLIST) {
                        List<Schema.PicklistEntry> picklistEntries = sField.getDescribe().getPicklistValues();
                        List<String> options = new List<String>();
                        for (Schema.PicklistEntry picklistEntry : picklistEntries) {
                            options.add(picklistEntry.getLabel());
                        }
                        fieldInfo.put('options', options);
                    }
                    //file type fields
                    if (fieldType == Schema.DisplayType.REFERENCE) {
                        fieldInfo.put('type', 'file');
                    }

                    // Add the field info to the final map with field API name as the key
                    fieldMetadata.put(fieldName, fieldInfo);
                }
            }
            System.debug(fieldMetadata);
            return fieldMetadata;
        } catch(Exception ex) {
            throw new AuraHandledException(ex.getMessage());
        }
    }
    
    @AuraEnabled
    public static Map<String, String> saveRecord(String objectName,Map<String, String> userInput){
        try {
            
            Schema.SObjectType objType = Schema.getGlobalDescribe().get(objectName);
            if (objType != null) {
                SObject newRecord = objType.newSObject();
                
                for(String field: userInput.keySet()){
                    newRecord.put(field, userInput.get(field));
                    
                    System.debug('field: ' + field +'userInput' + userInput.get(field));
                }
                insert newRecord;
            }
            
            return userInput;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

}