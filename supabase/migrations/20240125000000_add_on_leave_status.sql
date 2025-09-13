-- Add 'on_leave' status to student_status enum
-- This migration adds the 'on_leave' option to the existing student_status enum

ALTER TYPE student_status ADD VALUE 'on_leave';