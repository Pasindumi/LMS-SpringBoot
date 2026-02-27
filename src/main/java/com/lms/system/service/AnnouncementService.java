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

import java.util.Date;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class AnnouncementService {

    private static final String COLLECTION_NAME = "announcements";

    public List<Announcement> getAllAnnouncements() {
        try {
            Firestore db = FirestoreClient.getFirestore();
            // Order by timestamp descending
            // Fetch all and sort in-memory to avoid index issues if needed, 
            // but for simple collection query it's fine. 
            // However, the user is getting index errors on courseId + timestamp.
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            return documents.stream()
                    .map(doc -> doc.toObject(Announcement.class))
                    .sorted(Comparator.comparing(Announcement::getTimestamp, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public List<Announcement> getAnnouncementsByCourseId(String courseId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("courseId", courseId)
                    .get();
            return future.get().getDocuments().stream()
                    .map(doc -> doc.toObject(Announcement.class))
                    .sorted(Comparator.comparing(Announcement::getTimestamp, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
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
                announcement.setTimestamp(new Date());
            }
            // Ensure courseId can be null if it is a general announcement
            
            ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME).document(announcement.getId()).set(announcement);
            future.get();
            return announcement;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create announcement", e);
        }
    }

    public List<Announcement> getAnnouncementsForStudent(List<String> enrolledCourseIds) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            // Fetch all and filter in-memory to avoid complex index requirements for multiple where/orderBy
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            
            return documents.stream()
                    .map(doc -> doc.toObject(Announcement.class))
                    .filter(a -> a.getCourseId() == null || enrolledCourseIds.contains(a.getCourseId()))
                    .sorted(Comparator.comparing(Announcement::getTimestamp, Comparator.nullsLast(Comparator.reverseOrder())))
                    .toList();
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public Announcement getAnnouncementById(String id) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            DocumentReference docRef = db.collection(COLLECTION_NAME).document(id);
            ApiFuture<com.google.cloud.firestore.DocumentSnapshot> future = docRef.get();
            com.google.cloud.firestore.DocumentSnapshot document = future.get();
            if (document.exists()) {
                return document.toObject(Announcement.class);
            }
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public void updateAnnouncement(String id, Announcement announcement) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME).document(id).set(announcement);
            future.get();
        } catch (Exception e) {
            throw new RuntimeException("Failed to update announcement", e);
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
