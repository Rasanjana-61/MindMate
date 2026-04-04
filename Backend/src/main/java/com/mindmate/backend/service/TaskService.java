package com.mindmate.backend.service;

import com.mindmate.backend.domain.Priority;
import com.mindmate.backend.domain.Task;
import com.mindmate.backend.domain.TaskStatus;
import com.mindmate.backend.dto.TaskRequest;
import com.mindmate.backend.dto.TaskResponse;
import com.mindmate.backend.exception.BadRequestException;
import com.mindmate.backend.exception.ResourceNotFoundException;
import com.mindmate.backend.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepository;

    public TaskService(TaskRepository taskRepository) {
        this.taskRepository = taskRepository;
    }

    public List<TaskResponse> getAllTasks() {
        return taskRepository.findAll().stream()
                .sorted(Comparator.comparing(Task::getId).reversed())
                .map(this::toResponse)
                .toList();
    }

    public TaskResponse createTask(TaskRequest request) {
        Task task = new Task();
        apply(task, request);
        return toResponse(taskRepository.save(task));
    }

    public TaskResponse updateTask(String taskId, TaskRequest request) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
        apply(task, request);
        return toResponse(taskRepository.save(task));
    }

    public TaskResponse toggleTaskCompletion(String taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
        task.setStatus(task.getStatus() == TaskStatus.COMPLETED ? TaskStatus.PENDING : TaskStatus.COMPLETED);
        return toResponse(taskRepository.save(task));
    }

    public void deleteTask(String taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new ResourceNotFoundException("Task not found: " + taskId);
        }
        taskRepository.deleteById(taskId);
    }

    private void apply(Task task, TaskRequest request) {
        task.setTitle(request.title().trim());
        task.setDescription(request.description().trim());
        task.setCourse(request.course().trim());
        task.setEstimatedPomodoros(request.estimatedPomodoros());
        task.setNextAction(request.nextAction().trim());
        task.setPriority(parsePriority(request.priority()));
        task.setStatus(parseStatus(request.status()));
        if (task.getDueDate() == null) {
            task.setDueDate(LocalDate.now());
        }
    }

    private Priority parsePriority(String value) {
        return switch (value.trim().toUpperCase()) {
            case "LOW" -> Priority.LOW;
            case "MEDIUM" -> Priority.MEDIUM;
            case "HIGH" -> Priority.HIGH;
            default -> throw new BadRequestException("Invalid priority: " + value);
        };
    }

    private TaskStatus parseStatus(String value) {
        return switch (value.trim().toUpperCase().replace(' ', '_')) {
            case "PENDING" -> TaskStatus.PENDING;
            case "IN_PROGRESS" -> TaskStatus.IN_PROGRESS;
            case "COMPLETED" -> TaskStatus.COMPLETED;
            default -> throw new BadRequestException("Invalid status: " + value);
        };
    }

    private TaskResponse toResponse(Task task) {
        return new TaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getCourse(),
                task.getEstimatedPomodoros(),
                task.getNextAction(),
                formatPriority(task.getPriority()),
                formatStatus(task.getStatus())
        );
    }

    private String formatPriority(Priority priority) {
        return switch (priority) {
            case LOW -> "Low";
            case MEDIUM -> "Medium";
            case HIGH -> "High";
        };
    }

    private String formatStatus(TaskStatus status) {
        return switch (status) {
            case PENDING -> "Pending";
            case IN_PROGRESS -> "In Progress";
            case COMPLETED -> "Completed";
        };
    }
}
