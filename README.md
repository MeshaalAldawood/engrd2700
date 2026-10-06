# ENGRD 2700 Exam Tutor

Exam-first tutor for Cornell ENGRD 2700, Fall 2026.

## Architecture
- GitHub: static tutor UI and curriculum/problem bank
- Supabase: sessions, attempts, mastery, snapshots and events
- ChatGPT: reads Supabase to diagnose weak skills and adapt the study plan

## Learning design
The tutor covers 27 exam skills with 5 deliberately different problems per skill (135 total).

Each skill includes:
- recognition cue
- mental model
- core rule
- why it matters / transfer context
- common trap
- transfer check

Each five-problem set moves through:
1. guided/conceptual acquisition
2. independent execution
3. second independent variation
4. mixed/transfer recognition
5. timed/exam-style check

Contexts intentionally rotate between exam-native abstraction and meaningful applications such as tennis, product/startup metrics, software/bug reports, student life, and operational systems. The goal is transfer, not memorizing one story.

Confidence is retained as a metacognitive signal:
- high confidence + wrong increases priority for a different problem from the same skill
- low confidence + correct triggers verification rather than trusting one success
- confidence does not directly inflate mastery

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
- curriculum.js — 27-skill learning map and 135-problem bank
- app.js — adaptive selection, scoring, confidence calibration and Supabase sync
- TUTOR_HANDOFF.md — protocol for ChatGPT tutoring sessions

This is deliberately build-step free so it can be edited and deployed quickly before the prelim.
