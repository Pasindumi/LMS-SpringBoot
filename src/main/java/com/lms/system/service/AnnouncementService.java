package com.lms.system.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.Query.Direction;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.cloud.FirestoreClient;
import com.lms.system.model.Announcement;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class AnnouncementService {

    private static final String COLLECTION_NAME = "announcements";

    public List<Announcement> getAllAnnouncements() {
        try {
            Firestore db = FirestoreClient.getFirestore();
            // Order by timestamp descending
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).orderBy("timestamp", Direction.DESCENDING).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            return documents.stream().map(doc -> doc.toObject(Announcement.class)).toList();
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public Announcement createAnnouncement(Announcement announcement) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            if (announcement.getId() == null) {
                announcement.setId(UUID.randomUUID().toString());
            }
            if (announcement.getTimestamp() == null) {
                announcement.setTimestamp(LocalDateTime.now());
            }
            
            ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME).document(announcement.getId()).set(announcement);
            future.get();
            return announcement;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create announcement", e);
        }
    }

    public void deleteAnnouncement(String id) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME).document(id).delete();
            future.get();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
