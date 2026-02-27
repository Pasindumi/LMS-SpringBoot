package com.lms.system.service;

import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QuerySnapshot;
import com.google.cloud.firestore.WriteResult;
import com.google.firebase.cloud.FirestoreClient;
import com.lms.system.model.TaskSubmission;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Service
public class TaskSubmissionService {

    private static final String COLLECTION_NAME = "task_submissions";

    public TaskSubmission submitTask(TaskSubmission submission) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            if (submission.getId() == null) {
                // Check if user already submitted for this task
                TaskSubmission existing = getSubmissionByStudentAndTask(submission.getStudentId(), submission.getTaskId());
                if (existing != null) {
                    submission.setId(existing.getId());
                } else {
                    submission.setId(UUID.randomUUID().toString());
                }
            }
            submission.setSubmittedAt(new Date());
            
            ApiFuture<WriteResult> future = db.collection(COLLECTION_NAME).document(submission.getId()).set(submission);
            future.get();
            return submission;
        } catch (Exception e) {
            throw new RuntimeException("Failed to submit task", e);
        }
    }

    public TaskSubmission getSubmissionByStudentAndTask(String studentId, String taskId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("studentId", studentId)
                    .whereEqualTo("taskId", taskId)
                    .get();
            
            List<TaskSubmission> submissions = future.get().toObjects(TaskSubmission.class);
            return submissions.isEmpty() ? null : submissions.get(0);
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    public List<TaskSubmission> getSubmissionsByTaskId(String taskId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("taskId", taskId)
                    .get();
            
            return future.get().toObjects(TaskSubmission.class);
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
    
    public List<TaskSubmission> getSubmissionsByStudentId(String studentId) {
        try {
            Firestore db = FirestoreClient.getFirestore();
            ApiFuture<QuerySnapshot> future = db.collection(COLLECTION_NAME)
                    .whereEqualTo("studentId", studentId)
                    .get();
            
            return future.get().toObjects(TaskSubmission.class);
        } catch (Exception e) {
            e.printStackTrace();
            return new ArrayList<>();
        }
    }
}
