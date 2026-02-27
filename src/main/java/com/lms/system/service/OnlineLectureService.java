package com.lms.system.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import com.lms.system.model.Course;
import com.lms.system.model.Notification;
import com.lms.system.model.OnlineLecture;
import com.lms.system.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class OnlineLectureService {

    private static final String COLLECTION_NAME = "online_lectures";

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private CourseService courseService;

    public OnlineLecture scheduleLecture(OnlineLecture lecture) {
        Firestore db = FirestoreClient.getFirestore();
        if (lecture.getId() == null) {
            lecture.setId(UUID.randomUUID().toString());
        }
        db.collection(COLLECTION_NAME).document(lecture.getId()).set(lecture);

        // Notify related users
        try {
            notifyUsersAboutLecture(lecture);
        } catch (Exception e) {
            e.printStackTrace(); // Don't fail the whole operation if notifications fail
        }
        
        return lecture;
    }

    private void notifyUsersAboutLecture(OnlineLecture lecture) {
        if (lecture.getModuleId() == null) return;

        Course course = courseService.getCourseById(lecture.getModuleId());
        if (course == null) return;

        String title = "New Online Lecture Scheduled";
        String message = String.format("A new online lecture for '%s' has been scheduled on %s.", 
                course.getTitle(), lecture.getDateTime() != null ? lecture.getDateTime().toString() : "TBA");
        
        // 1. Notify Lecturer
        if (course.getLecturerId() != null) {
            sendNotification(course.getLecturerId(), title, message);
        }

        // 2. Notify Enrolled Students
        if (course.getStudentIds() != null) {
            for (String studentId : course.getStudentIds()) {
                sendNotification(studentId, title, message);
            }
        }
    }

    private void sendNotification(String userId, String title, String message) {
        com.lms.system.model.Notification notification = new com.lms.system.model.Notification();
        notification.setUserId(userId);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType("LECTURE");
        notificationService.createNotification(notification);
    }

    public List<OnlineLecture> getAllLectures() throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<OnlineLecture> lectures = new ArrayList<>();
        for (DocumentSnapshot document : documents) {
            lectures.add(document.toObject(OnlineLecture.class));
        }
        return lectures;
    }

    public List<OnlineLecture> getLecturesByDegree(String degreeId) throws ExecutionException, InterruptedException {
        Firestore db = FirestoreClient.getFirestore();
        ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).whereEqualTo("degreeId", degreeId).get();
        List<QueryDocumentSnapshot> documents = future.get().getDocuments();
        List<OnlineLecture> lectures = new ArrayList<>();
        for (DocumentSnapshot document : documents) {
            lectures.add(document.toObject(OnlineLecture.class));
        }
        return lectures;
    }

    public void deleteLecture(String id) {
        Firestore db = FirestoreClient.getFirestore();
        db.collection(COLLECTION_NAME).document(id).delete();
    }
}
