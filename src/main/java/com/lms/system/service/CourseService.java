package com.lms.system.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.cloud.FirestoreClient;
import com.lms.system.model.Course;
import org.springframework.stereotype.Service;

import java.util.UUID;
import java.util.List;
import java.util.ArrayList;
import java.util.concurrent.ExecutionException;

@Service
public class CourseService {

    private static final String COLLECTION_NAME = "courses";

    public List<Course> getAllCourses() {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME).get();
            List<QueryDocumentSnapshot> documents = future.get().getDocuments();
            return documents.stream().map(doc -> doc.toObject(Course.class)).toList();
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public Course createCourse(Course course) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            if (course.getCourseId() == null) {
                course.setCourseId(UUID.randomUUID().toString());
            }
            ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME).document(course.getCourseId()).set(course);
            future.get();
            return course;
        } catch (Exception e) {
            throw new RuntimeException("Failed to create course", e);
        }
    }

    public Course getCourseById(String courseId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<DocumentSnapshot> future = db.collection(COLLECTION_NAME).document(courseId).get();
            DocumentSnapshot document = future.get();
            if (document.exists()) {
                return document.toObject(Course.class);
            }
            return null;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public Course updateCourse(Course course) {
        return createCourse(course); // set() handles update/create
    }

    public List<Course> getEnrolledCourses(String studentId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereArrayContains("studentIds", studentId)
                    .get();
            return future.get().getDocuments().stream().map(doc -> doc.toObject(Course.class)).toList();
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }

    public void deleteCourse(String courseId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME).document(courseId).delete();
            future.get();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
