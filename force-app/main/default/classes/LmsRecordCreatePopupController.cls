/**
 * @description  This class handles the creation custom popup for record creation.
 * @author       Shaon Bhattacharjee
 * @date         13-Jan-2025
 * @version      1.0
 */


public with sharing class LmsRecordCreatePopupController {

    /**
 * @description  This method will return the fields needed to create record in popup box.
 * @param        String objectName, String customMetadataName, String recordId, Boolean Attachment
 * @return       Map of object.
 */

 @AuraEnabled
 public static Map<String, Map<String, Object>> getFields(String objectName, String customMetadataName, String recordId, Boolean Attachment) {
     try {
         lmsFieldManagement__mdt metadataRecord = [SELECT Fields_API_Name__c, DeveloperName, Lookup_Field__c FROM lmsFieldManagement__mdt WHERE DeveloperName = :customMetadataName LIMIT 1];
 
         if (metadataRecord == null) {
             throw new AuraHandledException('Metadata record not found for ' + customMetadataName);
         }
 
         // Get the values from the metadataRecord
         String fieldList = metadataRecord.Fields_API_Name__c;
         String lookupField = metadataRecord.Lookup_Field__c;
 
         // Get the lookup recordName
         String recordName;
         if (String.isNotBlank(lookupField)) {
             String query = 'SELECT Name FROM ' + lookupField + ' WHERE Id = :recordId LIMIT 1';
             List<SObject> parentRecord = Database.query(query);
             if (!parentRecord.isEmpty()) {
                 SObject record = parentRecord[0];
                 recordName = (String) record.get('Name');
                 System.debug('lookup: ' + recordName);
             }
         }
 
         Map<String, Map<String, Object>> fieldMetadata = new Map<String, Map<String, Object>>();
 
         // FieldList string to List of fields
         List<String> fieldArray = fieldList.split(',');
 
         // Create a Set for required fields
         Set<String> requiredFieldSet = new Set<String>();
 
         // Object schema
         Map<String, Schema.SObjectType> globalDescribeMap = Schema.getGlobalDescribe();
         Schema.SObjectType sObjectType = globalDescribeMap.get(objectName);
 
         if (sObjectType == null) {
             throw new AuraHandledException('SObject ' + objectName + ' does not exist.');
         }
 
         // SObject description
         Schema.DescribeSObjectResult describeResult = sObjectType.getDescribe();
         Map<String, Schema.SObjectField> fieldMap = describeResult.fields.getMap();
 
         // Add metadata fields first, maintaining the order
         for (String fieldName : fieldArray) {
             System.debug('Processing field from metadata: ' + fieldName);
 
             if (!fieldMap.containsKey(fieldName)) {
                 System.debug('Field ' + fieldName + ' does not exist in ' + objectName);
                 continue;
             }

             Schema.SObjectField sField = fieldMap.get(fieldName);
             if (sField != null) {
                 Map<String, Object> fieldInfo = new Map<String, Object>();
 
                     // Skip AutoNumber fields
                     Schema.DescribeFieldResult fieldDescribe = sField.getDescribe();
                     if (fieldDescribe.isAutoNumber()) {
                         continue;
                     }
                 // Get field label
                 String fieldLabel = sField.getDescribe().getLabel();
                 fieldInfo.put('label', fieldLabel);
 
                 // Determine if the field is required
                 Boolean required = (fieldName == 'Name') || (!sField.getDescribe().isNillable() && !sField.getDescribe().isDefaultedOnCreate());
                 fieldInfo.put('required', required);
 
                 // Add required fields to the set
                 if (required) {
                     requiredFieldSet.add(fieldName);
                 }
 
                 // Get field type
                 Schema.DisplayType fieldType = sField.getDescribe().getType();
                 fieldInfo.put('type', fieldType.name());
 
                 // Handle picklist fields
                 if (fieldType == Schema.DisplayType.PICKLIST || fieldType == Schema.DisplayType.MULTIPICKLIST) {
                     List<Schema.PicklistEntry> picklistEntries = sField.getDescribe().getPicklistValues();
                     List<String> options = new List<String>();
                     for (Schema.PicklistEntry picklistEntry : picklistEntries) {
                         options.add(picklistEntry.getLabel());
                     }
                     fieldInfo.put('options', options);
                 }
 
                 // Handle lookup
                 if (fieldType == Schema.DisplayType.REFERENCE) {
                     if (String.isNotEmpty(recordId)) {
                         fieldInfo.put('defaultValue', recordName);
                     }
                     fieldInfo.put('type', 'REFERENCE');
                 }
 
                 fieldMetadata.put(fieldName, fieldInfo);
             }
         }
 
         // Check for additional required fields not mentioned in metadata
         for (Schema.SObjectField field : fieldMap.values()) {
             Schema.DescribeFieldResult fieldDescribe = field.getDescribe();
 
             // Only consider accessible fields
             if (!fieldDescribe.isAccessible()) {
                 continue;
             }
                // Skip auto number fields
             if (fieldDescribe.isAutoNumber()) {
                continue;
            }
             String fieldName = fieldDescribe.getName();
             Boolean isRequired = (fieldName == 'Name') || (!fieldDescribe.isNillable() && !fieldDescribe.isDefaultedOnCreate());
 
             if (isRequired && !requiredFieldSet.contains(fieldName)) {
                 System.debug('Adding required field not in metadata: ' + fieldName);
 
                 Map<String, Object> fieldInfo = new Map<String, Object>();
                 fieldInfo.put('label', fieldDescribe.getLabel());
                 fieldInfo.put('required', true);
                 fieldInfo.put('type', fieldDescribe.getType().name());
 
                 fieldMetadata.put(fieldName, fieldInfo);
             }
         }
 
         // If Attachment flag is true, add an image upload field
         if (Attachment == true) {
             Map<String, Object> imageFieldInfo = new Map<String, Object>();
             imageFieldInfo.put('label', 'Upload Image');
             imageFieldInfo.put('type', 'file');
             imageFieldInfo.put('related', true);
             fieldMetadata.put('Upload Image', imageFieldInfo);
         }
 
         System.debug('Field metadata: ' + fieldMetadata);
         return fieldMetadata;
 
     } catch (Exception ex) {
         throw new AuraHandledException('Error: ' + ex.getMessage());
     }
 }
 
    

        /**
 * @description  This method will create a record from the user input.
 * @param        String objectName, Map<String, String> userInput, String base64ImageData
 * @return       String (message).
 */
    
    @AuraEnabled
    public static void saveRecord(String objectName, Map<String, String> userInput, String base64ImageData, String fileExtension) {
        try {
            
            Schema.SObjectType objType = Schema.getGlobalDescribe().get(objectName);
            if (objType != null) {
                SObject newRecord = objType.newSObject();
                Map<String, Schema.SObjectField> fieldsMap = objType.getDescribe().fields.getMap();
                
                for (String field : userInput.keySet()) {
                    if (fieldsMap.containsKey(field)) {
                        Schema.SObjectField sField = fieldsMap.get(field);
                        Schema.DescribeFieldResult fieldDescribe = sField.getDescribe();
                        String fieldType = fieldDescribe.getType().name();
                        
                        System.debug('Processing field: ' + field + ' of type: ' + fieldType);
                        
                        // Handle different field types
                        if (fieldType == 'Decimal' || fieldType == 'Currency' || fieldType == 'Double') {
                            try {
                                Decimal decimalValue = Decimal.valueOf(userInput.get(field));
                                newRecord.put(field, decimalValue);
                            } catch (Exception e) {
                                System.debug('Error converting to Decimal for field ' + field + ': ' + e.getMessage());
                            }
                        } else if (fieldType == 'Integer' || fieldType == 'Long') {
                            try {
                                Integer intValue = Integer.valueOf(userInput.get(field));
                                newRecord.put(field, intValue);
                            } catch (Exception e) {
                                System.debug('Error converting to Integer for field ' + field + ': ' + e.getMessage());
                            }
                        } else if (fieldType == 'String') {
                            newRecord.put(field, userInput.get(field));
                        } else if (fieldType == 'Date') {
                            try {
                                Date dateValue = Date.valueOf(userInput.get(field));
                                newRecord.put(field, dateValue);
                            } catch (Exception e) {
                                System.debug('Error converting to Date for field ' + field + ': ' + e.getMessage());
                            }
                        } else if (fieldType == 'Boolean') {
                            try {
                                Boolean boolValue = Boolean.valueOf(userInput.get(field));
                                newRecord.put(field, boolValue);
                            } catch (Exception e) {
                                System.debug('Error converting to Boolean for field ' + field + ': ' + e.getMessage());
                            }
                        } else if (fieldType == 'DateTime') {
                            try {
                                DateTime dateTimeValue = DateTime.valueOf(userInput.get(field));
                                newRecord.put(field, dateTimeValue);
                            } catch (Exception e) {
                                System.debug('Error converting to DateTime for field ' + field + ': ' + e.getMessage());
                            }
                        } else {
                            // For any other field types, assign the String value directly
                            newRecord.put(field, userInput.get(field));
                        }
                    } else {
                        System.debug('Field not found in the object schema: ' + field);
                    }
                }
                insert newRecord;
                if(!String.isBlank(fileExtension) && !String.isBlank(base64ImageData)){
                    String fileName = newRecord.Id +'.'+fileExtension;
                    LMSExternaluserProfileController.uploadFile(base64ImageData, fileName, newRecord.Id);

                }
                
            }
            
        } catch (Exception e) {
            throw new AuraHandledException('Error: ' + e.getMessage());
        }
    }
    
}