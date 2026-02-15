package com.lms.system;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.auth.oauth2.AccessToken;
import java.io.FileInputStream;
import java.util.Collections;

public class FirebaseConnectivityTest {
    public static void main(String[] args) {
        try {
            System.out.println("1. Starting Connectivity Test...");
            
            // 1. Load the file
            String filePath = "src/main/resources/service-account.json";
            System.out.println("2. Loading file from: " + filePath);
            FileInputStream serviceAccount = new FileInputStream(filePath);
            
            // 2. Create Credentials
            System.out.println("3. Creating GoogleCredentials...");
            GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount)
                .createScoped(Collections.singleton("https://www.googleapis.com/auth/cloud-platform"));
            
            // 3. Refresh Access Token (This is where 'Metadata' errors usually happen)
            System.out.println("4. Attempting to fetch Access Token from Google...");
            credentials.refreshIfExpired();
            AccessToken token = credentials.getAccessToken();
            
            System.out.println("SUCCESS! Access Token retrieved.");
            System.out.println("Token expires at: " + token.getExpirationTime());
            
        } catch (Exception e) {
            System.err.println("FAILURE!");
            e.printStackTrace();
        }
    }
}
