package com.mindmate.backend.repository;

import com.mindmate.backend.domain.Task;
import com.mindmate.backend.domain.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TaskRepository extends JpaRepository<Task, String> {

    long countByStatus(TaskStatus status);
}
