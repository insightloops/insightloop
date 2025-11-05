Ingest Many Feedback Entries
-------

Let’s say we receive:

187 feedback entries over 30 days

These come from surveys, support tickets, interviews, Slack threads, etc. Each feedback item has:
A text body
A user ID (with metadata like plan, segment, usage)
A timestamp
(Optional) manually added tags


THEN

Feedback Enrichment
-------

For each feedback entry:
	•	Tag product area → e.g., “onboarding”
	•	Extract sentiment → e.g., “negative / confused”
	•	Map to user segment → e.g., “Pro plan”, “team size 1–3”
	•	(Optionally) link to a feature or module


THEN

Semantic Clustering
-------

AI groups feedback with similar meaning by running an AI-powered thematic clustering model (like BERTopic or GPT embedding clustering) to find patterns of similar complaints/observations.

THEN

Insight Generator
-------

Generate a Structured Insight per Cluster using a structured AI prompt:
“Summarize this cluster [cluster context] of 41 feedback entries from [segment metadata]. What is the common pain, how severe is it, and what do they want?”

THEN

Insight Scorer
-------

Each insight is scored based on:
How many users reported this (volume)
How valuable those users are (Pro plans, high usage, etc.)
How recent the signals are
Whether the insight aligns with company OKRs

This gives a numerical insight score which is used to sort and prioritize.

