package com.lms.system.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.cloud.FirestoreClient;
import com.lms.system.model.Notification;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class NotificationService {

    private static final String COLLECTION_NAME = "notifications";

    public Notification createNotification(Notification notification) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            if (notification.getId() == null) {
                notification.setId(UUID.randomUUID().toString());
            }
            if (notification.getTimestamp() == null) {
                notification.setTimestamp(new Date());
            }
            notification.setRead(false);
            
            ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME).document(notification.getId()).set(notification);
            future.get();
            return notification;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create notification", e);
        }
    }

    public List<Notification> getNotificationsByUserId(String userId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("userId", userId)
                    .get();
            
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            return documents.stream()
                    .map(doc -> doc.toObject(Notification.class))
                    .sorted(Comparator.comparing(Notification::getTimestamp, Comparator.reverseOrder()))
                    .toList();
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public void markAsRead(String notificationId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME).document(notificationId).update("read", true);
            future.get();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
