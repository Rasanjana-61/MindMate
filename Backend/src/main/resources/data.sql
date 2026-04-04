INSERT IGNORE INTO focus_settings (id, focus_duration, break_duration)
VALUES (1, 25, 5);

INSERT IGNORE INTO tasks (id, title, description, course, estimated_pomodoros, next_action, priority, status, due_date)
VALUES
    ('task-1', 'Prepare HCI viva slides', 'Refine the final 6 slides and add the system architecture diagram.', 'HCI 302', 3, 'Finalize slide flow and rehearse the system demonstration once.', 'HIGH', 'IN_PROGRESS', '2026-03-22'),
    ('task-2', 'Read database normalization chapter', 'Review 1NF to BCNF examples before the quiz.', 'CS 214', 2, 'Summarize each form in one page with one worked example.', 'MEDIUM', 'PENDING', '2026-03-21'),
    ('task-3', 'Submit mobile UX reflection', 'Upload the final reflection to the LMS before 8 PM.', 'SE 318', 1, 'Double-check citations and exported PDF before submission.', 'HIGH', 'COMPLETED', '2026-03-20');
