/**
 * @description ; This method will handel all functionality of the LMS Course Module Popup.
 * @author       Shaon
 * @date         05-Feb-2025
 * @version      1.0
 */

public without sharing class LmsCreateCourseModulePopUpController {
    /**
     * @description : This method will return the header , page number & fields of course module
     * @param
     * @return Map of object
     */
    
    @AuraEnabled
    public static Map<String, Object> getCourseModuleFields(String recordId, String moduleType) {
        try {
            // -------------This will used to show the course associted with the course module.(name of the course)----------->
            String lookupCourse = 'Course__c';
            String recordName = '';
            
            if (String.isNotBlank(lookupCourse) && String.isNotBlank(recordId)) {
                String query = 'SELECT Name FROM ' + lookupCourse + ' WHERE Id = :recordId LIMIT 1';
                List<SObject> parentRecord = Database.query(query);
                if (!parentRecord.isEmpty()) {
                    SObject record = parentRecord[0];
                    recordName = (String) record.get('Name');
                    System.debug('lookup: ' + recordName);
                }
            }
            
            //----------------------------------------------------------------------------------------------------------------------->
            
            
            //----------------------------Fetch metadata to get course modules details(All records of metadata)----------------->
            List<LmsCourseModuleFieldManagement__mdt> metadataList = [
                 SELECT Fields__c, Header__c, Lookup_Object__c, Page_Number__c, Section_Type__c, Record_Type__c FROM LmsCourseModuleFieldManagement__mdt WHERE Record_Type__c = :moduleType OR Record_Type__c = NULL ORDER BY Page_Number__c ASC];
            
            if (metadataList.isEmpty()) {
                throw new AuraHandledException('No metadata found.');
            }
            //------------------------------------------------------------------------------------------------------------------>
            
            
            
            //-----------------------------------------object schema------------------------------------------------------------>
            String objectName = 'LMS_Course_Module__c';
            Schema.SObjectType sObjectType = Schema.getGlobalDescribe().get(objectName);
            if (sObjectType == null) {
                throw new AuraHandledException('LMS_Course_Module__c does not exist.');
            }
            
            Map<String, Schema.SObjectField> fieldMap = sObjectType.getDescribe().fields.getMap();
            System.debug('fieldMap@@@'+fieldMap);
            
            //----------------------------------------------------------------------------------------------------->
            
            
            //it holds field name and its type and details
            Map<String, Object> preprocessedFieldData = new Map<String, Object>();
            
            //this set wil contain fields which are present in metadata.
            Set<String> fieldsToShow = new Set<String>();
            
            for (LmsCourseModuleFieldManagement__mdt metadata : metadataList) {
                if (String.isNotBlank(metadata.Fields__c)) {
                    fieldsToShow.addAll(metadata.Fields__c.split(','));
                }
            }
            
            //loop through fields which are present in the metadata.
            for (String fieldName : fieldsToShow) {
                fieldName = fieldName.trim();
                if (fieldMap.containsKey(fieldName)) {
                    Schema.DescribeFieldResult fieldDescribe = fieldMap.get(fieldName).getDescribe();
                    Schema.DisplayType fieldType = fieldDescribe.getType();
                    
                    //store metadata of a filed;
                    Map<String, Object> fieldInfo = new Map<String, Object> {
                        'label' => fieldDescribe.getLabel(),
                        'type' => fieldType.name(),
                        'required' => !fieldDescribe.isNillable() && !fieldDescribe.isDefaultedOnCreate()
                    };
                    
                    // Handle lookup fields
                    if (fieldType == Schema.DisplayType.REFERENCE) {
                        fieldInfo.put('defaultValue', recordName);
                    }
                    
                    // Handle picklist fields
                    if (fieldType == Schema.DisplayType.PICKLIST || fieldType == Schema.DisplayType.MULTIPICKLIST) {
                        List<Schema.PicklistEntry> picklistEntries = fieldDescribe.getPicklistValues();
                        List<String> options = new List<String>();
                        for (Schema.PicklistEntry picklistEntry : picklistEntries) {
                            options.add(picklistEntry.getLabel());
                        }
                        fieldInfo.put('options', options);
                    }
                    
                    preprocessedFieldData.put(fieldName, fieldInfo);
                }
            }
            
            // Process metadata and build response in a single loop
            Map<String, Object> response = new Map<String, Object>();
            
            
            // adding addition data Page number & header & section typr
            for (LmsCourseModuleFieldManagement__mdt metadata : metadataList) {
                String pageKey = 'page' + metadata.Page_Number__c;
                
                if (!response.containsKey(pageKey)) {
                    response.put(pageKey, new Map<String, Object> {
                        'sectionType' => metadata.Section_Type__c,
                        'header' => metadata.Header__c,
                        'fields' => new Map<String, Object>()
                    });
                }
                
                Map<String, Object> pageDetails = (Map<String, Object>) response.get(pageKey);
                Map<String, Object> fields = (Map<String, Object>) pageDetails.get('fields');
                
                if (String.isNotBlank(metadata.Fields__c)) {
                    for (String fieldName : metadata.Fields__c.split(',')) {
                        fieldName = fieldName.trim();
                        if (preprocessedFieldData.containsKey(fieldName)) {
                            fields.put(fieldName, preprocessedFieldData.get(fieldName));
                        }
                    }
                }
            }
            System.debug('response@@@@@@@@@@@@@@@'+response);
            return response;
        } catch (Exception ex) {
            throw new AuraHandledException('Error: ' + ex.getMessage());
        }
    }
    
    
}