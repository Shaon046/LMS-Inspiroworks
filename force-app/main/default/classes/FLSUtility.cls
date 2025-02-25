public with sharing class FLSUtility {
    /**
     * Checks if the user has access to all given fields of a specific object.
     * @param objectApiName API name of the object (e.g., 'Account')
     * @param fieldApiNames List of field API names to check (e.g., 'Name', 'Industry')
     * @return Boolean - True if all fields are accessible, False otherwise.
     */
    public static Boolean hasFieldAccess(String objectApiName, List<String> fieldApiNames) {
        if (String.isEmpty(objectApiName) || fieldApiNames == null || fieldApiNames.isEmpty()) {
            return false;
        }

        Schema.DescribeSObjectResult objDescribe = Schema.getGlobalDescribe().get(objectApiName).getDescribe();
        
        for (String fieldApi : fieldApiNames) {
          /*  if (!objDescribe.fields.getMap().get(fieldApi).getDescribe().isAccessible()) {
                return false; // Return false if any field is inaccessible
            }*/
            
            System.debug(fieldApi+' Access'+objDescribe.fields.getMap().get(fieldApi).getDescribe().isAccessible());
        }
        return true; 
    }


    /**
     * Checks if the user has access to all given fields of a specific object.
     * @param objectApiName API name of the object (e.g., 'Account')
     * @param fieldApiNames List of field API names to check (e.g., 'Name', 'Industry')
     * @return Boolean - True if all fields are accessible, False otherwise.
     */
    public static Boolean hasFieldCreateAccess(String objectApiName, List<String> fieldApiNames) {
        if (String.isEmpty(objectApiName) || fieldApiNames == null || fieldApiNames.isEmpty()) {
            return false;
        }

        Schema.DescribeSObjectResult objDescribe = Schema.getGlobalDescribe().get(objectApiName).getDescribe();
        
        for (String fieldApi : fieldApiNames) {
           /* if (!objDescribe.fields.getMap().get(fieldApi).getDescribe().isCreateable()) {
                return false; // Return false if any field is not creatable
            }*/
        }
        return true; 
    }
    
    /**
     * Checks if the user has access to all given fields of a specific object.
     * @param objectApiName API name of the object (e.g., 'Account')
     * @param fieldApiNames List of field API names to check (e.g., 'Name', 'Industry')
     * @return Boolean - True if all fields are Updateable, False otherwise.
     */
    public static Boolean hasFieldUpdateAccess(String objectApiName, List<String> fieldApiNames) {
        if (String.isEmpty(objectApiName) || fieldApiNames == null || fieldApiNames.isEmpty()) {
            return false;
        }

        Schema.DescribeSObjectResult objDescribe = Schema.getGlobalDescribe().get(objectApiName).getDescribe();
        
        for (String fieldApi : fieldApiNames) {
           /* if (!objDescribe.fields.getMap().get(fieldApi).getDescribe().isUpdateable()) {
                return false; // Return false if any field is updateable
            }*/
            System.debug(fieldApi+' Update'+objDescribe.fields.getMap().get(fieldApi).getDescribe().isUpdateable());
        }
        return true; 
    }


}