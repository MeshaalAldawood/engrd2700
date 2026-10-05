# ENGRD 2700 Exam Tutor

Exam-first tutor for Cornell ENGRD 2700, Fall 2026.

## Architecture
- GitHub: static tutor UI and curriculum/problem bank
- Supabase: sessions, attempts, mastery, snapshots and events
- ChatGPT: reads Supabase to diagnose weak skills and adapt the study plan

## Mastery levels
- 0 = not demonstrated
- 1 = guided success
- 2 = independent success
- 3 = mixed-problem success
- 4 = timed success

The app stores a local backup in localStorage and syncs attempts to the ENGRD2700 Supabase project.

## Files
- index.html — tutor UI
- styles.css — UI styling
- curriculum.js — mastery map and problem bank
- app.js — adaptive selection, scoring and Supabase sync

This is deliberately build-step free so it can be edited and deployed quickly before the prelim.
