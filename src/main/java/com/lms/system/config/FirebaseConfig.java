package com.lms.system.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.DefaultResourceLoader;
import org.springframework.core.io.Resource;

import java.io.IOException;
import java.io.InputStream;

@Configuration
public class FirebaseConfig {

    @Value("${firebase.service-account-path}")
    private String serviceAccountPath;

    @Bean
    public FirebaseApp firebaseApp() {
        try {
            // Check if app already exists to avoid errors on reload
            if (FirebaseApp.getApps().isEmpty()) {
                // User requested specific loading method
                try (java.io.FileInputStream serviceAccount = new java.io.FileInputStream("src/main/resources/service-account.json")) {
                    GoogleCredentials credentials = GoogleCredentials.fromStream(serviceAccount);
                    FirebaseOptions.Builder optionsBuilder = new FirebaseOptions.Builder()
                            .setCredentials(credentials);

                    if (credentials instanceof com.google.auth.oauth2.ServiceAccountCredentials) {
                        String projectId = ((com.google.auth.oauth2.ServiceAccountCredentials) credentials).getProjectId();
                        if (projectId != null) {
                            optionsBuilder.setProjectId(projectId);
                        }
                    }

                    FirebaseOptions options = optionsBuilder.build();
                    FirebaseApp app = FirebaseApp.initializeApp(options);
                    System.out.println("Firebase successfully initialized for project: " + app.getOptions().getProjectId());
                    return app;
                }
            }
            return FirebaseApp.getInstance();
        } catch (IOException e) {
            System.err.println("CRITICAL: Failed to load Firebase service account key!");
            System.err.println("Path attempted: " + serviceAccountPath);
            e.printStackTrace();
            return null;
        } catch (Exception e) {
            System.err.println("CRITICAL: Unexpected error during Firebase initialization!");
            e.printStackTrace();
            return null;
        }
    }
}
